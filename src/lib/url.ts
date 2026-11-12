import "server-only";
import { headers } from "next/headers";

/** Origem da requisição atual (respeita o domínio do cliente), ex.: https://escola.seusite.com.br */
export async function getRequestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function tenantUrl(slug: string) {
  const root = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const proto = root.startsWith("localhost") ? "http" : "https";
  return `${proto}://${slug}.${root}`;
}
