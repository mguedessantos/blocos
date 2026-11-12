import "server-only";
import type Stripe from "stripe";
import { db } from "../db";
import { getStripe } from "./stripe";
import { subscriptionUpdateFromStripe } from "./stripe-sync";

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

/** Busca a assinatura atualizada no Stripe e grava no banco. Idempotente. */
export async function syncStripeSubscription(stripeSubscriptionId: string, orgIdHint?: string | null) {
  const stripeSub = await getStripe().subscriptions.retrieve(stripeSubscriptionId);

  const plans = await db.plan.findMany({ where: { stripePriceId: { not: null } } });
  const byPrice = new Map(plans.map((p) => [p.stripePriceId!, { id: p.id, perSeat: p.perSeat }]));
  const update = subscriptionUpdateFromStripe(stripeSub, byPrice);
  if (!update) {
    console.warn(`[stripe] assinatura ${stripeSub.id} com preço desconhecido — ignorada`);
    return;
  }

  // Descobre a organização: metadata da assinatura → dica do checkout → cliente já vinculado.
  const organizationId =
    stripeSub.metadata?.organizationId ||
    orgIdHint ||
    (await db.subscription.findFirst({
      where: { OR: [{ stripeSubscriptionId: stripeSub.id }, { stripeCustomerId: update.stripeCustomerId }] },
      select: { organizationId: true },
    }))?.organizationId;
  if (!organizationId) {
    console.warn(`[stripe] assinatura ${stripeSub.id} sem organização associada — ignorada`);
    return;
  }

  await db.subscription.upsert({
    where: { organizationId },
    update,
    create: { organizationId, ...update },
  });
  await db.auditLog.create({
    data: { organizationId, action: "assinatura.sincronizar", target: stripeSub.id, metadata: { status: update.status, planId: update.planId, seats: update.seats } },
  });
}

/** Processa um evento do webhook uma única vez. */
export async function handleStripeEvent(event: Stripe.Event) {
  if (await db.stripeEvent.findUnique({ where: { id: event.id } })) return "duplicado";

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subId = idOf(session.subscription);
      if (session.mode === "subscription" && subId) await syncStripeSubscription(subId, session.client_reference_id);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncStripeSubscription(event.data.object.id);
      break;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const subId = idOf(event.data.object.parent?.subscription_details?.subscription);
      if (subId) await syncStripeSubscription(subId);
      break;
    }
    default:
      return "ignorado";
  }

  await db.stripeEvent.create({ data: { id: event.id, type: event.type } }).catch(() => undefined);
  return "processado";
}

/**
 * Confirma o pagamento quando o cliente volta do Checkout, sem depender do webhook
 * (que pode atrasar ou estar mal configurado). Só sincroniza se a sessão for da própria organização.
 */
export async function confirmCheckoutSession(sessionId: string, organizationId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== organizationId || session.mode !== "subscription") return false;
  const subId = idOf(session.subscription);
  if (!subId || session.status !== "complete") return false;
  await syncStripeSubscription(subId, organizationId);
  return true;
}
