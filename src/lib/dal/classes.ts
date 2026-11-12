import "server-only";
import bcrypt from "bcryptjs";
import { generateClassCode, generateKidPassword, generateUsername } from "../credentials";
import { db } from "../db";
import type { CurrentUser } from "./auth";
import { assertCanAddClass, assertCanAddStudents } from "./billing";

// Regras: professor só mexe nas próprias turmas; coordenação (ORG_ADMIN) em todas da organização.

export class AccessError extends Error {}

function orgOf(user: CurrentUser) {
  if (!user.organizationId || !["TEACHER", "ORG_ADMIN"].includes(user.role)) throw new AccessError("Acesso negado.");
  return user.organizationId;
}

function classScope(user: CurrentUser) {
  const organizationId = orgOf(user);
  return user.role === "TEACHER" ? { organizationId, teacherId: user.id } : { organizationId };
}

async function requireClass(user: CurrentUser, classId: string) {
  const klass = await db.class.findFirst({ where: { id: classId, ...classScope(user) } });
  if (!klass) throw new AccessError("Turma não encontrada.");
  return klass;
}

/** Aluno da organização que está em alguma turma acessível ao usuário. */
async function requireStudent(user: CurrentUser, studentId: string) {
  const student = await db.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      organizationId: orgOf(user),
      ...(user.role === "TEACHER" ? { enrollments: { some: { class: { teacherId: user.id } } } } : {}),
    },
  });
  if (!student) throw new AccessError("Aluno não encontrado.");
  return student;
}

async function audit(user: CurrentUser, action: string, target: string, metadata?: object) {
  await db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, action, target, metadata } });
}

// ───────────── Turmas ─────────────

export async function getClassDetail(user: CurrentUser, classId: string) {
  await requireClass(user, classId);
  return db.class.findUniqueOrThrow({
    where: { id: classId },
    include: {
      teacher: { select: { id: true, name: true } },
      enrollments: {
        where: { user: { deletedAt: null } },
        include: { user: { select: { id: true, name: true, username: true, active: true, lastLoginAt: true, xp: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
}

export async function listOrgTeachers(user: CurrentUser) {
  return db.user.findMany({
    where: { organizationId: orgOf(user), role: { in: ["TEACHER", "ORG_ADMIN"] }, active: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

async function uniqueClassCode() {
  for (let i = 0; i < 20; i++) {
    const code = generateClassCode();
    if (!(await db.class.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
  throw new Error("Não foi possível gerar um código de turma.");
}

export async function createClass(user: CurrentUser, name: string, teacherId?: string) {
  const organizationId = orgOf(user);
  const limit = await assertCanAddClass(user);
  if (!limit.ok) return limit;

  let teacher = user.id;
  if (teacherId && teacherId !== user.id) {
    if (user.role !== "ORG_ADMIN") throw new AccessError("Só a coordenação escolhe outro professor.");
    const t = await db.user.findFirst({ where: { id: teacherId, organizationId, role: { in: ["TEACHER", "ORG_ADMIN"] } } });
    if (!t) throw new AccessError("Professor não encontrado.");
    teacher = t.id;
  }
  const klass = await db.class.create({
    data: { name, code: await uniqueClassCode(), organizationId, teacherId: teacher },
  });
  await audit(user, "turma.criar", klass.id, { name });
  return { ok: true as const, classId: klass.id };
}

export async function renameClass(user: CurrentUser, classId: string, name: string) {
  await requireClass(user, classId);
  await db.class.update({ where: { id: classId }, data: { name } });
}

export async function archiveClass(user: CurrentUser, classId: string) {
  await requireClass(user, classId);
  await db.class.update({ where: { id: classId }, data: { archived: true } });
  await audit(user, "turma.arquivar", classId);
}

// ───────────── Alunos ─────────────

export type IssuedCredential = { id: string; name: string; username: string; password: string };

/** Cria alunos e devolve as senhas em texto UMA única vez (para os cartões de acesso). */
export async function addStudents(user: CurrentUser, classId: string, names: string[]) {
  const klass = await requireClass(user, classId);
  const limit = await assertCanAddStudents(user, names.length);
  if (!limit.ok) return limit;

  const taken = new Set(
    (await db.user.findMany({ where: { organizationId: klass.organizationId, username: { not: null } }, select: { username: true } }))
      .map((u) => u.username!),
  );
  const prepared = await Promise.all(
    names.map(async (name) => {
      const password = generateKidPassword();
      return { name, username: generateUsername(name, taken), password, passwordHash: await bcrypt.hash(password, 10) };
    }),
  );

  const created = await db.$transaction(
    prepared.map((s) =>
      db.user.create({
        data: {
          role: "STUDENT",
          name: s.name,
          username: s.username,
          passwordHash: s.passwordHash,
          organizationId: klass.organizationId,
          enrollments: { create: { classId } },
        },
        select: { id: true },
      }),
    ),
  );
  await audit(user, "alunos.criar", classId, { quantidade: names.length });
  const credentials: IssuedCredential[] = prepared.map((s, i) => ({ id: created[i].id, name: s.name, username: s.username, password: s.password }));
  return { ok: true as const, credentials };
}

/** Gera novas senhas (usado para reimprimir cartões ou quando o aluno esquece). */
export async function resetStudentPasswords(user: CurrentUser, classId: string, studentIds: string[]) {
  await requireClass(user, classId);
  const students = await db.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT", enrollments: { some: { classId } } },
    select: { id: true, name: true, username: true },
  });
  const issued = await Promise.all(
    students.map(async (s) => {
      const password = generateKidPassword();
      return { ...s, password, passwordHash: await bcrypt.hash(password, 10) };
    }),
  );
  await db.$transaction(issued.map((s) => db.user.update({ where: { id: s.id }, data: { passwordHash: s.passwordHash } })));
  await audit(user, "alunos.nova-senha", classId, { quantidade: issued.length });
  return issued.map((s) => ({ id: s.id, name: s.name, username: s.username!, password: s.password }));
}

export async function setStudentActive(user: CurrentUser, studentId: string, active: boolean) {
  await requireStudent(user, studentId);
  await db.user.update({ where: { id: studentId }, data: { active } });
  await audit(user, active ? "aluno.reativar" : "aluno.desativar", studentId);
}

/** LGPD: exclusão definitiva do aluno e de tudo ligado a ele (cascata no banco). */
export async function deleteStudent(user: CurrentUser, studentId: string) {
  await requireStudent(user, studentId);
  await db.user.delete({ where: { id: studentId } });
  await audit(user, "aluno.excluir", studentId);
}

/** LGPD: exportação dos dados de um aluno. */
export async function exportStudentData(user: CurrentUser, studentId: string) {
  await requireStudent(user, studentId);
  const data = await db.user.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      name: true, username: true, avatar: true, xp: true, createdAt: true, lastLoginAt: true, active: true,
      enrollments: { select: { createdAt: true, class: { select: { name: true } } } },
      progress: { select: { status: true, stars: true, attempts: true, updatedAt: true, lesson: { select: { title: true } } } },
      submissions: { select: { createdAt: true, stars: true, result: true, teacherComment: true, sb3Url: true, lesson: { select: { title: true } } } },
      badges: { select: { awardedAt: true, badge: { select: { name: true } } } },
      jamMemberships: { select: { team: { select: { name: true, jam: { select: { title: true } } } } } },
    },
  });
  await audit(user, "aluno.exportar", studentId);
  return data;
}

// ───────────── Painel do professor: progresso da turma ─────────────

/** Mapa de calor alunos × lições de uma trilha dos cursos liberados para a turma. */
export async function getClassProgress(user: CurrentUser, classId: string, trackId?: string) {
  await requireClass(user, classId);
  const tracks = await db.track.findMany({
    where: { published: true, course: { assignments: { some: { classId } } } },
    orderBy: [{ course: { order: "asc" } }, { level: "asc" }, { order: "asc" }],
    select: { id: true, title: true },
  });
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
  if (!track) return { tracks, track: null, lessons: [], students: [] };

  const [lessons, students] = await Promise.all([
    db.lesson.findMany({
      where: { module: { trackId: track.id }, draft: false },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
      select: { id: true, title: true, optional: true },
    }),
    db.user.findMany({
      where: { role: "STUDENT", deletedAt: null, enrollments: { some: { classId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, lastLoginAt: true },
    }),
  ]);
  const progress = await db.progress.findMany({
    where: { userId: { in: students.map((s) => s.id) }, lessonId: { in: lessons.map((l) => l.id) } },
    select: { userId: true, lessonId: true, status: true, stars: true, attempts: true },
  });
  const cell = new Map(progress.map((p) => [`${p.userId}:${p.lessonId}`, p]));
  const required = lessons.filter((l) => !l.optional);

  return {
    tracks,
    track,
    lessons,
    students: students.map((s) => {
      const cells = lessons.map((l) => {
        const p = cell.get(`${s.id}:${l.id}`);
        return { lessonId: l.id, done: p?.status === "CONCLUIDO", stars: p?.stars ?? 0, attempts: p?.attempts ?? 0 };
      });
      const doneRequired = cells.filter((c, i) => c.done && !lessons[i].optional).length;
      // "travado": 3+ tentativas sem concluir na primeira lição obrigatória pendente
      const firstPending = cells.find((c, i) => !lessons[i].optional && !c.done);
      return {
        ...s,
        cells,
        done: doneRequired,
        total: required.length,
        stuck: Boolean(firstPending && firstPending.attempts >= 3),
      };
    }),
  };
}
