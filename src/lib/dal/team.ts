import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

const INVITE_DAYS = 7;

async function requireSchoolAdmin(user: CurrentUser) {
  if (user.role !== "ORG_ADMIN" || !user.organizationId) throw new AccessError("Acesso negado.");
  const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId }, select: { id: true, type: true, slug: true } });
  if (org.type !== "ESCOLA") throw new AccessError("Convites de professores são para contas de escola.");
  return org;
}

export async function getTeam(user: CurrentUser) {
  const org = await requireSchoolAdmin(user);
  const [members, invites] = await Promise.all([
    db.user.findMany({
      where: { organizationId: org.id, role: { in: ["TEACHER", "ORG_ADMIN"] }, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true, _count: { select: { teachingClasses: true } } },
      orderBy: { name: "asc" },
    }),
    db.invite.findMany({
      where: { organizationId: org.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { org, members, invites };
}

export async function createTeacherInvite(user: CurrentUser, email: string) {
  const org = await requireSchoolAdmin(user);
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false as const, reason: "Já existe uma conta com este email." };
  }
  await db.invite.deleteMany({ where: { organizationId: org.id, email, acceptedAt: null } }); // reenviar = novo link
  const invite = await db.invite.create({
    data: {
      email,
      role: "TEACHER",
      token: randomBytes(24).toString("base64url"),
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
      organizationId: org.id,
    },
  });
  await db.auditLog.create({ data: { organizationId: org.id, actorId: user.id, action: "convite.criar", target: email } });
  return { ok: true as const, token: invite.token, slug: org.slug };
}

export async function revokeInvite(user: CurrentUser, inviteId: string) {
  const org = await requireSchoolAdmin(user);
  await db.invite.deleteMany({ where: { id: inviteId, organizationId: org.id, acceptedAt: null } });
}

export async function setTeacherActive(user: CurrentUser, teacherId: string, active: boolean) {
  const org = await requireSchoolAdmin(user);
  if (teacherId === user.id) throw new AccessError("Você não pode desativar a própria conta.");
  const res = await db.user.updateMany({ where: { id: teacherId, organizationId: org.id, role: "TEACHER" }, data: { active } });
  if (res.count === 0) throw new AccessError("Professor não encontrado.");
  await db.auditLog.create({ data: { organizationId: org.id, actorId: user.id, action: active ? "professor.reativar" : "professor.desativar", target: teacherId } });
}

// ───────────── Aceite do convite (público, pelo token) ─────────────

export async function findValidInvite(token: string, tenantOrgId: string | null) {
  const invite = await db.invite.findUnique({ where: { token }, include: { organization: { select: { id: true, name: true } } } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return null;
  if (tenantOrgId && invite.organizationId !== tenantOrgId) return null; // link de outra escola
  return invite;
}

export async function acceptInvite(token: string, tenantOrgId: string | null, name: string, password: string) {
  const invite = await findValidInvite(token, tenantOrgId);
  if (!invite) return { ok: false as const, reason: "Convite inválido ou expirado. Peça um novo à coordenação." };
  if (await db.user.findUnique({ where: { email: invite.email }, select: { id: true } })) {
    return { ok: false as const, reason: "Já existe uma conta com este email. Tente entrar." };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { role: invite.role, name, email: invite.email, passwordHash, organizationId: invite.organizationId },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: invite.organizationId, actorId: created.id, action: "convite.aceitar", target: invite.email } });
    return created;
  });
  return { ok: true as const, user };
}
