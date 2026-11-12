import "server-only";
import { resolve4, resolveCname } from "node:dns/promises";
import { A_TARGET, CNAME_TARGET, isDevDomain } from "./domain-rules";

// Provedor de domínios próprios. Com VERCEL_API_TOKEN + VERCEL_PROJECT_ID o domínio é
// registrado no projeto da Vercel (que emite o SSL). Sem isso, só conferimos o DNS.

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const TEAM = process.env.VERCEL_TEAM_ID;

export const vercelEnabled = () => Boolean(TOKEN && PROJECT);

async function vercel(path: string, init: RequestInit = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (TEAM) url.searchParams.set("teamId", TEAM);
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...init.headers }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: body as Record<string, unknown> };
}

/** Registra o domínio no provedor (idempotente). */
export async function registerDomain(hostname: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!vercelEnabled()) return { ok: true };
  const r = await vercel(`/v10/projects/${PROJECT}/domains`, { method: "POST", body: JSON.stringify({ name: hostname }) });
  const code = (r.body.error as { code?: string } | undefined)?.code;
  if (r.ok || code === "domain_already_in_use_by_project" || code === "domain_already_exists") return { ok: true };
  if (code === "domain_already_in_use") return { ok: false, error: "Esse domínio já está ligado a outro site na Vercel." };
  return { ok: false, error: "Não foi possível registrar o domínio agora. Tente de novo em alguns minutos." };
}

export async function unregisterDomain(hostname: string) {
  if (vercelEnabled()) await vercel(`/v9/projects/${PROJECT}/domains/${hostname}`, { method: "DELETE" });
}

/** O DNS já aponta para a plataforma? */
export async function checkDomain(hostname: string): Promise<{ verified: boolean; detail: string }> {
  if (isDevDomain(hostname)) return { verified: true, detail: "Domínio de teste (desenvolvimento)." };
  if (vercelEnabled()) {
    const v = await vercel(`/v9/projects/${PROJECT}/domains/${hostname}/verify`, { method: "POST" });
    const c = await vercel(`/v6/domains/${hostname}/config`);
    if (v.body.verified === true && c.body.misconfigured === false) return { verified: true, detail: "Domínio verificado e SSL emitido pela Vercel." };
    return { verified: false, detail: "O DNS ainda não aponta para a plataforma. A propagação pode levar algumas horas." };
  }
  try {
    const cname = await resolveCname(hostname).catch(() => [] as string[]);
    if (cname.some((c) => c.replace(/\.$/, "").toLowerCase() === CNAME_TARGET)) return { verified: true, detail: "CNAME correto." };
    const a = await resolve4(hostname).catch(() => [] as string[]);
    if (a.includes(A_TARGET)) return { verified: true, detail: "Registro A correto." };
    return { verified: false, detail: cname.length || a.length ? "O domínio aponta para outro lugar." : "Ainda não encontramos o registro no DNS." };
  } catch {
    return { verified: false, detail: "Não foi possível consultar o DNS agora." };
  }
}
