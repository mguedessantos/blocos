import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { hasFeature } from "./billing/entitlements";
import { isAcceptableBrandColor, readableTextOn } from "./color";
import { getTenant, type Tenant } from "./tenant";

export type Brand = {
  name: string; // nome exibido no topo e no título
  orgName: string | null; // nome da escola (mesmo sem white-label)
  logoUrl: string | null;
  faviconUrl: string | null;
  primary: string;
  primaryText: string;
  secondary: string;
  showPlatformBrand: boolean;
  whiteLabel: boolean;
};

const PLATFORM_PRIMARY = "#6d28d9";
const PLATFORM_SECONDARY = "#f59e0b";

export function defaultBrand(orgName: string | null = null): Brand {
  return {
    name: process.env.PLATFORM_NAME ?? "Blocos",
    orgName,
    logoUrl: null,
    faviconUrl: null,
    primary: PLATFORM_PRIMARY,
    primaryText: readableTextOn(PLATFORM_PRIMARY),
    secondary: PLATFORM_SECONDARY,
    showPlatformBrand: true,
    whiteLabel: false,
  };
}

export function brandFor(tenant: Tenant | null): Brand {
  if (!tenant) return defaultBrand();
  const base = defaultBrand(tenant.name);
  if (!hasFeature(tenant.subscription, "white_label")) return base;

  // White-label sem personalização ainda: usa o nome da escola com as cores padrão.
  const b = tenant.branding;
  const primary = b?.primaryColor && isAcceptableBrandColor(b.primaryColor) ? b.primaryColor : base.primary;
  const secondary = b?.secondaryColor && isAcceptableBrandColor(b.secondaryColor) ? b.secondaryColor : base.secondary;
  return {
    name: b?.displayName || tenant.name,
    orgName: tenant.name,
    logoUrl: b?.logoUrl ?? null,
    faviconUrl: b?.faviconUrl ?? null,
    primary,
    primaryText: readableTextOn(primary),
    secondary,
    showPlatformBrand: !b?.hidePlatformBrand,
    whiteLabel: true,
  };
}

export const getBrand = cache(async () => {
  await connection(); // a marca depende do domínio e da data (teste grátis/assinatura): sempre por requisição
  return brandFor(await getTenant());
});
