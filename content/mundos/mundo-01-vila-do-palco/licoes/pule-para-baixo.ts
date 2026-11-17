import { GRID, JUMP } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pule-para-baixo",
  title: "Pule para baixo",
  type: "EXERCICIO",
  content: `## Missão: pule para o chão!

Abaixo do centro, o **y fica negativo**: tem um sinal de menos na frente. O chão do palco é **y: -180**.

Use **vá para x: y:** e coloque **-180** no y.`,
  allowedBlocks: JUMP,
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para a parte de **baixo**: **vá para x: 0 y: -180**" },
      { type: "visits", points: [{ y: -180, goal: "Pule para a parte de **baixo**: **vá para x: 0 y: -180**" }] },
    ],
  },
  guide: {
    objetivo: "Entender o y negativo (para baixo).",
    minutos: 10,
    passos: ["Pergunte: se o topo é 180, o que é o chão?"],
    errosComuns: ["Esquecer o sinal de menos."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(0, -180)),
};
