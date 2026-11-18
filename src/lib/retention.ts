// Remoção por inatividade (LGPD): conta sem uso por 1 ano é apagada de vez.
// Avisos por email 30 e 7 dias antes, com link para manter ativo. Lógica pura (testável).
import { createHmac, timingSafeEqual } from "node:crypto";

const DAY = 86_400_000;
export const REMOVE_AFTER_DAYS = 365;
export const NOTICES = [
  { stage: "aviso30", day: REMOVE_AFTER_DAYS - 30 },
  { stage: "aviso7", day: REMOVE_AFTER_DAYS - 7 },
] as const;
export type NoticeStage = (typeof NOTICES)[number]["stage"];

type ActivityDates = { createdAt: Date; lastLoginAt: Date | null; keptActiveAt: Date | null };

/** Última atividade: login, "manter ativo" pelo email ou criação da conta. */
export function lastActivity(u: ActivityDates): Date {
  return new Date(Math.max(u.createdAt.getTime(), u.lastLoginAt?.getTime() ?? 0, u.keptActiveAt?.getTime() ?? 0));
}

export function removalDate(last: Date): Date {
  return new Date(last.getTime() + REMOVE_AFTER_DAYS * DAY);
}

export function shouldRemove(last: Date, now: Date): boolean {
  return now >= removalDate(last);
}

/** Aviso que ainda falta mandar agora (o mais recente já vencido), ou null. */
export function noticeDue(last: Date, noticeAt: Date | null, now: Date): NoticeStage | null {
  if (shouldRemove(last, now)) return null;
  const reached = NOTICES.filter((n) => now.getTime() >= last.getTime() + n.day * DAY).at(-1);
  if (!reached) return null;
  const startsAt = last.getTime() + reached.day * DAY;
  return !noticeAt || noticeAt.getTime() < startsAt ? reached.stage : null;
}

// ───────── Link "manter ativo" (sem login): ids assinados com HMAC, válido por 30 dias ─────────

const TOKEN_DAYS = 30;

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function createKeepToken(userIds: string[], secret: string, now = new Date()): string {
  const body = Buffer.from(JSON.stringify({ ids: userIds, exp: now.getTime() + TOKEN_DAYS * DAY })).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function readKeepToken(token: string, secret: string, now = new Date()): string[] | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body, secret));
  const got = Buffer.from(sig);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { ids?: unknown; exp?: unknown };
    if (typeof data.exp !== "number" || data.exp < now.getTime()) return null;
    if (!Array.isArray(data.ids) || !data.ids.every((id) => typeof id === "string")) return null;
    return data.ids as string[];
  } catch {
    return null;
  }
}
