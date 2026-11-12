import { normalizeHost } from "./host";

// Regras para o domínio próprio de uma escola (ex.: codigo.escolaabc.com.br).

export const CNAME_TARGET = process.env.CUSTOM_DOMAIN_CNAME ?? "cname.vercel-dns.com";
export const A_TARGET = process.env.CUSTOM_DOMAIN_A ?? "76.76.21.21";

/** Normaliza e valida; devolve o hostname ou uma mensagem de erro amigável. */
export function checkCustomHostname(raw: string, rootDomain: string): { hostname: string } | { error: string } {
  let h = normalizeHost(raw).replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  if (h.startsWith("www.") && h.split(".").length > 3) h = h.slice(4);
  const root = normalizeHost(rootDomain).split(":")[0];
  if (!h) return { error: "Informe o domínio." };
  if (h.length > 253 || !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(h)) {
    return { error: "Domínio inválido. Use algo como codigo.suaescola.com.br" };
  }
  if (h === root || h.endsWith(`.${root}`)) return { error: "Esse endereço já é da plataforma; use um domínio da sua escola." };
  return { hostname: h };
}

/** Em desenvolvimento, domínios .test/.localhost são aceitos sem DNS (para testar o fluxo). */
export const isDevDomain = (h: string) => process.env.NODE_ENV !== "production" && /\.(test|localhost)$/.test(h);
