import "server-only";
import { db } from "../db";
import { BADGE_BY_ID, BADGES, earnedBadges, levelFor, statsFrom } from "../gamification";
import type { CurrentUser } from "./auth";

// O catálogo de trilhas quase nunca muda: guardamos por 60 s para não refazer a consulta a cada lição.
const TRACKS_TTL = 60_000;
const tracksCache = new Map<string, { at: number; value: Promise<{ id: string; level: number; required: number }[]> }>();

function badgeTracks(organizationId: string | null) {
  const key = organizationId ?? "-";
  const hit = tracksCache.get(key);
  if (hit && Date.now() - hit.at < TRACKS_TTL) return hit.value;
  const value = loadBadgeTracks(organizationId);
  tracksCache.set(key, { at: Date.now(), value });
  value.catch(() => tracksCache.delete(key));
  return value;
}

/** Trilhas oficiais/da escola que contam para as medalhas de nível (cursos publicados, não "em breve"). */
async function loadBadgeTracks(organizationId: string | null) {
  const tracks = await db.track.findMany({
    where: { published: true, course: { published: true, comingSoon: false }, OR: [{ organizationId: null }, ...(organizationId ? [{ organizationId }] : [])] },
    select: { id: true, level: true, modules: { select: { _count: { select: { lessons: { where: { draft: false, optional: false } } } } } } },
  });
  return tracks.map((t) => ({ id: t.id, level: t.level, required: t.modules.reduce((n, m) => n + m._count.lessons, 0) }));
}

async function computeStats(userId: string, organizationId: string | null) {
  const [rows, tracks] = await Promise.all([
    db.progress.findMany({
      where: { userId, lesson: { draft: false } },
      select: { status: true, stars: true, attempts: true, lesson: { select: { type: true, mode: true, optional: true, module: { select: { trackId: true } } } } },
    }),
    badgeTracks(organizationId),
  ]);
  return statsFrom(
    rows.map((r) => ({ ...r, lesson: { type: r.lesson.type, mode: r.lesson.mode, optional: r.lesson.optional, trackId: r.lesson.module.trackId } })),
    tracks,
  );
}

/** Dá as medalhas que o aluno acabou de conquistar; devolve só as novas. */
export async function awardBadges(user: Pick<CurrentUser, "id" | "organizationId">) {
  const ids = earnedBadges(await computeStats(user.id, user.organizationId));
  if (ids.length === 0) return [];
  const have = new Set((await db.userBadge.findMany({ where: { userId: user.id }, select: { badgeId: true } })).map((b) => b.badgeId));
  const fresh = ids.filter((id) => !have.has(id));
  if (fresh.length === 0) return [];
  // garante o catálogo no banco (o seed também faz isso)
  await db.badge.createMany({ data: BADGES.map(({ id, name, description, icon }) => ({ id, name, description, icon })), skipDuplicates: true });
  await db.userBadge.createMany({ data: fresh.map((badgeId) => ({ userId: user.id, badgeId })), skipDuplicates: true });
  return fresh.map((id) => {
    const b = BADGE_BY_ID.get(id)!;
    return { id, name: b.name, icon: b.icon };
  });
}

/** Nível, medalhas conquistadas e a conquistar, para a página do aluno. */
export async function getAchievements(user: CurrentUser) {
  await awardBadges(user); // alcança alunos que já tinham progresso antes das medalhas
  const got = await db.userBadge.findMany({ where: { userId: user.id }, select: { badgeId: true, awardedAt: true } });
  const when = new Map(got.map((g) => [g.badgeId, g.awardedAt]));
  const recent = Date.now() - 24 * 3600_000;
  return {
    ...levelFor(user.xp),
    badges: BADGES.map(({ id, name, description, icon }) => ({ id, name, description, icon, awardedAt: when.get(id) ?? null, isNew: (when.get(id)?.getTime() ?? 0) > recent })),
  };
}
