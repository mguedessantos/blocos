import { GRID, JUMP } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pule-para-cima",
  title: "Pule para cima",
  type: "EXERCICIO",
  content: `## Missão: pule para o topo!

O palco é como um mapa. Todo lugar dele tem dois números:

- **x**: a posição na horizontal (de um lado para o outro).
- **y**: a posição na vertical (de cima para baixo).
- O centro do palco é **x: 0, y: 0**.

O bloco **vá para x: y:** faz o Bloquinho pular direto para um lugar. Quanto **maior o y**, mais para cima. O topo do palco é **y: 180**.`,
  allowedBlocks: JUMP,
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o **topo** do palco: **vá para x: 0 y: 180**" },
      { type: "visits", points: [{ y: 180, goal: "Pule para o **topo** do palco: **vá para x: 0 y: 180**" }] },
    ],
  },
  guide: {
    objetivo: "Entender o palco como um mapa e o y positivo (para cima).",
    minutos: 10,
    passos: ["Desenhe o plano cartesiano no quadro com o centro (0,0) e mostre o topo (y: 180)."],
    errosComuns: ["Mudar o x em vez do y."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(0, 180)),
};
