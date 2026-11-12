import "server-only";
import type { Role } from "@/generated/prisma/enums";
import { cleanCity, isUF, TRASH_DAYS } from "../br";
import { db } from "../db";
import {
  ANNOUNCEMENT_ROLES,
  announcementMatches,
  canPurge,
  matchesCity,
  sortSchools,
  type PlatformFilters,
  type SchoolRow,
} from "../platform-filters";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

// Tudo aqui é exclusivo do dono da plataforma (SUPER_ADMIN), exceto os avisos lidos pelas escolas.

function requireOwner(user: CurrentUser) {
  if (user.role !== "SUPER_ADMIN") throw new AccessError("Acesso negado.");
}

async function audit(actor: CurrentUser, action: string, target: string, organizationId: string | null, metadata?: Record<string, unknown>) {
  await db.auditLog.create({ data: { actorId: actor.id, action, target, organizationId, metadata: metadata as object | undefined } });
}

// ───────────── Painel ─────────────

/** Escolas ativas (não removidas) que passam pelos filtros, com números de uso. */
export async function listPlatformSchools(user: CurrentUser, f: PlatformFilters): Promise<SchoolRow[]> {
  requireOwner(user);
  const orgs = await db.organization.findMany({
    where: {
      deletedAt: null,
      ...(f.uf ? { state: f.uf } : {}),
      ...(f.tipo ? { type: f.tipo } : {}),
      ...(f.q ? { OR: [{ name: { contains: f.q, mode: "insensitive" as const } }, { slug: { contains: f.q.toLowerCase() } }] } : {}),
    },
    select: { id: true, name: true, slug: true, type: true, city: true, state: true, createdAt: true, subscription: { select: { status: true, plan: { select: { name: true } } } } },
  });
  const filtered = orgs.filter((o) => matchesCity(o, f.cidade));
  const ids = filtered.map((o) => o.id);
  if (ids.length === 0) return [];

  const [roleCounts, classCounts, students] = await Promise.all([
    db.user.groupBy({ by: ["organizationId", "role"], where: { organizationId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
    db.class.groupBy({ by: ["organizationId"], where: { organizationId: { in: ids }, archived: false }, _count: { _all: true } }),
    db.user.findMany({ where: { organizationId: { in: ids }, role: "STUDENT", deletedAt: null }, select: { id: true, organizationId: true } }),
  ]);
  const orgOfStudent = new Map(students.map((s) => [s.id, s.organizationId!]));
  const studentIds = students.map((s) => s.id);
  const [done, subs] = studentIds.length
    ? await Promise.all([
        db.progress.groupBy({ by: ["userId"], where: { userId: { in: studentIds }, status: "CONCLUIDO" }, _count: { _all: true } }),
        db.submission.groupBy({ by: ["userId"], where: { userId: { in: studentIds } }, _count: { _all: true }, _max: { createdAt: true } }),
      ])
    : [[], []];

  const stat = new Map(ids.map((id) => [id, { students: 0, teachers: 0, classes: 0, completed: 0, attempts: 0, lastActivity: null as Date | null }]));
  for (const r of roleCounts) {
    const s = stat.get(r.organizationId!)!;
    if (r.role === "STUDENT") s.students += r._count._all;
    else if (r.role === "TEACHER" || r.role === "ORG_ADMIN") s.teachers += r._count._all;
  }
  for (const c of classCounts) stat.get(c.organizationId)!.classes = c._count._all;
  for (const d of done) stat.get(orgOfStudent.get(d.userId)!)!.completed += d._count._all;
  for (const d of subs) {
    const s = stat.get(orgOfStudent.get(d.userId)!)!;
    s.attempts += d._count._all;
    const last = d._max.createdAt;
    if (last && (!s.lastActivity || last > s.lastActivity)) s.lastActivity = last;
  }

  const rows = filtered.map((o) => ({
    id: o.id, name: o.name, slug: o.slug, type: o.type, city: o.city, state: o.state, createdAt: o.createdAt,
    plan: o.subscription?.plan.name ?? null, status: o.subscription?.status ?? null,
    ...stat.get(o.id)!,
  }));
  return sortSchools(rows, f.ordem, f.dir);
}

/** Totais das escolas filtradas + resumo por estado + cidades (para o filtro). */
export async function getPlatformDashboard(user: CurrentUser, f: PlatformFilters) {
  const schools = await listPlatformSchools(user, f);
  const sum = (k: "students" | "teachers" | "classes" | "completed" | "attempts") => schools.reduce((n, s) => n + s[k], 0);

  const [allOrgs, trash, tracks] = await Promise.all([
    db.organization.findMany({ where: { deletedAt: null }, select: { state: true, city: true } }),
    Promise.all([db.organization.count({ where: { deletedAt: { not: null } } }), db.user.count({ where: { deletedAt: { not: null } } })]),
    trackProgress(schools.map((s) => s.id)),
  ]);
  const byState = new Map<string, number>();
  for (const o of allOrgs) if (o.state) byState.set(o.state, (byState.get(o.state) ?? 0) + 1);
  const cities = [...new Set(allOrgs.filter((o) => o.city && (!f.uf || o.state === f.uf)).map((o) => o.city))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    schools,
    totals: { schools: schools.length, students: sum("students"), teachers: sum("teachers"), classes: sum("classes"), completed: sum("completed"), attempts: sum("attempts") },
    byState: [...byState.entries()].sort((a, b) => b[1] - a[1]),
    cities,
    tracks,
    trash: trash[0] + trash[1],
  };
}

/** Progresso por trilha nas escolas filtradas: alunos que começaram, que terminaram, e lições concluídas. */
async function trackProgress(orgIds: string[]) {
  if (orgIds.length === 0) return [];
  const [tracks, rows] = await Promise.all([
    db.track.findMany({
      where: { published: true, organizationId: null, course: { comingSoon: false } },
      orderBy: [{ course: { order: "asc" } }, { level: "asc" }, { order: "asc" }],
      select: {
        id: true, title: true, level: true, course: { select: { title: true } },
        modules: { select: { lessons: { where: { draft: false, optional: false }, select: { id: true } } } },
      },
    }),
    db.progress.findMany({
      where: { status: "CONCLUIDO", user: { organizationId: { in: orgIds }, role: "STUDENT", deletedAt: null } },
      select: { userId: true, lessonId: true },
    }),
  ]);
  const doneBy = new Map<string, Set<string>>(); // lessonId → alunos
  for (const r of rows) {
    if (!doneBy.has(r.lessonId)) doneBy.set(r.lessonId, new Set());
    doneBy.get(r.lessonId)!.add(r.userId);
  }
  return tracks.map((t) => {
    const lessons = t.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const perStudent = new Map<string, number>();
    let completed = 0;
    for (const l of lessons) for (const u of doneBy.get(l) ?? []) {
      completed++;
      perStudent.set(u, (perStudent.get(u) ?? 0) + 1);
    }
    const finished = [...perStudent.values()].filter((n) => lessons.length > 0 && n >= lessons.length).length;
    return { id: t.id, title: t.title, course: t.course?.title ?? "", level: t.level, lessons: lessons.length, started: perStudent.size, finished, completed };
  });
}

// ───────────── Escola (detalhe) ─────────────

export async function getPlatformSchool(user: CurrentUser, orgId: string) {
  requireOwner(user);
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      subscription: { include: { plan: true } },
      classes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, code: true, archived: true, teacher: { select: { name: true } }, _count: { select: { enrollments: { where: { user: { deletedAt: null } } } } } },
      },
      users: {
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, username: true, role: true, active: true, deletedAt: true, lastLoginAt: true, _count: { select: { progress: { where: { status: "CONCLUIDO" } } } } },
      },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!org) throw new AccessError("Escola não encontrada.");
  return org;
}

// ───────────── Remover / restaurar (lixeira) ─────────────

export async function removeOrganization(user: CurrentUser, orgId: string, reason: string) {
  requireOwner(user);
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true, slug: true, deletedAt: true } });
  if (!org) throw new AccessError("Escola não encontrada.");
  if (org.deletedAt) return;
  await db.organization.update({ where: { id: orgId }, data: { deletedAt: new Date() } });
  await audit(user, "plataforma.escola.remover", org.slug, org.id, { reason });
}

export async function restoreOrganization(user: CurrentUser, orgId: string) {
  requireOwner(user);
  const org = await db.organization.update({ where: { id: orgId }, data: { deletedAt: null }, select: { id: true, slug: true } });
  await audit(user, "plataforma.escola.restaurar", org.slug, org.id);
}

export async function removeUser(user: CurrentUser, userId: string, reason: string) {
  requireOwner(user);
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, organizationId: true, deletedAt: true } });
  if (!target) throw new AccessError("Conta não encontrada.");
  if (target.id === user.id || target.role === "SUPER_ADMIN") throw new AccessError("Esta conta não pode ser removida.");
  if (target.deletedAt) return;
  await db.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  await audit(user, "plataforma.conta.remover", target.id, target.organizationId, { reason, role: target.role });
}

export async function restoreUser(user: CurrentUser, userId: string) {
  requireOwner(user);
  const target = await db.user.update({ where: { id: userId }, data: { deletedAt: null }, select: { id: true, organizationId: true } });
  await audit(user, "plataforma.conta.restaurar", target.id, target.organizationId);
}

export async function listTrash(user: CurrentUser) {
  requireOwner(user);
  const [orgs, users] = await Promise.all([
    db.organization.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" }, select: { id: true, name: true, city: true, state: true, deletedAt: true, _count: { select: { users: true } } } }),
    db.user.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, email: true, username: true, role: true, deletedAt: true, organization: { select: { id: true, name: true, deletedAt: true } } },
    }),
  ]);
  const now = new Date();
  return {
    orgs: orgs.map((o) => ({ ...o, purgeable: canPurge(o.deletedAt!, now, TRASH_DAYS) })),
    users: users.map((u) => ({ ...u, purgeable: canPurge(u.deletedAt!, now, TRASH_DAYS) })),
  };
}

/** Apaga de vez — só itens há mais de 90 dias na lixeira. */
export async function purgeOrganization(user: CurrentUser, orgId: string) {
  requireOwner(user);
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { slug: true, deletedAt: true } });
  if (!org?.deletedAt || !canPurge(org.deletedAt, new Date(), TRASH_DAYS)) throw new AccessError(`Só é possível apagar de vez após ${TRASH_DAYS} dias na lixeira.`);
  await db.organization.delete({ where: { id: orgId } });
  await audit(user, "plataforma.escola.apagar", org.slug, null);
}

export async function purgeUser(user: CurrentUser, userId: string) {
  requireOwner(user);
  const u = await db.user.findUnique({ where: { id: userId }, select: { deletedAt: true, organizationId: true } });
  if (!u?.deletedAt || !canPurge(u.deletedAt, new Date(), TRASH_DAYS)) throw new AccessError(`Só é possível apagar de vez após ${TRASH_DAYS} dias na lixeira.`);
  await db.user.delete({ where: { id: userId } });
  await audit(user, "plataforma.conta.apagar", userId, u.organizationId);
}

// ───────────── Avisos ─────────────

export type AnnouncementInput = { title: string; body: string; states: string[]; cities: string[]; orgIds: string[]; roles: Role[]; expiresAt: Date | null };

export async function createAnnouncement(user: CurrentUser, input: AnnouncementInput) {
  requireOwner(user);
  const a = await db.announcement.create({
    data: {
      ...input,
      states: input.states.filter(isUF),
      cities: input.cities.map(cleanCity).filter(Boolean),
      roles: input.roles.filter((r) => ANNOUNCEMENT_ROLES.includes(r)),
      createdById: user.id,
    },
  });
  await audit(user, "plataforma.aviso.publicar", a.id, null, { title: a.title });
  return a;
}

export async function deleteAnnouncement(user: CurrentUser, id: string) {
  requireOwner(user);
  await db.announcement.delete({ where: { id } });
  await audit(user, "plataforma.aviso.apagar", id, null);
}

export async function listAnnouncements(user: CurrentUser) {
  requireOwner(user);
  return db.announcement.findMany({ orderBy: { publishedAt: "desc" }, include: { _count: { select: { reads: true } } } });
}

/** Avisos em vigor para este usuário, marcando os já lidos. */
export async function getMyAnnouncements(user: CurrentUser) {
  if (!ANNOUNCEMENT_ROLES.includes(user.role)) return [];
  const now = new Date();
  const [org, list] = await Promise.all([
    user.organizationId ? db.organization.findUnique({ where: { id: user.organizationId }, select: { id: true, state: true, city: true } }) : null,
    db.announcement.findMany({
      where: { publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: { reads: { where: { userId: user.id }, select: { readAt: true } } },
    }),
  ]);
  return list
    .filter((a) => announcementMatches(a, { role: user.role, org }))
    .map((a) => ({ id: a.id, title: a.title, body: a.body, publishedAt: a.publishedAt, read: a.reads.length > 0 }));
}

export async function markAllAnnouncementsRead(user: CurrentUser) {
  const unread = (await getMyAnnouncements(user)).filter((a) => !a.read);
  if (unread.length) await db.announcementRead.createMany({ data: unread.map((a) => ({ announcementId: a.id, userId: user.id })), skipDuplicates: true });
}
