import { GRID, MOVE } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { move, sayFor } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "diga-ola",
  title: "Diga olá!",
  type: "EXERCICIO",
  content: `## Missão: apresente-se

Os blocos de **Aparência** (roxos) mostram balões de fala. Use o bloco **diga por 2 segundos** para o Bloquinho falar.`,
  allowedBlocks: [...MOVE, "looks_sayforsecs", "looks_say"],
  starter: GRID,
  checks: {
    checks: [
      {
        type: "visits",
        points: [
          { say: "bloquinho", goal: "Diga **Olá, eu sou o Bloquinho!** por 2 segundos" },
          { x: 50, y: 0, goal: "Ande **50 passos**" },
          { say: "tchau", goal: "Diga **Tchau!**" },
        ],
        tolerance: 5,
      },
    ],
  },
  guide: {
    objetivo: "Usar blocos de fala e combinar fala com movimento.",
    minutos: 10,
    passos: ["Compare “diga” e “diga por 2 segundos”: qual espera antes de continuar?"],
    errosComuns: ["Usar “diga” (sem segundos) e o movimento acontecer junto com a fala."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(sayFor("Olá, eu sou o Bloquinho!", 2), move(50), sayFor("Tchau!", 2)),
};
