"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { requireUser } from "@/lib/dal/auth";
import { getCheckoutContext, getPlanForOrg, saveStripeCustomerId } from "@/lib/dal/billing";
import { getRequestOrigin } from "@/lib/url";

export type BillingState = { error?: string } | undefined;

const NOT_CONFIGURED = "Pagamentos ainda não configurados. Fale com o suporte.";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  seats: z.coerce.number().int().positive().max(100_000).optional(),
});

export async function startCheckout(_: BillingState, formData: FormData): Promise<BillingState> {
  const user = await requireUser(["ORG_ADMIN"]);
  if (!isStripeConfigured()) return { error: NOT_CONFIGURED };

  const parsed = checkoutSchema.safeParse({ planId: formData.get("planId"), seats: formData.get("seats") || undefined });
  if (!parsed.success) return { error: "Dados inválidos." };

  const plan = await getPlanForOrg(user, parsed.data.planId);
  if (!plan) return { error: "Plano não encontrado." };
  if (!plan.stripePriceId) return { error: NOT_CONFIGURED };

  const { org, subscription, admin, students } = await getCheckoutContext(user);
  const origin = await getRequestOrigin();

  // Quem já tem assinatura paga troca plano/assentos pelo portal do Stripe.
  if (subscription?.stripeSubscriptionId && subscription.status !== "CANCELED") {
    return openPortalFor(subscription.stripeCustomerId!, `${origin}/escola/assinatura`);
  }

  let seats = 1;
  if (plan.perSeat) {
    seats = parsed.data.seats ?? plan.minSeats;
    const minimum = Math.max(plan.minSeats, students);
    if (seats < minimum) {
      return { error: `Escolha pelo menos ${minimum} alunos (mínimo do plano ou alunos já cadastrados).` };
    }
  }

  const stripe = getStripe();
  let customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: admin.email ?? undefined,
      preferred_locales: ["pt-BR"],
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await saveStripeCustomerId(user, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: org.id,
    line_items: [{ price: plan.stripePriceId, quantity: seats }],
    subscription_data: { metadata: { organizationId: org.id } },
    metadata: { organizationId: org.id },
    locale: "pt-BR",
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true }, // CNPJ/CPF na fatura
    customer_update: { name: "auto", address: "auto" },
    success_url: `${origin}/escola/assinatura?status=sucesso&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/escola/assinatura?status=cancelado`,
  });

  if (!session.url) return { error: "Não foi possível abrir o pagamento. Tente de novo." };
  redirect(session.url);
}

export async function openBillingPortal(): Promise<BillingState> {
  const user = await requireUser(["ORG_ADMIN"]);
  if (!isStripeConfigured()) return { error: NOT_CONFIGURED };
  const { subscription } = await getCheckoutContext(user);
  if (!subscription?.stripeCustomerId) return { error: "Você ainda não tem uma assinatura paga." };
  return openPortalFor(subscription.stripeCustomerId, `${await getRequestOrigin()}/escola/assinatura`);
}

async function openPortalFor(customerId: string, returnUrl: string): Promise<BillingState> {
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: "pt-BR",
  });
  redirect(portal.url);
}
