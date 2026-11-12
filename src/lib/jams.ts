import { randomInt } from "node:crypto";
import { cityKey } from "./br";

// Regras puras das game jams (sem banco) — testadas em tests/unit/jams.test.ts.

export type JamPhase = "RASCUNHO" | "EM_BREVE" | "EM_ANDAMENTO" | "JULGAMENTO" | "ENCERRADA";

export const PHASE_LABEL: Record<JamPhase, string> = {
  RASCUNHO: "Rascunho",
  EM_BREVE: "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento",
  JULGAMENTO: "Em julgamento",
  ENCERRADA: "Encerrada",
};

type Dates = { published: boolean; startsAt: Date; endsAt: Date; judgingEndsAt: Date };

/** Fase pelo relógio do SERVIDOR (o navegador só mostra a contagem). */
export function jamPhase(j: Dates, now = new Date()): JamPhase {
  if (!j.published) return "RASCUNHO";
  if (now < j.startsAt) return "EM_BREVE";
  if (now < j.endsAt) return "EM_ANDAMENTO";
  if (now < j.judgingEndsAt) return "JULGAMENTO";
  return "ENCERRADA";
}

/** Para qual data a contagem regressiva aponta em cada fase. */
export function phaseTarget(phase: JamPhase, j: { startsAt: Date; endsAt: Date; judgingEndsAt: Date }) {
  if (phase === "EM_BREVE") return { to: j.startsAt.toISOString(), label: "Começa em" };
  if (phase === "EM_ANDAMENTO") return { to: j.endsAt.toISOString(), label: "Entregas fecham em" };
  if (phase === "JULGAMENTO") return { to: j.judgingEndsAt.toISOString(), label: "Resultado em" };
  return null;
}

export const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(d);

export const canRegisterTeams = (p: JamPhase) => p === "EM_BREVE" || p === "EM_ANDAMENTO";
export const canSubmit = (p: JamPhase) => p === "EM_ANDAMENTO";
export const canJudge = (p: JamPhase) => p === "JULGAMENTO";
export const resultsPublic = (p: JamPhase) => p === "ENCERRADA";

export function validateJamDates(startsAt: Date, endsAt: Date, judgingEndsAt: Date): string | null {
  if ([startsAt, endsAt, judgingEndsAt].some((d) => Number.isNaN(d.getTime()))) return "Preencha as três datas.";
  if (endsAt <= startsAt) return "O fim das entregas precisa ser depois do início.";
  if (judgingEndsAt <= endsAt) return "O fim do julgamento precisa ser depois do fim das entregas.";
  return null;
}

type Scope = { scope: "PLATAFORMA" | "ESTADOS" | "CIDADES" | "ESCOLAS"; states: string[]; cities: string[]; orgIds: string[] };

/** A escola pode participar desta jam? */
export function jamOpenTo(j: Scope, org: { id: string; state: string; city: string } | null) {
  if (!org) return false;
  switch (j.scope) {
    case "PLATAFORMA":
      return true;
    case "ESTADOS":
      return j.states.includes(org.state);
    case "CIDADES":
      return j.cities.some((c) => cityKey(c) === cityKey(org.city));
    case "ESCOLAS":
      return j.orgIds.includes(org.id);
  }
}

/** Aceita só links do YouTube e devolve o id do vídeo (11 caracteres). */
export function parseYouTube(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/]+)/);
      id = m?.[2] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

// sem 0/O, 1/I/L para não confundir quem lê em voz alta
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Código anônimo da entrega (ex.: "K7Q2"), único dentro da jam. */
export function newAnonCode(taken: Set<string>): string {
  for (let i = 0; i < 1000; i++) {
    const code = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
    if (!taken.has(code)) return code;
  }
  throw new Error("Não foi possível gerar um código anônimo.");
}

export function slugifyJam(title: string) {
  return title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "jam";
}

// ───────────── Ranking ─────────────

export type Criterion = { id: string; weight: number; maxScore: number };
export type Score = { entryId: string; criterionId: string; judgeId: string; value: number };

/**
 * Nota de 0 a 100 por entrega: para cada jurado, média ponderada (nota/máximo) dos critérios
 * que ele avaliou; depois a média entre os jurados. Empates dividem a mesma posição.
 */
export function rankEntries(entryIds: string[], criteria: Criterion[], scores: Score[]) {
  const crit = new Map(criteria.map((c) => [c.id, c]));
  const rows = entryIds.map((entryId) => {
    const byJudge = new Map<string, { sum: number; w: number }>();
    for (const s of scores) {
      const c = crit.get(s.criterionId);
      if (s.entryId !== entryId || !c || c.maxScore <= 0) continue;
      const acc = byJudge.get(s.judgeId) ?? { sum: 0, w: 0 };
      acc.sum += c.weight * Math.min(1, Math.max(0, s.value / c.maxScore));
      acc.w += c.weight;
      byJudge.set(s.judgeId, acc);
    }
    const perJudge = [...byJudge.values()].filter((a) => a.w > 0).map((a) => a.sum / a.w);
    const score = perJudge.length ? (100 * perJudge.reduce((a, b) => a + b, 0)) / perJudge.length : null;
    return { entryId, score: score === null ? null : Math.round(score * 10) / 10, judges: perJudge.length };
  });
  rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  let place = 0;
  let prev: number | null | undefined;
  return rows.map((r, i) => {
    if (r.score !== prev) place = i + 1;
    prev = r.score;
    return { ...r, place: r.score === null ? null : place };
  });
}

/** "AAAA-MM-DDTHH:MM" no horário de Brasília (para <input type="datetime-local">). */
export function toBrasiliaInput(d: Date) {
  const local = new Date(d.getTime() - 3 * 3600_000);
  return local.toISOString().slice(0, 16);
}

/** Datas sugeridas para uma jam nova: abre em 7 dias, 14 dias de entrega, 7 de julgamento. */
export function defaultJamDates(now = new Date()) {
  const day = 86_400_000;
  const start = new Date(Math.ceil((now.getTime() + 7 * day) / 3600_000) * 3600_000);
  return {
    startsAt: toBrasiliaInput(start),
    endsAt: toBrasiliaInput(new Date(start.getTime() + 14 * day)),
    judgingEndsAt: toBrasiliaInput(new Date(start.getTime() + 21 * day)),
  };
}

export const DEFAULT_CRITERIA = [
  { name: "Criatividade", weight: 1, maxScore: 10 },
  { name: "Uso do tema", weight: 1, maxScore: 10 },
  { name: "Jogabilidade", weight: 1, maxScore: 10 },
  { name: "Programação", weight: 1, maxScore: 10 },
  { name: "Documentação", weight: 0.5, maxScore: 10 },
];
