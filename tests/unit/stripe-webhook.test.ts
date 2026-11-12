import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handleStripeEvent = vi.fn(async () => "processado");
vi.mock("@/lib/billing/service", () => ({ handleStripeEvent }));

const SECRET = "whsec_test_secret";
const { POST } = await import("@/app/api/stripe/webhook/route");

function request(body: string, signature?: string) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

const payload = JSON.stringify({ id: "evt_1", object: "event", type: "customer.subscription.updated", data: { object: { id: "sub_1" } } });

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    handleStripeEvent.mockClear();
  });

  it("aceita evento com assinatura válida", async () => {
    const sig = new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const res = await POST(request(payload, sig));
    expect(res.status).toBe(200);
    expect(handleStripeEvent).toHaveBeenCalledWith(expect.objectContaining({ id: "evt_1" }));
  });

  it("rejeita assinatura inválida ou ausente", async () => {
    const sig = new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload, secret: "whsec_outro" });
    expect((await POST(request(payload, sig))).status).toBe(400);
    expect((await POST(request(payload))).status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it("503 se o Stripe não estiver configurado", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect((await POST(request(payload, "x"))).status).toBe(503);
  });

  it("500 quando o processamento falha (Stripe tenta de novo)", async () => {
    handleStripeEvent.mockRejectedValueOnce(new Error("db fora"));
    const sig = new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request(payload, sig))).status).toBe(500);
    spy.mockRestore();
  });
});
