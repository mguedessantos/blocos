import { GRID, JUMP } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pule-para-a-direita",
  title: "Pule para a direita",
  type: "EXERCICIO",
  content: `## Missão: pule para a direita!

À direita do centro, o **x é positivo**. A borda direita do palco é **x: 240**.`,
  allowedBlocks: JUMP,
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o lado **direito**: **vá para x: 240 y: 0**" },
      { type: "visits", points: [{ x: 240, goal: "Pule para o lado **direito**: **vá para x: 240 y: 0**" }] },
    ],
  },
  guide: {
    objetivo: "Entender o x positivo (para a direita).",
    minutos: 10,
    passos: ["Compare com a lição anterior: o que muda é só o sinal."],
    errosComuns: ["Colocar 240 no y."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(240, 0)),
};
