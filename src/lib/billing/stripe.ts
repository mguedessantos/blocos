import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Cliente Stripe ou erro claro se a chave não foi configurada. */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe não configurado: defina STRIPE_SECRET_KEY no .env");
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "Blocos" } });
  return client;
}
