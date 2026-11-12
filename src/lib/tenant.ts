import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { db } from "./db";
import { parseHost } from "./host";

const tenantInclude = {
  branding: true,
  subscription: { include: { plan: true } },
} as const;

/** Organização (tenant) do domínio acessado, ou null na raiz da plataforma. */
export const getTenant = cache(async () => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const info = parseHost(host, process.env.ROOT_DOMAIN ?? "localhost:3000");

  if (info.kind === "root") return null;
  if (info.kind === "subdomain") {
    const org = await db.organization.findUnique({ where: { slug: info.slug }, include: tenantInclude });
    return org?.deletedAt ? null : org;
  }
  const domain = await db.domain.findUnique({
    where: { hostname: info.hostname },
    include: { organization: { include: tenantInclude } },
  });
  return domain?.status === "VERIFICADO" && !domain.organization.deletedAt ? domain.organization : null;
});

export type Tenant = NonNullable<Awaited<ReturnType<typeof getTenant>>>;
