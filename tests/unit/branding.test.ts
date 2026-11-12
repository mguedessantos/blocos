import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({ getTenant: vi.fn() }));
const { brandFor } = await import("@/lib/branding");

function tenant(planFeatures: string[], branding: Record<string, unknown> | null) {
  return {
    id: "org1",
    name: "Colégio Aurora",
    branding,
    subscription: { status: "ACTIVE", trialEndsAt: null, plan: { features: planFeatures } },
  } as never;
}

describe("brandFor", () => {
  it("raiz usa a marca da plataforma", () => {
    const b = brandFor(null);
    expect(b.whiteLabel).toBe(false);
    expect(b.showPlatformBrand).toBe(true);
  });
  it("Escola+ aplica a marca da escola", () => {
    const b = brandFor(tenant(["white_label"], { displayName: "Aurora Code", primaryColor: "#0f766e", hidePlatformBrand: true }));
    expect(b).toMatchObject({ name: "Aurora Code", primary: "#0f766e", whiteLabel: true, showPlatformBrand: false });
  });
  it("plano sem white-label ignora o branding salvo, mas mostra o nome da escola", () => {
    const b = brandFor(tenant([], { displayName: "Marina Kids", primaryColor: "#dc2626" }));
    expect(b.whiteLabel).toBe(false);
    expect(b.primary).toBe("#6d28d9");
    expect(b.orgName).toBe("Colégio Aurora");
  });
  it("Escola+ sem branding configurado usa o nome da escola", () => {
    const b = brandFor(tenant(["white_label"], null));
    expect(b).toMatchObject({ name: "Colégio Aurora", primary: "#6d28d9", whiteLabel: true, showPlatformBrand: true });
  });
  it("cor inválida cai na cor padrão", () => {
    const b = brandFor(tenant(["white_label"], { primaryColor: "url(x)" }));
    expect(b.primary).toBe("#6d28d9");
  });
});
