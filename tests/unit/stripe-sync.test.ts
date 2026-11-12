import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { mapStripeStatus, subscriptionUpdateFromStripe } from "@/lib/billing/stripe-sync";

function fakeSub(over: Partial<Record<string, unknown>> = {}, item: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    trial_end: null,
    metadata: {},
    items: { data: [{ price: { id: "price_escola" }, quantity: 120, current_period_end: 1_800_000_000, ...item }] },
    ...over,
  } as unknown as Stripe.Subscription;
}

const plans = new Map([
  ["price_escola", { id: "escola", perSeat: true }],
  ["price_prof", { id: "professor", perSeat: false }],
]);

describe("mapStripeStatus", () => {
  it.each([
    ["trialing", "TRIAL"], ["active", "ACTIVE"], ["past_due", "PAST_DUE"], ["unpaid", "READ_ONLY"],
    ["paused", "READ_ONLY"], ["canceled", "CANCELED"], ["incomplete_expired", "CANCELED"], ["incomplete", "READ_ONLY"],
  ] as const)("%s → %s", (stripe, ours) => {
    expect(mapStripeStatus(stripe)).toBe(ours);
  });
});

describe("subscriptionUpdateFromStripe", () => {
  it("plano por aluno usa a quantidade como assentos e lê o período do item", () => {
    expect(subscriptionUpdateFromStripe(fakeSub(), plans)).toEqual({
      planId: "escola",
      status: "ACTIVE",
      seats: 120,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    });
  });
  it("plano fixo não tem assentos; cliente expandido também funciona", () => {
    const u = subscriptionUpdateFromStripe(fakeSub({ customer: { id: "cus_2" } }, { price: { id: "price_prof" }, quantity: 1 }), plans);
    expect(u).toMatchObject({ planId: "professor", seats: null, stripeCustomerId: "cus_2" });
  });
  it("preço desconhecido é ignorado", () => {
    expect(subscriptionUpdateFromStripe(fakeSub({}, { price: { id: "price_x" } }), plans)).toBeNull();
  });
});
