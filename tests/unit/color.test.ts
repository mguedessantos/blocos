import { describe, expect, it } from "vitest";
import { contrastRatio, isAcceptableBrandColor, isHexColor, readableTextOn } from "@/lib/color";

describe("cores da marca", () => {
  it("valida hex", () => {
    expect(isHexColor("#0f766e")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#fff")).toBe(false);
  });
  it("contraste preto/branco = 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("escolhe texto legível", () => {
    expect(readableTextOn("#0f766e")).toBe("#ffffff");
    expect(readableTextOn("#facc15")).toBe("#1f1d2b");
  });
  it("aceita cores fortes, rejeita inválidas", () => {
    expect(isAcceptableBrandColor("#6d28d9")).toBe(true);
    expect(isAcceptableBrandColor("javascript:")).toBe(false);
  });
});
