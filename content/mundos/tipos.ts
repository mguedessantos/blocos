import type { GameSpec } from "../../src/lib/blocks/build";
import type { Checks } from "../../src/lib/checker";

/** Guia do professor: aparece só para professores, na visualização da lição. */
export type TeacherGuide = {
  /** O que o aluno deve aprender (uma frase). */
  objetivo: string;
  /** Tempo sugerido em sala, em minutos. */
  minutos: number;
  /** Como conduzir a atividade. */
  passos: string[];
  /** Erros comuns e como ajudar. */
  errosComuns: string[];
};

export type LessonContent = {
  slug: string;
  title: string;
  type: "TEORIA" | "DEMO" | "EXERCICIO" | "DESAFIO";
  /** Projeto inicial (formato do editor); sobrescreve `startWithFlag`. */
  starter?: object;
  xp?: number;
  /** Markdown simples (títulos, listas, **negrito**, `código`, > destaque). */
  content: string;
  /** Opcodes liberados na caixa de blocos (só EDITOR). */
  allowedBlocks?: string[];
  /** true = começa com o bloco “quando a bandeira verde for clicada” já na área. */
  startWithFlag?: boolean;
  checks?: Checks;
  guide?: TeacherGuide;
};

export type TrackContent = {
  slug: string;
  title: string;
  description: string;
  /** Texto de abertura do mundo (narrativa). */
  story?: string;
  /** 1 = básico, 2 = intermediário, 3 = avançado. */
  level: number;
  order: number;
  modules: { title: string; lessons: LessonContent[] }[];
};

export const FLAG_STARTER = {
  blocks: { languageVersion: 0, blocks: [{ type: "event_whenflagclicked", x: 220, y: 40 }] },
};

export function guideMarkdown(g: TeacherGuide) {
  return [
    `**Objetivo:** ${g.objetivo}`,
    `**Tempo sugerido:** ${g.minutos} min`,
    `## Como conduzir`,
    g.passos.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    `## Erros comuns`,
    g.errosComuns.map((e) => `- ${e}`).join("\n"),
  ].join("\n\n");
}

/**
 * Solução de referência e erros comuns de uma lição. SÓ os testes usam: o seed grava apenas os campos da lição
 * (`licao`) e nenhum arquivo de src/ importa content/mundos, então isso nunca chega ao banco nem ao navegador do aluno.
 */
export type LessonTest = { solucao: GameSpec; erros?: GameSpec[] };

/** Um arquivo de lição: o que o aluno vê (`licao`) e, nos exercícios, a solução para os testes (`teste`). */
export type LessonFile = { licao: LessonContent; teste?: LessonTest };

/** Monta um mundo a partir dos arquivos das lições, na ordem da lista. */
export function mundo(t: Omit<TrackContent, "modules"> & { modules: { title: string; lessons: LessonFile[] }[] }) {
  const files = t.modules.flatMap((m) => m.lessons);
  return {
    track: { ...t, modules: t.modules.map((m) => ({ title: m.title, lessons: m.lessons.map((l) => l.licao) })) } as TrackContent,
    testes: Object.fromEntries(files.flatMap((l) => (l.teste ? [[l.licao.slug, l.teste] as const] : []))),
  };
}
