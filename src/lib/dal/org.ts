import "server-only";
import { db } from "../db";
import { tenantUrl } from "../url";
import type { CurrentUser } from "./auth";

// Todas as consultas recebem o usuário e filtram pela organização dele.
function orgOf(user: CurrentUser) {
  if (!user.organizationId) throw new Error("Usuário sem organização.");
  return user.organizationId;
}

export async function getOrgOverview(user: CurrentUser) {
  const organizationId = orgOf(user);
  const [org, students, teachers, classes] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: { subscription: { include: { plan: true } } },
    }),
    db.user.count({ where: { organizationId, role: "STUDENT", deletedAt: null } }),
    db.user.findMany({
      where: { organizationId, role: { in: ["TEACHER", "ORG_ADMIN"] }, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    }),
    db.class.count({ where: { organizationId, archived: false } }),
  ]);
  return { org, students, teachers, classes };
}

export async function listTeacherClasses(user: CurrentUser) {
  const organizationId = orgOf(user);
  return db.class.findMany({
    where: {
      organizationId,
      archived: false,
      ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
    },
    include: { _count: { select: { enrollments: { where: { user: { deletedAt: null } } } } }, teacher: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listStudentClasses(user: CurrentUser) {
  return db.class.findMany({
    where: { organizationId: orgOf(user), enrollments: { some: { userId: user.id } } },
    select: { id: true, name: true, teacher: { select: { name: true } } },
  });
}

/** Endereço de login dos alunos (domínio próprio verificado, senão o subdomínio). */
export async function getStudentLoginUrl(user: CurrentUser) {
  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgOf(user) },
    select: { slug: true, domains: { where: { type: "CUSTOM", status: "VERIFICADO" }, take: 1 } },
  });
  const base = org.domains[0] ? `https://${org.domains[0].hostname}` : tenantUrl(org.slug);
  return `${base}/entrar-aluno`;
}

/** Cidade/UF da conta (usadas nos filtros e avisos da plataforma). */
export async function updateOrgLocation(user: CurrentUser, city: string, state: string) {
  if (user.role !== "ORG_ADMIN" || !user.organizationId) throw new Error("Acesso negado.");
  await db.organization.update({ where: { id: user.organizationId }, data: { city, state } });
  await db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, action: "organizacao.localizacao", target: `${city}/${state}` } });
}

// ───────────── Painel da coordenação ─────────────

const DAY = 86_400_000;

/** Visão da escola: alunos ativos, conclusão por turma e atividade dos professores. */
export async function getSchoolDashboard(user: CurrentUser) {
  const organizationId = orgOf(user);
  const week = new Date(Date.now() - 7 * DAY);
  const month = new Date(Date.now() - 30 * DAY);

  const [classes, teachers, activeWeek, doneMonth] = await Promise.all([
    db.class.findMany({
      where: { organizationId, archived: false },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, code: true,
        teacher: { select: { name: true } },
        enrollments: { where: { user: { deletedAt: null, active: true } }, select: { userId: true } },
        courses: {
          select: { course: { select: { tracks: { where: { published: true }, select: { modules: { select: { lessons: { where: { draft: false, optional: false }, select: { id: true } } } } } } } } },
        },
      },
    }),
    db.user.findMany({
      where: { organizationId, role: { in: ["TEACHER", "ORG_ADMIN"] }, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, active: true, lastLoginAt: true, teachingClasses: { where: { archived: false }, select: { _count: { select: { enrollments: true } } } } },
    }),
    db.submission.findMany({ where: { createdAt: { gte: week }, user: { organizationId, deletedAt: null } }, distinct: ["userId"], select: { userId: true } }),
    db.progress.count({ where: { status: "CONCLUIDO", updatedAt: { gte: month }, user: { organizationId, role: "STUDENT", deletedAt: null } } }),
  ]);

  const allStudents = [...new Set(classes.flatMap((c) => c.enrollments.map((e) => e.userId)))];
  const active = new Set(activeWeek.map((a) => a.userId));
  const lessonIdsByClass = classes.map((c) => [...new Set(c.courses.flatMap((a) => a.course.tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id)))))]);
  const allLessons = [...new Set(lessonIdsByClass.flat())];
  const done = allStudents.length && allLessons.length
    ? await db.progress.findMany({ where: { userId: { in: allStudents }, lessonId: { in: allLessons }, status: "CONCLUIDO" }, select: { userId: true, lessonId: true } })
    : [];
  const doneSet = new Set(done.map((d) => `${d.userId}:${d.lessonId}`));

  const classRows = classes.map((c, i) => {
    const lessons = lessonIdsByClass[i];
    const students = c.enrollments.map((e) => e.userId);
    let n = 0;
    for (const s of students) for (const l of lessons) if (doneSet.has(`${s}:${l}`)) n++;
    const possible = students.length * lessons.length;
    return {
      id: c.id, name: c.name, code: c.code, teacher: c.teacher.name,
      students: students.length,
      activeWeek: students.filter((s) => active.has(s)).length,
      completion: possible ? Math.round((100 * n) / possible) : null,
      hasCourse: lessons.length > 0,
    };
  });

  return {
    totals: { students: allStudents.length, activeWeek: allStudents.filter((s) => active.has(s)).length, doneMonth, classes: classes.length },
    classes: classRows,
    teachers: teachers.map((t) => ({
      id: t.id, name: t.name, role: t.role, active: t.active, lastLoginAt: t.lastLoginAt,
      classes: t.teachingClasses.length,
      students: t.teachingClasses.reduce((a, c) => a + c._count.enrollments, 0),
    })),
  };
}
