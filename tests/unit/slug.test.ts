import { describe, expect, it } from "vitest";
import { slugError, slugify } from "@/lib/slug";

describe("slug", () => {
  it("gera endereço a partir do nome", () => {
    expect(slugify("Colégio São João  Ltda.")).toBe("colegio-sao-joao-ltda");
    expect(slugify("  --Ação!! ")).toBe("acao");
  });
  it("valida", () => {
    expect(slugError("aurora")).toBeNull();
    expect(slugError("ab")).not.toBeNull();
    expect(slugError("Aurora")).not.toBeNull();
    expect(slugError("a--b")).not.toBeNull();
    expect(slugError("admin")).toMatch(/reservado/);
  });
});
