import { describe, expect, it } from "vitest";
import { parseHost } from "@/lib/host";

describe("parseHost", () => {
  const root = "seusite.com.br";
  it("raiz e www", () => {
    expect(parseHost("seusite.com.br", root)).toEqual({ kind: "root" });
    expect(parseHost("WWW.seusite.com.br", root)).toEqual({ kind: "root" });
  });
  it("subdomínio de escola", () => {
    expect(parseHost("aurora.seusite.com.br", root)).toEqual({ kind: "subdomain", slug: "aurora" });
  });
  it("subdomínios reservados e aninhados voltam para a raiz", () => {
    expect(parseHost("app.seusite.com.br", root)).toEqual({ kind: "root" });
    expect(parseHost("a.b.seusite.com.br", root)).toEqual({ kind: "root" });
  });
  it("domínio customizado (sem porta)", () => {
    expect(parseHost("codigo.escolaabc.com.br", root)).toEqual({ kind: "custom", hostname: "codigo.escolaabc.com.br" });
  });
  it("não confunde domínio que termina com o mesmo texto", () => {
    expect(parseHost("evilseusite.com.br", root)).toEqual({ kind: "custom", hostname: "evilseusite.com.br" });
  });
  it("desenvolvimento local", () => {
    expect(parseHost("localhost:3000", "localhost:3000")).toEqual({ kind: "root" });
    expect(parseHost("escola-demo.localhost:3000", "localhost:3000")).toEqual({ kind: "subdomain", slug: "escola-demo" });
    expect(parseHost("127.0.0.1:3000", "localhost:3000")).toEqual({ kind: "root" });
  });
});
