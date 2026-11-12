// Converte objetos do Stripe no formato da nossa tabela Subscription (lógica pura, testável).
import type Stripe from "stripe";
import type { SubStatus } from "./entitlements";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case "trialing":
      return "TRIAL";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE"; // carência: Stripe ainda está tentando cobrar
    case "unpaid":
    case "paused":
      return "READ_ONLY";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
    default:
      return "READ_ONLY"; // pagamento inicial ainda não confirmado
  }
}

export type SubscriptionUpdate = {
  planId: string;
  status: SubStatus;
  seats: number | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
};

/**
 * @param planIdByPriceId mapa price_... → id do plano (tabela Plan)
 * @returns null se o preço da assinatura não corresponde a nenhum plano nosso
 */
export function subscriptionUpdateFromStripe(
  sub: Stripe.Subscription,
  planIdByPriceId: Map<string, { id: string; perSeat: boolean }>,
): SubscriptionUpdate | null {
  const item = sub.items.data[0];
  if (!item) return null;
  const plan = planIdByPriceId.get(item.price.id);
  if (!plan) return null;

  // Na API atual do Stripe o fim do período fica no item da assinatura.
  const periodEnd = item.current_period_end;
  return {
    planId: plan.id,
    status: mapStripeStatus(sub.status),
    seats: plan.perSeat ? (item.quantity ?? null) : null,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  };
}
