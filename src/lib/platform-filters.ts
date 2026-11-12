import type { Role } from "@/generated/prisma/enums";
import { cityKey, cleanCity, isUF, type UF } from "./br";

// ───────────── Filtros do painel da plataforma (via query string) ─────────────

export const SCHOOL_SORTS = ["nome", "cidade", "estado", "alunos", "professores", "turmas", "concluidas", "tentativas", "atividade", "criada"] as const;
export type SchoolSort = (typeof SCHOOL_SORTS)[number];

export type PlatformFilters = {
  uf?: UF;
  cidade?: string;
  q?: string; // parte do nome ou do endereço da escola
  tipo?: "ESCOLA" | "PROFESSOR_INDEPENDENTE";
  ordem: SchoolSort;
  dir: "asc" | "desc";
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function parsePlatformFilters(params: Params): PlatformFilters {
  const uf = one(params.uf)?.toUpperCase();
  const cidade = one(params.cidade);
  const tipo = one(params.tipo);
  const ordem = one(params.ordem) as SchoolSort | undefined;
  const dir = one(params.dir);
  return {
    uf: isUF(uf) ? uf : undefined,
    cidade: cidade ? cleanCity(cidade).slice(0, 80) : undefined,
    q: one(params.q)?.slice(0, 80),
    tipo: tipo === "ESCOLA" || tipo === "PROFESSOR_INDEPENDENTE" ? tipo : undefined,
    ordem: ordem && SCHOOL_SORTS.includes(ordem) ? ordem : "nome",
    dir: dir === "desc" ? "desc" : dir === "asc" ? "asc" : ordem && ordem !== "nome" && ordem !== "cidade" && ordem !== "estado" ? "desc" : "asc",
  };
}

/** Query string dos filtros (para links, ordenação e exportação). */
export function filtersToQuery(f: Partial<PlatformFilters>, override: Partial<PlatformFilters> = {}) {
  const all = { ...f, ...override };
  const q = new URLSearchParams();
  for (const k of ["uf", "cidade", "q", "tipo", "ordem", "dir"] as const) {
    const v = all[k];
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type SchoolRow = {
  id: string;
  name: string;
  slug: string;
  type: "ESCOLA" | "PROFESSOR_INDEPENDENTE";
  city: string;
  state: string;
  plan: string | null;
  status: string | null;
  students: number;
  teachers: number;
  classes: number;
  completed: number; // lições concluídas pelos alunos
  attempts: number; // tentativas enviadas
  lastActivity: Date | null;
  createdAt: Date;
};

/** Filtra por cidade sem diferenciar acento/maiúsculas (o banco filtra UF, tipo e nome). */
export function matchesCity(row: { city: string }, cidade?: string) {
  return !cidade || cityKey(row.city) === cityKey(cidade);
}

export function sortSchools(rows: SchoolRow[], ordem: SchoolSort, dir: "asc" | "desc") {
  const key: Record<SchoolSort, (r: SchoolRow) => string | number> = {
    nome: (r) => r.name.toLocaleLowerCase("pt-BR"),
    cidade: (r) => cityKey(r.city),
    estado: (r) => r.state,
    alunos: (r) => r.students,
    professores: (r) => r.teachers,
    turmas: (r) => r.classes,
    concluidas: (r) => r.completed,
    tentativas: (r) => r.attempts,
    atividade: (r) => r.lastActivity?.getTime() ?? 0,
    criada: (r) => r.createdAt.getTime(),
  };
  const k = key[ordem];
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = k(a), y = k(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
    return c * sign || a.name.localeCompare(b.name, "pt-BR");
  });
}

// ───────────── CSV ─────────────

function csvCell(v: unknown) {
  const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
  // evita injeção de fórmulas no Excel/Planilhas
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV separado por ";" (padrão do Excel em pt-BR), com BOM para manter acentos. */
export function toCsv(header: string[], rows: unknown[][]) {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

// ───────────── Alvo dos avisos ─────────────

export const ANNOUNCEMENT_ROLES: Role[] = ["ORG_ADMIN", "TEACHER"];

export type AnnouncementTarget = { states: string[]; cities: string[]; orgIds: string[]; roles: Role[] };
export type AnnouncementReader = { role: Role; org: { id: string; state: string; city: string } | null };

/** Um aviso vale para o usuário se cada alvo preenchido incluí-lo (alvos vazios = todos). */
export function announcementMatches(a: AnnouncementTarget, u: AnnouncementReader) {
  const roles = a.roles.length ? a.roles : ANNOUNCEMENT_ROLES;
  if (!roles.includes(u.role)) return false;
  if (!a.states.length && !a.cities.length && !a.orgIds.length) return true;
  if (!u.org) return false;
  if (a.orgIds.length && !a.orgIds.includes(u.org.id)) return false;
  if (a.states.length && !a.states.includes(u.org.state)) return false;
  if (a.cities.length && !a.cities.some((c) => cityKey(c) === cityKey(u.org!.city))) return false;
  return true;
}

/** Item removido pode ser apagado de vez depois de `days` dias na lixeira. */
export function canPurge(deletedAt: Date, now = new Date(), days = 90) {
  return now.getTime() - deletedAt.getTime() >= days * 86_400_000;
}
