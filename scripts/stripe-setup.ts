// Cria (ou reaproveita) no Stripe os produtos/preços dos planos da tabela Plan
// e grava o price_... em Plan.stripePriceId. Idempotente: pode rodar várias vezes.
// Uso: npm run stripe:setup   (requer STRIPE_SECRET_KEY no .env)
import "dotenv/config";
import Stripe from "stripe";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Defina STRIPE_SECRET_KEY no .env (use a chave de TESTE sk_test_...).");
  process.exit(1);
}
if (key.startsWith("sk_live_") && !process.argv.includes("--live")) {
  console.error("Chave de PRODUÇÃO detectada. Rode com --live se for isso mesmo.");
  process.exit(1);
}

const stripe = new Stripe(key);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const plans = await db.plan.findMany({ orderBy: { order: "asc" } });
  for (const plan of plans) {
    // lookup_key inclui o preço: mudar o valor no seed cria um preço novo (preços do Stripe são imutáveis).
    const lookupKey = `blocos_${plan.id}_${plan.priceCents}_brl_month`;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    let price = existing.data[0];

    if (!price) {
      const products = await stripe.products.search({ query: `metadata['planId']:'${plan.id}'` });
      const product =
        products.data[0] ??
        (await stripe.products.create({
          name: `Blockin Lab — ${plan.name}`,
          description: plan.description || undefined,
          metadata: { planId: plan.id },
        }));
      price = await stripe.prices.create({
        product: product.id,
        currency: "brl",
        unit_amount: plan.priceCents,
        recurring: { interval: "month" },
        lookup_key: lookupKey,
        nickname: plan.perSeat ? `${plan.name} (por aluno)` : plan.name,
        metadata: { planId: plan.id },
      });
      console.log(`+ ${plan.name}: preço criado ${price.id}`);
    } else {
      console.log(`= ${plan.name}: preço já existe ${price.id}`);
    }
    await db.plan.update({ where: { id: plan.id }, data: { stripePriceId: price.id } });
  }
  // Adicionais de alunos (ex.: +5, +10): um produto por adicional, preço mensal fixo.
  for (const addon of await db.planAddon.findMany({ orderBy: { order: "asc" } })) {
    const lookupKey = `blocos_addon_${addon.id}_${addon.priceCents}_brl_month`;
    let price = (await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })).data[0];
    if (!price) {
      const product =
        (await stripe.products.search({ query: `metadata['addonId']:'${addon.id}'` })).data[0] ??
        (await stripe.products.create({ name: `Blockin Lab — ${addon.name}`, metadata: { addonId: addon.id } }));
      price = await stripe.prices.create({
        product: product.id, currency: "brl", unit_amount: addon.priceCents, recurring: { interval: "month" },
        lookup_key: lookupKey, nickname: addon.name, metadata: { addonId: addon.id },
      });
      console.log(`+ ${addon.name}: preço criado ${price.id}`);
    } else {
      console.log(`= ${addon.name}: preço já existe ${price.id}`);
    }
    await db.planAddon.update({ where: { id: addon.id }, data: { stripePriceId: price.id } });
  }
  console.log("Pronto ✔  Lembre de ativar o Portal do Cliente no Dashboard do Stripe.");
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
