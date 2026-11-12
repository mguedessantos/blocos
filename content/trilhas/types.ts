import type { Checks } from "../../src/lib/checker";

export type LessonContent = {
  slug: string;
  title: string;
  type: "TEORIA" | "DEMO" | "EXERCICIO" | "DESAFIO";
  xp?: number;
  /** Markdown simples (títulos, listas, **negrito**, `código`, > destaque). */
  content: string;
  /** Opcodes liberados na caixa de blocos. */
  allowedBlocks?: string[];
  /** true = começa com o bloco “quando 🏁 for clicado” já na área. */
  startWithFlag?: boolean;
  checks?: Checks;
};

export type TrackContent = {
  slug: string;
  title: string;
  description: string;
  level: number;
  order: number;
  modules: { title: string; lessons: LessonContent[] }[];
};

export const FLAG_STARTER = {
  blocks: { languageVersion: 0, blocks: [{ type: "event_whenflagclicked", x: 220, y: 40 }] },
};
