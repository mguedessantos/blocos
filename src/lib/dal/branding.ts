import "server-only";
import { hasFeature } from "../billing/entitlements";
import { brandAssetUrl, checkBrandImage } from "../brand-assets";
import { isAcceptableBrandColor, isAcceptablePrimaryColor, isHexColor } from "../color";
import { db } from "../db";
import { checkCustomHostname } from "../domain-rules";
import { checkDomain, registerDomain, unregisterDomain } from "../domains";
import { deleteFile, putFile } from "../storage";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

// Personalização da marca (white-label). Só a coordenação (ORG_ADMIN) edita; o recurso
// depende do plano (`white_label`). Ao perder o recurso a marca volta ao padrão, mas
// as configurações ficam salvas.

async function requireBrandAdmin(user: CurrentUser) {
  if (user.role !== "ORG_ADMIN" || !user.organizationId) throw new AccessError("Só a coordenação altera a marca.");
  const org = await db.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
    include: { branding: true, subscription: { include: { plan: true } }, domains: { orderBy: { createdAt: "asc" } } },
  });
  return org;
}

export async function getBrandingSettings(user: CurrentUser) {
  const org = await requireBrandAdmin(user);
  return {
    org: { id: org.id, name: org.name, slug: org.slug },
    entitled: hasFeature(org.subscription, "white_label"),
    branding: org.branding,
    domains: org.domains,
  };
}

export type BrandingInput = {
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  emailSenderName: string;
  supportEmail: string;
  hidePlatformBrand: boolean;
};

/** Valida as cores: hex e contraste mínimo do texto sobre a cor (WCAG AA para texto grande). */
export function brandingColorError(primary: string, secondary: string) {
  for (const [label, c] of [["principal", primary], ["secundária", secondary]] as const) {
    if (!isHexColor(c)) return `A cor ${label} precisa estar no formato #RRGGBB.`;
    if (!isAcceptableBrandColor(c)) return `A cor ${label} não deixa o texto legível. Escolha um tom mais forte ou mais claro.`;
  }
  if (!isAcceptablePrimaryColor(primary)) return "A cor principal está clara demais: links e botões ficariam ilegíveis no fundo branco. Escolha um tom mais escuro.";
  return null;
}

type Image = { bytes: Uint8Array } | null | "remove";

export async function updateBranding(user: CurrentUser, input: BrandingInput, logo: Image, favicon: Image) {
  const org = await requireBrandAdmin(user);
  if (!hasFeature(org.subscription, "white_label")) throw new AccessError("A marca própria faz parte do plano Escola+.");
  const colors = brandingColorError(input.primaryColor, input.secondaryColor);
  if (colors) throw new AccessError(colors);

  const keys: { logoUrl?: string | null; faviconUrl?: string | null } = {};
  const old = org.branding;
  const toDelete: string[] = [];
  for (const [field, img] of [["logoUrl", logo], ["faviconUrl", favicon]] as const) {
    if (!img) continue;
    const prev = old?.[field];
    if (prev?.startsWith("/marca/arquivo/")) toDelete.push(`marca/${prev.split("/").pop()}`);
    if (img === "remove") {
      keys[field] = null;
      continue;
    }
    const check = checkBrandImage(img.bytes);
    if ("error" in check) throw new AccessError(check.error);
    keys[field] = brandAssetUrl(await putFile("marca", img.bytes));
  }

  const data = {
    displayName: input.displayName || null,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    emailSenderName: input.emailSenderName || null,
    supportEmail: input.supportEmail || null,
    hidePlatformBrand: input.hidePlatformBrand,
    ...keys,
  };
  await db.orgBranding.upsert({ where: { organizationId: org.id }, create: { organizationId: org.id, ...data }, update: data });
  await Promise.all(toDelete.map((k) => deleteFile(k).catch(() => undefined)));
  await db.auditLog.create({ data: { organizationId: org.id, actorId: user.id, action: "marca.atualizar", target: org.slug } });
}

export { requireBrandAdmin };

// ───────────── Domínio próprio ─────────────

const MAX_CUSTOM_DOMAINS = 2;

export async function addCustomDomain(user: CurrentUser, raw: string) {
  const org = await requireBrandAdmin(user);
  if (!hasFeature(org.subscription, "white_label")) throw new AccessError("Domínio próprio faz parte do plano Escola+.");
  const check = checkCustomHostname(raw, process.env.ROOT_DOMAIN ?? "localhost:3000");
  if ("error" in check) throw new AccessError(check.error);
  if (org.domains.filter((d) => d.type === "CUSTOM").length >= MAX_CUSTOM_DOMAINS) throw new AccessError(`Cada escola pode ter até ${MAX_CUSTOM_DOMAINS} domínios próprios.`);
  if (await db.domain.findUnique({ where: { hostname: check.hostname } })) throw new AccessError("Esse domínio já está cadastrado.");
  const reg = await registerDomain(check.hostname);
  if (!reg.ok) throw new AccessError(reg.error);
  const d = await db.domain.create({ data: { hostname: check.hostname, type: "CUSTOM", organizationId: org.id } });
  await db.auditLog.create({ data: { organizationId: org.id, actorId: user.id, action: "dominio.adicionar", target: d.hostname } });
  return d;
}

export async function verifyCustomDomain(user: CurrentUser, domainId: string) {
  const org = await requireBrandAdmin(user);
  const d = org.domains.find((x) => x.id === domainId && x.type === "CUSTOM");
  if (!d) throw new AccessError("Domínio não encontrado.");
  const r = await checkDomain(d.hostname);
  await db.domain.update({
    where: { id: d.id },
    data: r.verified ? { status: "VERIFICADO", verifiedAt: d.verifiedAt ?? new Date() } : { status: d.status === "VERIFICADO" ? "ERRO" : "PENDENTE" },
  });
  return r;
}

export async function removeCustomDomain(user: CurrentUser, domainId: string) {
  const org = await requireBrandAdmin(user);
  const d = org.domains.find((x) => x.id === domainId && x.type === "CUSTOM");
  if (!d) throw new AccessError("Domínio não encontrado.");
  await unregisterDomain(d.hostname);
  await db.domain.delete({ where: { id: d.id } });
  await db.auditLog.create({ data: { organizationId: org.id, actorId: user.id, action: "dominio.remover", target: d.hostname } });
}
