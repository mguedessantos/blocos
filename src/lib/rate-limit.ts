import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

// Limite de tentativas por janela (proteção contra adivinhação de senha).
// Guardado no Postgres (funções serverless não compartilham memória). A chave é um hash.

/** IP de quem fez a requisição (na Vercel, x-forwarded-for vem do próprio proxy). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

// Em desenvolvimento/testes os limites ficam bem mais altos (os testes fazem muitos logins seguidos).
const SCALE = process.env.NODE_ENV === "production" ? 1 : 50;

/** Conta uma tentativa. Devolve `ok: false` quando passou do limite na janela. */
export async function hit(scope: string, id: string, limit: number, windowMs: number) {
  const key = createHash("sha256").update(`${scope}:${id.toLowerCase()}`).digest("hex");
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const { count, resetAt: until } = rows[0];
  return { ok: count <= limit * SCALE, retryInMin: Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000)) };
}

export async function clear(scope: string, id: string) {
  const key = createHash("sha256").update(`${scope}:${id.toLowerCase()}`).digest("hex");
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Limpeza ocasional de contadores vencidos. */
export async function sweep() {
  await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}

const MIN = 60_000;
export const LIMITS = {
  staffPerEmail: [10, 15 * MIN],
  staffPerIp: [60, 15 * MIN],
  studentPerAccount: [10, 15 * MIN],
  // uma escola inteira pode sair pelo mesmo IP: limite alto por IP
  studentPerIp: [400, 15 * MIN],
  signupPerIp: [10, 60 * MIN],
} as const;
