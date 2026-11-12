// Interpretação do Host da requisição → qual cliente (tenant) está sendo acessado.
import { RESERVED_SLUGS as RESERVED } from "./slug";

export type HostInfo =
  | { kind: "root" }
  | { kind: "subdomain"; slug: string }
  | { kind: "custom"; hostname: string };


export function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * parseHost("escola.seusite.com.br", "seusite.com.br") → subdomain "escola"
 * parseHost("escola.localhost:3000", "localhost:3000") → subdomain "escola"
 * parseHost("codigo.escolaabc.com.br", "seusite.com.br") → custom
 */
export function parseHost(rawHost: string, rootDomain: string): HostInfo {
  const host = normalizeHost(rawHost);
  const root = normalizeHost(rootDomain);
  if (host === root || host === `www.${root}`) return { kind: "root" };

  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    if (!sub.includes(".") && !RESERVED.has(sub)) return { kind: "subdomain", slug: sub };
    return { kind: "root" };
  }

  // Em dev, 127.0.0.1 / localhost sem subdomínio também é a raiz.
  const bare = host.split(":")[0];
  if (bare === "localhost" || bare === "127.0.0.1") return { kind: "root" };

  return { kind: "custom", hostname: host.split(":")[0] };
}
