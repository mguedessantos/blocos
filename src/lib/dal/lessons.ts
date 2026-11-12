import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { compileProject, normalizeProject } from "../blocks/project";
import { checkModel, checkProject, checksSchema, type CheckResult } from "../checker";
import { modelFromSb3, Sb3Error } from "../sb3/project";
import { db } from "../db";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

// O professor libera CURSOS para a turma. Trilhas visíveis a um aluno = trilhas publicadas
// de cursos publicados (oficiais ou da própria escola) liberados para uma turma ativa dele.

function visibleCoursesWhere(user: CurrentUser) {
  if (user.role !== "STUDENT" || !user.organizationId) throw new AccessError("Acesso negado.");
  return {
    published: true,
    comingSoon: false,
    OR: [{ organizationId: null }, { organizationId: user.organizationId }],
    assignments: { some: { class: { archived: false, enrollments: { some: { userId: user.id } } } } },
  };
}

function visibleTracksWhere(user: CurrentUser) {
  return { published: true, course: visibleCoursesWhere(user) };
}

const lessonOrder = [{ module: { order: "asc" as const } }, { order: "asc" as const }];

async function trackLessons(userId: string, trackId: string) {
  const lessons = await db.lesson.findMany({
    where: { module: { trackId }, draft: false },
    orderBy: lessonOrder,
    select: {
      id: true, title: true, type: true, xp: true, mode: true, optional: true,
      module: { select: { id: true, title: true } },
      progress: { where: { userId }, select: { status: true, stars: true } },
    },
  });
  // Liberação em sequência: cada lição abre quando a lição OBRIGATÓRIA anterior foi concluída.
  // Missões opcionais (ex.: levar ao PictoBlox) nunca bloqueiam o caminho.
  let prevDone = true;
  return lessons.map((l) => {
    const p = l.progress[0];
    const done = p?.status === "CONCLUIDO";
    const item = { id: l.id, title: l.title, type: l.type, mode: l.mode, optional: l.optional, xp: l.xp, module: l.module, done, stars: p?.stars ?? 0, locked: !prevDone };
    if (!l.optional) prevDone = done;
    return item;
  });
}

/** Cursos liberados para o aluno, com o progresso de cada trilha. */
export async function listStudentCourses(user: CurrentUser) {
  const courses = await db.course.findMany({
    where: visibleCoursesWhere(user),
    orderBy: { order: "asc" },
    select: {
      id: true, title: true, description: true,
      tracks: { where: { published: true }, orderBy: [{ level: "asc" }, { order: "asc" }], select: { id: true, title: true, description: true, level: true } },
    },
  });
  return Promise.all(
    courses.map(async (c) => ({
      ...c,
      tracks: await Promise.all(
        c.tracks.map(async (t) => {
          const lessons = await trackLessons(user.id, t.id);
          const required = lessons.filter((l) => !l.optional);
          return {
            ...t,
            total: required.length,
            done: required.filter((l) => l.done).length,
            extras: lessons.length - required.length,
            next: required.find((l) => !l.done && !l.locked),
          };
        }),
      ),
    })),
  );
}

export async function getStudentTrack(user: CurrentUser, trackId: string) {
  const track = await db.track.findFirst({ where: { id: trackId, ...visibleTracksWhere(user) }, select: { id: true, title: true, description: true, story: true } });
  if (!track) throw new AccessError("Trilha não encontrada.");
  return { ...track, lessons: await trackLessons(user.id, track.id) };
}

export async function getStudentLesson(user: CurrentUser, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, draft: false, module: { track: visibleTracksWhere(user) } },
    include: { module: { select: { title: true, track: { select: { id: true, title: true } } } } },
  });
  if (!lesson) throw new AccessError("Lição não encontrada.");
  const lessons = await trackLessons(user.id, lesson.module.track.id);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const me = lessons[idx];
  const lastSubmission = await db.submission.findFirst({
    where: { userId: user.id, lessonId },
    orderBy: { createdAt: "desc" },
    select: { workspace: true },
  });
  return {
    lesson,
    locked: me.locked,
    done: me.done,
    stars: me.stars,
    position: { index: idx + 1, total: lessons.length },
    nextLessonId: lessons.slice(idx + 1).find((l) => !l.optional)?.id ?? null,
    savedWorkspace: lastSubmission?.workspace ?? null,
  };
}

const MAX_WORKSPACE_BYTES = 200_000;

export type AttemptOutcome = { ok: true; result: CheckResult; xpGained: number } | { ok: false; error: string };

/** Verifica no SERVIDOR (o resultado do navegador nunca é confiável) e registra o progresso. */
export async function submitAttempt(user: CurrentUser, lessonId: string, workspaceJson: string): Promise<AttemptOutcome> {
  const { lesson, locked } = await getStudentLesson(user, lessonId);
  if (locked) return { ok: false, error: "Conclua a lição anterior primeiro." };
  if (lesson.type === "TEORIA") return { ok: false, error: "Esta lição não tem exercício." };
  if (lesson.mode === "SB3") return { ok: false, error: "Esta missão é feita no PictoBlox: envie o arquivo .sb3." };
  if (typeof workspaceJson !== "string" || workspaceJson.length > MAX_WORKSPACE_BYTES) return { ok: false, error: "Programa grande demais." };
  let workspace: ReturnType<typeof normalizeProject>;
  try {
    const parsed: unknown = JSON.parse(workspaceJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    workspace = normalizeProject(parsed);
  } catch {
    return { ok: false, error: "Não consegui ler o seu programa. Tente de novo." };
  }

  const parsedChecks = checksSchema.safeParse(lesson.checks ?? { checks: [] });
  if (!parsedChecks.success) return { ok: false, error: "Esta lição está com a verificação mal configurada. Avise seu professor." };
  const result = checkProject(compileProject(workspace), parsedChecks.data);

  const xpGained = await recordProgress(user, lesson.id, lesson.xp, result.passed, result.stars, {
    workspace,
    result: { passed: result.passed, stars: result.stars, items: result.items },
  });
  return { ok: true, result, xpGained };
}

/** Missões feitas no PictoBlox: o aluno envia o .sb3 e o servidor verifica a estrutura do projeto. */
export async function submitSb3Attempt(user: CurrentUser, lessonId: string, bytes: Uint8Array): Promise<AttemptOutcome> {
  const { lesson, locked } = await getStudentLesson(user, lessonId);
  if (locked) return { ok: false, error: "Conclua a lição anterior primeiro." };
  if (lesson.mode === "EDITOR" || lesson.type === "TEORIA" || lesson.type === "DEMO") return { ok: false, error: "Esta lição é feita aqui no site, no editor de blocos." };
  const parsedChecks = checksSchema.safeParse(lesson.checks ?? { checks: [] });
  if (!parsedChecks.success) return { ok: false, error: "Esta lição está com a verificação mal configurada. Avise seu professor." };

  let result: CheckResult;
  try {
    result = checkModel(await modelFromSb3(bytes), parsedChecks.data);
  } catch (err) {
    if (err instanceof Sb3Error) return { ok: false, error: err.message };
    throw err;
  }
  const xpGained = await recordProgress(user, lesson.id, lesson.xp, result.passed, result.stars, {
    workspace: null,
    result: { passed: result.passed, stars: result.stars, items: result.items, origem: "sb3", bytes: bytes.byteLength },
  });
  return { ok: true, result, xpGained };
}

/** Lições de teoria/demonstração: concluir é só marcar como lida. */
export async function completeTheory(user: CurrentUser, lessonId: string) {
  const { lesson, locked } = await getStudentLesson(user, lessonId);
  if (locked) return { ok: false as const, error: "Conclua a lição anterior primeiro." };
  if (lesson.type !== "TEORIA" && lesson.type !== "DEMO") return { ok: false as const, error: "Resolva o exercício para concluir." };
  const xpGained = await recordProgress(user, lesson.id, lesson.xp, true, 3, null);
  return { ok: true as const, xpGained };
}

async function recordProgress(
  user: CurrentUser,
  lessonId: string,
  xp: number,
  passed: boolean,
  stars: number,
  submission: { workspace: object | null; result: object } | null,
) {
  return db.$transaction(async (tx) => {
    const prev = await tx.progress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
    const firstCompletion = passed && prev?.status !== "CONCLUIDO";
    await tx.progress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, status: passed ? "CONCLUIDO" : "EM_ANDAMENTO", stars, attempts: submission ? 1 : 0 },
      update: {
        status: passed || prev?.status === "CONCLUIDO" ? "CONCLUIDO" : "EM_ANDAMENTO",
        stars: Math.max(stars, prev?.stars ?? 0),
        attempts: { increment: submission ? 1 : 0 },
      },
    });
    if (submission) {
      await tx.submission.create({
        data: { userId: user.id, lessonId, workspace: submission.workspace ?? Prisma.DbNull, result: submission.result, stars },
      });
    }
    if (firstCompletion) await tx.user.update({ where: { id: user.id }, data: { xp: { increment: xp } } });
    return firstCompletion ? xp : 0;
  });
}

// ───────────── Professor: liberar cursos para a turma ─────────────

export async function listAssignableCourses(user: CurrentUser, classId: string) {
  if (!user.organizationId) throw new AccessError("Acesso negado.");
  const klass = await db.class.findFirst({
    where: { id: classId, organizationId: user.organizationId, ...(user.role === "TEACHER" ? { teacherId: user.id } : {}) },
    select: { id: true, courses: { select: { courseId: true } } },
  });
  if (!klass) throw new AccessError("Turma não encontrada.");
  const courses = await db.course.findMany({
    where: { published: true, OR: [{ organizationId: null }, { organizationId: user.organizationId }] },
    orderBy: { order: "asc" },
    select: { id: true, title: true, description: true, comingSoon: true, _count: { select: { tracks: { where: { published: true } } } } },
  });
  const assigned = new Set(klass.courses.map((a) => a.courseId));
  return courses.map((c) => ({
    id: c.id, title: c.title, description: c.description, comingSoon: c.comingSoon, tracks: c._count.tracks, assigned: assigned.has(c.id),
  }));
}

export async function setCourseAssignment(user: CurrentUser, classId: string, courseId: string, assigned: boolean) {
  const course = (await listAssignableCourses(user, classId)).find((c) => c.id === courseId); // valida turma e curso
  if (!course) throw new AccessError("Curso não encontrado.");
  if (assigned) {
    if (course.comingSoon) throw new AccessError("Este curso ainda não está disponível.");
    await db.courseAssignment.upsert({ where: { classId_courseId: { classId, courseId } }, create: { classId, courseId }, update: {} });
  } else {
    await db.courseAssignment.deleteMany({ where: { classId, courseId } });
  }
}

// ───────────── Catálogo para professores (com guia do professor) ─────────────

function catalogWhere(user: CurrentUser) {
  if (!user.organizationId || !["TEACHER", "ORG_ADMIN"].includes(user.role)) throw new AccessError("Acesso negado.");
  return { published: true, OR: [{ organizationId: null }, { organizationId: user.organizationId }] };
}

export async function listCatalogCourses(user: CurrentUser) {
  return db.course.findMany({
    where: catalogWhere(user),
    orderBy: { order: "asc" },
    select: {
      id: true, title: true, description: true, comingSoon: true,
      tracks: {
        where: { published: true },
        orderBy: [{ level: "asc" }, { order: "asc" }],
        select: {
          id: true, title: true, description: true, level: true,
          modules: { select: { lessons: { where: { draft: false }, select: { mode: true, type: true, optional: true } } } },
        },
      },
    },
  });
}

export async function getCatalogTrack(user: CurrentUser, trackId: string) {
  const track = await db.track.findFirst({
    where: { id: trackId, ...catalogWhere(user), course: catalogWhere(user) },
    include: {
      course: { select: { title: true } },
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { where: { draft: false }, orderBy: { order: "asc" } } },
      },
    },
  });
  if (!track) throw new AccessError("Trilha não encontrada.");
  return track;
}
