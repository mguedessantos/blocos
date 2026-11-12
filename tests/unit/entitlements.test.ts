import { describe, expect, it } from "vitest";
import { hasFeature } from "@/lib/billing/entitlements";

const plus = { features: ["white_label", "ai_tutor"] };
const now = new Date("2026-11-11T12:00:00Z");

describe("entitlements", () => {
  it("sem assinatura não tem recursos", () => {
    expect(hasFeature(null, "white_label", now)).toBe(false);
  });
  it("assinatura ativa com o recurso", () => {
    expect(hasFeature({ status: "ACTIVE", trialEndsAt: null, plan: plus }, "white_label", now)).toBe(true);
  });
  it("plano sem o recurso", () => {
    expect(hasFeature({ status: "ACTIVE", trialEndsAt: null, plan: { features: [] } }, "white_label", now)).toBe(false);
  });
  it("trial expirado perde recursos", () => {
    const trial = { status: "TRIAL" as const, trialEndsAt: new Date("2026-11-01"), plan: plus };
    expect(hasFeature(trial, "ai_tutor", now)).toBe(false);
  });
  it("cancelada / somente leitura perde recursos; inadimplente mantém (carência)", () => {
    expect(hasFeature({ status: "CANCELED", trialEndsAt: null, plan: plus }, "white_label", now)).toBe(false);
    expect(hasFeature({ status: "READ_ONLY", trialEndsAt: null, plan: plus }, "white_label", now)).toBe(false);
    expect(hasFeature({ status: "PAST_DUE", trialEndsAt: null, plan: plus }, "white_label", now)).toBe(true);
  });
});
