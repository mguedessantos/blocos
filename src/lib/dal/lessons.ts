import "server-only";
import { cache } from "react";
import { awardBadges } from "./badges";
import { Prisma } from "@/generated/prisma/client";
import { compileProject, normalizeProject } from "../blocks/project";
import { checkProject, checksSchema, type CheckResult } from "../checker";
import { readSb3 } from "../sb3/project";
import { deleteFile, getFile, putFile } from "../storage";
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

// Só para testes locais: alunos em DESBLOQUEAR_ALUNOS (ex.: "ana") veem todas as lições abertas. Nunca vale em produção.
// cache(): uma consulta por página, mesmo com várias trilhas.
const unlockedForTests = cache(async (userId: string) => {
  const names = (process.env.DESBLOQUEAR_ALUNOS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.length || process.env.VERCEL_ENV === "production") return false;
  const u = await db.user.findUnique({ where: { id: userId }, select: { username: true, role: true } });
  return u?.role === "STUDENT" && !!u.username && names.includes(u.username);
});

export const TRIAL_LOCK_MESSAGE = "No teste grátis só o nível Básico fica aberto. O acesso completo vem com a assinatura.";
const lockedMessage = (trial: boolean) => (trial ? TRIAL_LOCK_MESSAGE : "Conclua a lição anterior primeiro.");

/** Teste grátis (cadastro sem pagamento e sem liberação do dono): só o nível Básico abre. */
export const TRIAL_MAX_LEVEL = 1;
export const trialOnlyBasic = cache(async (organizationId: string | null) => {
  if (!organizationId) return false;
  const sub = await db.subscription.findUnique({ where: { organizationId }, select: { status: true } });
  return sub?.status === "TRIAL";
});

/** Lições de várias trilhas (uma consulta só), com o progresso do aluno e a liberação em sequência. */
async function lessonsByTrack(user: CurrentUser, trackIds: string[]) {
  const userId = user.id;
  const [unlocked, trial] = await Promise.all([unlockedForTests(userId), trialOnlyBasic(user.organizationId)]);
  const lessons = await db.lesson.findMany({
    where: { module: { trackId: { in: trackIds } }, draft: false },
    orderBy: lessonOrder,
    select: {
      id: true, title: true, type: true, xp: true,
      module: { select: { id: true, title: true, trackId: true, track: { select: { level: true } } } },
      progress: { where: { userId }, select: { status: true, stars: true } },
    },
  });
  // Liberação em sequência: cada lição abre quando a anterior da mesma trilha foi concluída.
  const prevDone = new Map<string, boolean>();
  const out = new Map<string, ReturnType<typeof toItem>[]>(trackIds.map((id) => [id, []]));
  function toItem(l: (typeof lessons)[number]) {
    const p = l.progress[0];
    const done = p?.status === "CONCLUIDO";
    const { trackId, track, ...module } = l.module;
    const trialLocked = trial && track.level > TRIAL_MAX_LEVEL;
    const item = { id: l.id, title: l.title, type: l.type, xp: l.xp, module, done, stars: p?.stars ?? 0, trialLocked, locked: trialLocked || (prevDone.get(trackId) === false && !unlocked) };
    prevDone.set(trackId, done);
    return item;
  }
  for (const l of lessons) out.get(l.module.trackId)!.push(toItem(l));
  return out;
}

const trackLessons = async (user: CurrentUser, trackId: string) => (await lessonsByTrack(user, [trackId])).get(trackId)!;

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
  const [byTrack, trial] = await Promise.all([lessonsByTrack(user, courses.flatMap((c) => c.tracks.map((t) => t.id))), trialOnlyBasic(user.organizationId)]);
  return courses.map((c) => ({
    ...c,
    tracks: c.tracks.map((t) => {
      const lessons = byTrack.get(t.id)!;
      return { ...t, trialLocked: trial && t.level > TRIAL_MAX_LEVEL, total: lessons.length, done: lessons.filter((l) => l.done).length, next: lessons.find((l) => !l.done && !l.locked) };
    }),
  }));
}

export async function getStudentTrack(user: CurrentUser, trackId: string) {
  const track = await db.track.findFirst({
    where: { id: trackId, ...visibleTracksWhere(user) },
    select: { id: true, title: true, description: true, story: true, courseId: true, level: true, order: true },
  });
  if (!track) throw new AccessError("Trilha não encontrada.");
  // número do mundo dentro do curso (define a ilha desenhada)
  const before = track.courseId
    ? await db.track.count({
        where: { courseId: track.courseId, published: true, OR: [{ level: { lt: track.level } }, { level: track.level, order: { lt: track.order } }] },
      })
    : 0;
  const { courseId: _c, level: _l, order: _o, ...rest } = track;
  void _c; void _l; void _o;
  return { ...rest, worldIndex: before + 1, lessons: await trackLessons(user, track.id) };
}

export async function getStudentLesson(user: CurrentUser, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, draft: false, module: { track: visibleTracksWhere(user) } },
    include: { module: { select: { title: true, track: { select: { id: true, title: true } } } } },
  });
  if (!lesson) throw new AccessError("Lição não encontrada.");
  const lessons = await trackLessons(user, lesson.module.track.id);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const me = lessons[idx];
  return {
    lesson,
    locked: me.locked,
    trialLocked: me.trialLocked,
    done: me.done,
    stars: me.stars,
    position: { index: idx + 1, total: lessons.length },
    nextLessonId: lessons[idx + 1]?.id ?? null,
  };
}

/** Blocos da última tentativa verificada (para reabrir a lição quando não há projeto salvo). */
export async function lastWorkspace(user: CurrentUser, lessonId: string) {
  const last = await db.submission.findFirst({ where: { userId: user.id, lessonId }, orderBy: { createdAt: "desc" }, select: { workspace: true } });
  return last?.workspace ?? null;
}

const MAX_WORKSPACE_BYTES = 200_000;

export type NewBadge = { id: string; name: string; icon: string };
export type AttemptOutcome = { ok: true; result: CheckResult; xpGained: number; newBadges: NewBadge[] } | { ok: false; error: string };

/** Verifica no SERVIDOR (o resultado do navegador nunca é confiável) e registra o progresso. */
export async function submitAttempt(user: CurrentUser, lessonId: string, workspaceJson: string): Promise<AttemptOutcome> {
  const { lesson, locked, trialLocked } = await getStudentLesson(user, lessonId);
  if (locked) return { ok: false, error: lockedMessage(trialLocked) };
  if (lesson.type === "TEORIA") return { ok: false, error: "Esta lição não tem exercício." };
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
  return { ok: true, result, xpGained, newBadges: await awardBadges(user) };
}

/** Lições de teoria/demonstração: concluir é só marcar como lida. */
export async function completeTheory(user: CurrentUser, lessonId: string) {
  const { lesson, locked, trialLocked, nextLessonId } = await getStudentLesson(user, lessonId);
  if (locked) return { ok: false as const, error: lockedMessage(trialLocked) };
  if (lesson.type !== "TEORIA" && lesson.type !== "DEMO") return { ok: false as const, error: "Resolva o exercício para concluir." };
  const xpGained = await recordProgress(user, lesson.id, lesson.xp, true, 3, null);
  return { ok: true as const, xpGained, newBadges: await awardBadges(user), nextLessonId, trackId: lesson.module.track.id };
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
          modules: { select: { lessons: { where: { draft: false }, select: { type: true } } } },
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

// ───────────── Projeto do editor de blocos (.sb3 completo, por aluno e lição) ─────────────

/** Guarda o último .sb3 do aluno nesta lição (substitui o anterior). Lança Sb3Error se o arquivo não for um projeto. */
export async function saveLessonProject(user: CurrentUser, lessonId: string, bytes: Uint8Array) {
  const { lesson, locked, trialLocked } = await getStudentLesson(user, lessonId);
  if (locked) throw new AccessError(lockedMessage(trialLocked));
  await readSb3(bytes); // valida: zip com project.json, dentro do limite
  const key = await putFile("projetos", bytes);
  const where = { userId_lessonId: { userId: user.id, lessonId: lesson.id } };
  const old = await db.progress.findUnique({ where, select: { projectKey: true } });
  const savedAt = new Date();
  await db.progress.upsert({ where, create: { userId: user.id, lessonId: lesson.id, projectKey: key, projectSavedAt: savedAt }, update: { projectKey: key, projectSavedAt: savedAt } });
  if (old?.projectKey) await deleteFile(old.projectKey).catch(() => {});
  return savedAt;
}

/** O último .sb3 guardado deste aluno nesta lição, ou null. */
export async function getLessonProject(user: CurrentUser, lessonId: string) {
  const { lesson } = await getStudentLesson(user, lessonId);
  const p = await db.progress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } }, select: { projectKey: true, projectSavedAt: true } });
  if (!p?.projectKey || !p.projectSavedAt) return null;
  return { bytes: await getFile(p.projectKey), savedAt: p.projectSavedAt };
}

/** "Recomeçar": apaga o projeto guardado (a lição volta ao projeto inicial). */
export async function clearLessonProject(user: CurrentUser, lessonId: string) {
  const { lesson } = await getStudentLesson(user, lessonId);
  const where = { userId_lessonId: { userId: user.id, lessonId: lesson.id } };
  const p = await db.progress.findUnique({ where, select: { projectKey: true } });
  if (!p?.projectKey) return;
  await db.progress.update({ where, data: { projectKey: null, projectSavedAt: null } });
  await deleteFile(p.projectKey).catch(() => {});
}

// ───────────── Professor dando aula (projeção) ─────────────

/** Uma lição do currículo para o professor, com a trilha e as vizinhas (para navegar durante a aula). */
export async function getCatalogLesson(user: CurrentUser, lessonId: string) {
  const found = await db.lesson.findFirst({ where: { id: lessonId, draft: false }, select: { module: { select: { trackId: true } } } });
  if (!found) throw new AccessError("Lição não encontrada.");
  const track = await getCatalogTrack(user, found.module.trackId); // confere o acesso ao curso
  const all = track.modules.flatMap((m) => m.lessons);
  const i = all.findIndex((l) => l.id === lessonId);
  return { track, lesson: all[i], index: i + 1, total: all.length, prevId: all[i - 1]?.id ?? null, nextId: all[i + 1]?.id ?? null };
}

/** O professor resolvendo junto com a turma: verifica igual ao aluno, mas NÃO grava progresso nem XP. */
export async function previewAttempt(user: CurrentUser, lessonId: string, workspaceJson: string): Promise<{ ok: true; result: CheckResult } | { ok: false; error: string }> {
  const { lesson } = await getCatalogLesson(user, lessonId);
  if (lesson.type === "TEORIA") return { ok: false, error: "Esta lição não tem exercício no editor." };
  if (typeof workspaceJson !== "string" || workspaceJson.length > MAX_WORKSPACE_BYTES) return { ok: false, error: "Programa grande demais." };
  let workspace: ReturnType<typeof normalizeProject>;
  try {
    const parsed: unknown = JSON.parse(workspaceJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    workspace = normalizeProject(parsed);
  } catch {
    return { ok: false, error: "Não consegui ler o programa. Tente de novo." };
  }
  const checks = checksSchema.safeParse(lesson.checks ?? { checks: [] });
  if (!checks.success) return { ok: false, error: "Esta lição está com a verificação mal configurada." };
  return { ok: true, result: checkProject(compileProject(workspace), checks.data) };
}
