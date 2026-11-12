// Ressincroniza as assinaturas do banco a partir do Stripe (recuperação quando webhooks se perdem).
// Uso: npm run stripe:sync
import "dotenv/config";
import Stripe from "stripe";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { subscriptionUpdateFromStripe } from "../src/lib/billing/stripe-sync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 }) });

async function main() {
  const plans = await db.plan.findMany({ where: { stripePriceId: { not: null } } });
  const byPrice = new Map(plans.map((p) => [p.stripePriceId!, { id: p.id, perSeat: p.perSeat }]));
  const local = await db.subscription.findMany({
    where: { stripeCustomerId: { not: null } },
    include: { organization: { select: { slug: true } } },
  });

  for (const sub of local) {
    const remote = await stripe.subscriptions.list({ customer: sub.stripeCustomerId!, status: "all", limit: 10 });
    // A mais recente que não esteja encerrada; se todas estiverem, a mais recente.
    const chosen = remote.data.find((s) => !["canceled", "incomplete_expired"].includes(s.status)) ?? remote.data[0];
    if (!chosen) {
      console.log(`- ${sub.organization.slug}: sem assinatura no Stripe (continua ${sub.status})`);
      continue;
    }
    const update = subscriptionUpdateFromStripe(chosen, byPrice);
    if (!update) {
      console.log(`! ${sub.organization.slug}: preço desconhecido em ${chosen.id}`);
      continue;
    }
    await db.subscription.update({ where: { id: sub.id }, data: update });
    console.log(`✔ ${sub.organization.slug}: ${sub.status} → ${update.status} (${update.planId}, assentos: ${update.seats ?? "-"})`);
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
