import { GRID, JUMP } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pule-para-o-canto",
  title: "Pule para o canto",
  type: "EXERCICIO",
  content: `## Missão: x e y juntos!

Agora use os **dois números ao mesmo tempo**: o **x** escolhe o lado e o **y** escolhe a altura.

Use um bloco **vá para x: y:** para cada pulo, **na ordem** dos objetivos.`,
  allowedBlocks: JUMP,
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para **x: 150, y: 100**" },
      {
        type: "visits",
        points: [
          { x: 150, y: 100, goal: "Pule para **x: 150, y: 100**" },
          { x: 240, y: 180, goal: "Pule para o **canto de cima, à direita** (x: 240, y: 180)" },
        ],
      },
    ],
  },
  guide: {
    objetivo: "Combinar x e y num mesmo pulo.",
    minutos: 10,
    passos: ["Peça para a turma “adivinhar” onde fica x: 150, y: 100 antes de testar."],
    errosComuns: ["Trocar x por y."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(150, 100), gotoXY(240, 180)),
};
