import "server-only";
import { cache } from "react";
import { billingEnabled, checkCanAddClass, checkCanAddStudents, isSubscriptionUsable } from "../billing/entitlements";
import { confirmCheckoutSession } from "../billing/service";
import { isStripeConfigured } from "../billing/stripe";
import { db } from "../db";
import type { CurrentUser } from "./auth";

function requireOrgAdmin(user: CurrentUser) {
  if (user.role !== "ORG_ADMIN" || !user.organizationId) throw new Error("Acesso negado.");
  return user.organizationId;
}

const getOrgSubscription = cache(async (organizationId: string) =>
  db.subscription.findUnique({ where: { organizationId }, include: { plan: true } }),
);

export async function getBillingOverview(user: CurrentUser) {
  const organizationId = requireOrgAdmin(user);
  const [org, subscription, students, classes] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    getOrgSubscription(organizationId),
    db.user.count({ where: { organizationId, role: "STUDENT", active: true } }),
    db.class.count({ where: { organizationId, archived: false } }),
  ]);
  const plans = await db.plan.findMany({ where: { orgType: org.type }, orderBy: { order: "asc" } });
  return { org, subscription, plans, students, classes };
}

/** Dados que a ação de checkout precisa (somente coordenação/dono da conta). */
export async function getCheckoutContext(user: CurrentUser) {
  const organizationId = requireOrgAdmin(user);
  const [org, subscription, admin, students] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    getOrgSubscription(organizationId),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true, name: true } }),
    db.user.count({ where: { organizationId, role: "STUDENT", active: true } }),
  ]);
  return { org, subscription, admin, students };
}

export async function getPlanForOrg(user: CurrentUser, planId: string) {
  const organizationId = requireOrgAdmin(user);
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { type: true } });
  return db.plan.findFirst({ where: { id: planId, orgType: org.type } });
}

export async function saveStripeCustomerId(user: CurrentUser, stripeCustomerId: string) {
  const organizationId = requireOrgAdmin(user);
  await db.subscription.update({ where: { organizationId }, data: { stripeCustomerId } });
}

/** Status resumido para o aviso no topo (equipe da organização). */
export async function getSubscriptionBanner(user: CurrentUser) {
  if (!billingEnabled() || !user.organizationId || user.role === "STUDENT") return null;
  const sub = await getOrgSubscription(user.organizationId);
  if (!sub) return { kind: "sem-plano" as const };
  if (!isSubscriptionUsable(sub)) return { kind: "bloqueado" as const };
  if (sub.status === "PAST_DUE") return { kind: "pagamento" as const };
  if (sub.status === "TRIAL" && sub.trialEndsAt) {
    const days = Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000));
    return { kind: "trial" as const, days };
  }
  return null;
}

/** Use antes de criar alunos/turmas (fase 3). */
export async function assertCanAddStudents(user: CurrentUser, adding: number) {
  if (!user.organizationId) throw new Error("Usuário sem organização.");
  const [sub, current] = await Promise.all([
    getOrgSubscription(user.organizationId),
    db.user.count({ where: { organizationId: user.organizationId, role: "STUDENT", active: true } }),
  ]);
  return checkCanAddStudents(sub, current, adding);
}

export async function assertCanAddClass(user: CurrentUser) {
  if (!user.organizationId) throw new Error("Usuário sem organização.");
  const [sub, current] = await Promise.all([
    getOrgSubscription(user.organizationId),
    db.class.count({ where: { organizationId: user.organizationId, archived: false } }),
  ]);
  return checkCanAddClass(sub, current);
}

/** Chamado na volta do Checkout (?status=sucesso&session_id=...). */
export async function confirmCheckoutForUser(user: CurrentUser, sessionId: string) {
  const organizationId = requireOrgAdmin(user);
  if (!isStripeConfigured()) return false;
  try {
    return await confirmCheckoutSession(sessionId, organizationId);
  } catch (err) {
    console.error("[stripe] falha ao confirmar checkout", err);
    return false; // o webhook ainda vai sincronizar
  }
}
