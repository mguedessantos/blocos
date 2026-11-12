import { describe, expect, it } from "vitest";
import { cityKey, isUF } from "@/lib/br";
import {
  announcementMatches,
  canPurge,
  filtersToQuery,
  matchesCity,
  parsePlatformFilters,
  sortSchools,
  toCsv,
  type SchoolRow,
} from "@/lib/platform-filters";

const row = (o: Partial<SchoolRow>): SchoolRow => ({
  id: o.name ?? "x", name: "X", slug: "x", type: "ESCOLA", city: "", state: "", plan: null, status: null,
  students: 0, teachers: 0, classes: 0, completed: 0, attempts: 0, lastActivity: null, createdAt: new Date(0), ...o,
});

describe("filtros do painel da plataforma", () => {
  it("aceita só UFs válidas e normaliza", () => {
    expect(parsePlatformFilters({ uf: "sp" }).uf).toBe("SP");
    expect(parsePlatformFilters({ uf: "XX" }).uf).toBeUndefined();
    expect(isUF("RJ")).toBe(true);
  });

  it("ordenação padrão e inválida caem em nome asc; números começam desc", () => {
    expect(parsePlatformFilters({})).toMatchObject({ ordem: "nome", dir: "asc" });
    expect(parsePlatformFilters({ ordem: "drop table" })).toMatchObject({ ordem: "nome" });
    expect(parsePlatformFilters({ ordem: "alunos" })).toMatchObject({ ordem: "alunos", dir: "desc" });
  });

  it("cidade compara sem acento e sem maiúsculas", () => {
    expect(cityKey("  São   Paulo ")).toBe("sao paulo");
    expect(matchesCity({ city: "São Paulo" }, "sao paulo")).toBe(true);
    expect(matchesCity({ city: "Campinas" }, "São Paulo")).toBe(false);
    expect(matchesCity({ city: "Campinas" }, undefined)).toBe(true);
  });

  it("monta a query string preservando filtros", () => {
    const f = parsePlatformFilters({ uf: "MG", cidade: "Belo Horizonte" });
    expect(filtersToQuery(f, { ordem: "alunos", dir: "desc" })).toBe("?uf=MG&cidade=Belo+Horizonte&ordem=alunos&dir=desc");
  });

  it("ordena por número e por nome", () => {
    const rows = [row({ name: "Beta", students: 5 }), row({ name: "Alfa", students: 9 }), row({ name: "Gama", students: 1 })];
    expect(sortSchools(rows, "alunos", "desc").map((r) => r.name)).toEqual(["Alfa", "Beta", "Gama"]);
    expect(sortSchools(rows, "nome", "asc").map((r) => r.name)).toEqual(["Alfa", "Beta", "Gama"]);
  });
});

describe("CSV", () => {
  it("usa ; com BOM, escapa aspas e neutraliza fórmulas", () => {
    const csv = toCsv(["a", "b"], [['x;"y"', "=CMD()"]]);
    expect(csv.startsWith("﻿a;b\r\n")).toBe(true);
    expect(csv).toContain('"x;""y"""');
    expect(csv).toContain("'=CMD()");
  });
});

describe("alvo dos avisos", () => {
  const sp = { role: "TEACHER" as const, org: { id: "o1", state: "SP", city: "Campinas" } };
  const base = { states: [], cities: [], orgIds: [], roles: [] };

  it("sem alvo vale para coordenação e professores, não para alunos", () => {
    expect(announcementMatches(base, sp)).toBe(true);
    expect(announcementMatches(base, { ...sp, role: "STUDENT" })).toBe(false);
  });
  it("filtra por UF, cidade (sem acento), escola e papel", () => {
    expect(announcementMatches({ ...base, states: ["SP"] }, sp)).toBe(true);
    expect(announcementMatches({ ...base, states: ["RJ"] }, sp)).toBe(false);
    expect(announcementMatches({ ...base, cities: ["campinas"] }, sp)).toBe(true);
    expect(announcementMatches({ ...base, orgIds: ["o2"] }, sp)).toBe(false);
    expect(announcementMatches({ ...base, roles: ["ORG_ADMIN"] }, sp)).toBe(false);
  });
});

describe("lixeira", () => {
  it("só apaga de vez após 90 dias", () => {
    const now = new Date("2026-12-31T00:00:00Z");
    expect(canPurge(new Date("2026-12-01T00:00:00Z"), now)).toBe(false);
    expect(canPurge(new Date("2026-09-01T00:00:00Z"), now)).toBe(true);
  });
});
