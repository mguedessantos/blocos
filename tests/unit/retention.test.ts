import { describe, expect, it } from "vitest";
import { createKeepToken, lastActivity, noticeDue, readKeepToken, shouldRemove } from "@/lib/retention";

const DAY = 86_400_000;
const t0 = new Date("2025-01-01T12:00:00Z");
const at = (days: number) => new Date(t0.getTime() + days * DAY);

describe("inatividade (1 ano)", () => {
  it("última atividade é o maior entre criação, login e manter ativo", () => {
    expect(lastActivity({ createdAt: t0, lastLoginAt: null, keptActiveAt: null })).toEqual(t0);
    expect(lastActivity({ createdAt: t0, lastLoginAt: at(10), keptActiveAt: at(5) })).toEqual(at(10));
    expect(lastActivity({ createdAt: t0, lastLoginAt: at(10), keptActiveAt: at(400) })).toEqual(at(400));
  });

  it("avisos aos 335 e 358 dias, um de cada, e remoção aos 365", () => {
    expect(noticeDue(t0, null, at(334))).toBeNull();
    expect(noticeDue(t0, null, at(335))).toBe("aviso30");
    expect(noticeDue(t0, at(335), at(340))).toBeNull(); // já avisado
    expect(noticeDue(t0, at(335), at(358))).toBe("aviso7");
    expect(noticeDue(t0, at(358), at(360))).toBeNull();
    expect(noticeDue(t0, null, at(360))).toBe("aviso7"); // pulou o primeiro: manda o mais recente
    expect(shouldRemove(t0, at(364))).toBe(false);
    expect(shouldRemove(t0, at(365))).toBe(true);
    expect(noticeDue(t0, null, at(365))).toBeNull();
  });

  it("aviso antigo (de antes de um login) não conta", () => {
    const relogin = at(400); // entrou de novo: novo ciclo
    expect(noticeDue(relogin, at(358), new Date(relogin.getTime() + 335 * DAY))).toBe("aviso30");
  });
});

describe("link manter ativo", () => {
  it("lê os ids de um token válido e recusa adulterado, de outro segredo ou vencido", () => {
    const token = createKeepToken(["a", "b"], "segredo", t0);
    expect(readKeepToken(token, "segredo", at(1))).toEqual(["a", "b"]);
    expect(readKeepToken(token, "outro", at(1))).toBeNull();
    expect(readKeepToken(token, "segredo", at(31))).toBeNull();
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ids: ["x"], exp: at(60).getTime() })).toString("base64url");
    expect(readKeepToken(`${forged}.${sig}`, "segredo", at(1))).toBeNull();
    expect(readKeepToken(`${body}.`, "segredo", at(1))).toBeNull();
    expect(readKeepToken("lixo", "segredo", at(1))).toBeNull();
  });
});
