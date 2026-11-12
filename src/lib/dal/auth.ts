import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { db } from "../db";
import { SESSION_COOKIE, decryptSession } from "../session-token";
import { getTenant } from "../tenant";

export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decryptSession(token);
});

/** Usuário logado, validado no banco e no tenant atual. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, name: true, role: true, organizationId: true, active: true, avatar: true, xp: true, deletedAt: true, canOrganizeJams: true,
      organization: { select: { deletedAt: true } },
    },
  });
  // conta ou escola removida (lixeira) derruba a sessão na hora
  if (!user || !user.active || user.deletedAt || user.organization?.deletedAt) return null;

  // Num domínio de escola, só valem usuários dessa escola (exceto super admin e jurados externos).
  const tenant = await getTenant();
  if (tenant && user.organizationId && user.organizationId !== tenant.id) return null;
  return { id: user.id, name: user.name, role: user.role, organizationId: user.organizationId, active: user.active, avatar: user.avatar, xp: user.xp, canOrganizeJams: user.canOrganizeJams };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Use no topo de páginas, server actions e route handlers protegidos. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(roles && !roles.includes("STUDENT") ? "/entrar?perfil=equipe" : "/entrar");
  if (roles && !roles.includes(user.role)) redirect("/sem-acesso");
  return user;
}
