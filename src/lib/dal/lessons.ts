import "server-only";
import { programFromBlockly, type BlocklyState } from "../blocks/program";
import { check, checksSchema, type CheckResult } from "../checker";
import { db } from "../db";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

// Trilhas visíveis a um aluno = trilhas publicadas (oficiais ou da própria escola)
// atribuídas a alguma turma ativa em que ele está matriculado.

function visibleTracksWhere(user: CurrentUser) {
  if (user.role !== "STUDENT" || !user.organizationId) throw new AccessError("Acesso negado.");
  return {
    published: true,
    OR: [{ organizationId: null }, { organizationId: user.organizationId }],
    assignments: { some: { class: { archived: false, enrollments: { some: { userId: user.id } } } } },
  };
}

const lessonOrder = [{ module: { order: "asc" as const } }, { order: "asc" as const }];

async function trackLessons(userId: string, trackId: string) {
  const lessons = await db.lesson.findMany({
    where: { module: { trackId }, draft: false },
    orderBy: lessonOrder,
    select: {
      id: true, title: true, type: true, xp: true,
      module: { select: { id: true, title: true } },
      progress: { where: { userId }, select: { status: true, stars: true } },
    },
  });
  // Liberação em sequência: cada lição abre quando a anterior foi concluída.
  let prevDone = true;
  return lessons.map((l) => {
    const p = l.progress[0];
    const done = p?.status === "CONCLUIDO";
    const item = { id: l.id, title: l.title, type: l.type, xp: l.xp, module: l.module, done, stars: p?.stars ?? 0, locked: !prevDone };
    prevDone = done;
    return item;
  });
}

export async function listStudentTracks(user: CurrentUser) {
  const tracks = await db.track.findMany({
    where: visibleTracksWhere(user),
    orderBy: [{ level: "asc" }, { order: "asc" }],
    select: { id: true, title: true, description: true, level: true },
  });
  return Promise.all(
    tracks.map(async (t) => {
      const lessons = await trackLessons(user.id, t.id);
      return { ...t, total: lessons.length, done: lessons.filter((l) => l.done).length, next: lessons.find((l) => !l.done && !l.locked) };
    }),
  );
}

export async function getStudentTrack(user: CurrentUser, trackId: string) {
  const track = await db.track.findFirst({ where: { id: trackId, ...visibleTracksWhere(user) }, select: { id: true, title: true, description: true } });
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
    nextLessonId: lessons[idx + 1]?.id ?? null,
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
  if (typeof workspaceJson !== "string" || workspaceJson.length > MAX_WORKSPACE_BYTES) return { ok: false, error: "Programa grande demais." };
  let workspace: BlocklyState;
  try {
    const parsed: unknown = JSON.parse(workspaceJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    workspace = parsed as BlocklyState;
  } catch {
    return { ok: false, error: "Não consegui ler o seu programa. Tente de novo." };
  }

  const parsedChecks = checksSchema.safeParse(lesson.checks ?? { checks: [] });
  if (!parsedChecks.success) return { ok: false, error: "Esta lição está com a verificação mal configurada. Avise seu professor." };
  const result = check(programFromBlockly(workspace), parsedChecks.data);

  const xpGained = await recordProgress(user, lesson.id, lesson.xp, result.passed, result.stars, {
    workspace,
    result: { passed: result.passed, stars: result.stars, items: result.items },
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
  submission: { workspace: object; result: object } | null,
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
    if (submission) await tx.submission.create({ data: { userId: user.id, lessonId, workspace: submission.workspace, result: submission.result, stars } });
    if (firstCompletion) await tx.user.update({ where: { id: user.id }, data: { xp: { increment: xp } } });
    return firstCompletion ? xp : 0;
  });
}

// ───────────── Professor: atribuir trilhas à turma ─────────────

export async function listAssignableTracks(user: CurrentUser, classId: string) {
  if (!user.organizationId) throw new AccessError("Acesso negado.");
  const klass = await db.class.findFirst({
    where: { id: classId, organizationId: user.organizationId, ...(user.role === "TEACHER" ? { teacherId: user.id } : {}) },
    select: { id: true, assignments: { select: { trackId: true } } },
  });
  if (!klass) throw new AccessError("Turma não encontrada.");
  const tracks = await db.track.findMany({
    where: { published: true, OR: [{ organizationId: null }, { organizationId: user.organizationId }] },
    orderBy: [{ level: "asc" }, { order: "asc" }],
    select: { id: true, title: true, description: true, _count: { select: { modules: true } } },
  });
  const assigned = new Set(klass.assignments.map((a) => a.trackId));
  return tracks.map((t) => ({ id: t.id, title: t.title, description: t.description, assigned: assigned.has(t.id) }));
}

export async function setTrackAssignment(user: CurrentUser, classId: string, trackId: string, assigned: boolean) {
  const tracks = await listAssignableTracks(user, classId); // valida turma e trilha
  if (!tracks.some((t) => t.id === trackId)) throw new AccessError("Trilha não encontrada.");
  if (assigned) {
    await db.trackAssignment.upsert({ where: { classId_trackId: { classId, trackId } }, create: { classId, trackId }, update: {} });
  } else {
    await db.trackAssignment.deleteMany({ where: { classId, trackId } });
  }
}
