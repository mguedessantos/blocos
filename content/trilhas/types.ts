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
  /** EDITOR = editor de blocos do site (padrão); SB3 = feito no PictoBlox e enviado como arquivo .sb3. */
  mode?: "EDITOR" | "SB3";
  /** Missão extra que não bloqueia a trilha (ex.: levar a habilidade ao PictoBlox). */
  optional?: boolean;
  /** Projeto inicial (formato do editor); sobrescreve `startWithFlag`. */
  starter?: object;
  xp?: number;
  /** Markdown simples (títulos, listas, **negrito**, `código`, > destaque). */
  content: string;
  /** Opcodes liberados na caixa de blocos (só EDITOR). */
  allowedBlocks?: string[];
  /** true = começa com o bloco “quando 🏁 for clicado” já na área. */
  startWithFlag?: boolean;
  checks?: Checks;
  guide?: TeacherGuide;
  /** Desafio extra opcional (markdown), para quem termina antes ou alunos mais velhos. */
  extra?: string;
  /** Verificação do desafio extra: quando passa, o aluno ganha XP bônus (uma vez). */
  extraChecks?: Checks;
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
