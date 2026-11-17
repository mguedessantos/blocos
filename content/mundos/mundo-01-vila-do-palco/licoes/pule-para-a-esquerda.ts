import { GRID, JUMP } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pule-para-a-esquerda",
  title: "Pule para a esquerda",
  type: "EXERCICIO",
  content: `## Missão: pule para a esquerda!

Agora é o **x**. À esquerda do centro, o **x fica negativo**. A borda esquerda do palco é **x: -240**.`,
  allowedBlocks: JUMP,
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o lado **esquerdo**: **vá para x: -240 y: 0**" },
      { type: "visits", points: [{ x: -240, goal: "Pule para o lado **esquerdo**: **vá para x: -240 y: 0**" }] },
    ],
  },
  guide: {
    objetivo: "Entender o x negativo (para a esquerda).",
    minutos: 10,
    passos: ["Peça para a turma apontar no quadro onde fica x: -240."],
    errosComuns: ["Colocar o -240 no y."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(-240, 0)),
};
