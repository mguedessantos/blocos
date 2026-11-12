import { handleStripeEvent } from "@/lib/billing/service";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";

// Webhook do Stripe: autenticado pela assinatura do evento (não por sessão de usuário).
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return Response.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Assinatura ausente" }, { status: 400 });

  const body = await request.text(); // corpo bruto, necessário para validar a assinatura
  let event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (err) {
    console.error("[stripe] erro ao processar", event.type, event.id, err);
    return Response.json({ error: "Erro ao processar" }, { status: 500 }); // Stripe tenta de novo
  }
}
