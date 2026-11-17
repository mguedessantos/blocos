import { BASE } from "../../blocos/repeticao";
import { one } from "../../teste";
import { left, move, repeat, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "triangulo",
  title: "Triângulo",
  type: "EXERCICIO",
  content: `## Missão: ande em triângulo

Um triângulo tem **3 lados**. Para fechar a figura, o Bloquinho precisa girar **120 graus** em cada canto (3 × 120 = 360, uma volta inteira!).

Faça o Bloquinho andar em um triângulo com lados de **100 passos**, usando **repita**. No fim, ele **sai** do triângulo.

Coloque um **espere** dentro do repita para ver o Bloquinho andando, em vez de pular.`,
  allowedBlocks: [...BASE, "control_wait"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat", goal: "Use o bloco **repita**" },
      { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Coloque um bloco “espere” dentro do repita", goal: "Coloque um **espere** dentro do **repita**, para ver o Bloquinho andando" },
      {
        type: "visits",
        points: [
          { x: 100, y: 0, goal: "Chegue no **1º canto** (x: 100, y: 0)" },
          { x: 50, y: 87, goal: "Chegue no **2º canto**, lá em cima" },
          { x: 0, y: 0, goal: "Volte para o **começo** e feche o triângulo" },
          { x: 50, y: 0, goal: "Depois do **repita**, ande **50 passos** para sair do triângulo" },
        ],
        tolerance: 5,
      },
      { type: "maxBlocks", max: 6, bonus: true, goal: "Use só **6 blocos** no total" },
    ],
  },
  guide: {
    objetivo: "Generalizar: em um polígono, a soma dos giros é 360.",
    minutos: 10,
    passos: ["Pergunte: se o quadrado gira 4 × 90 = 360, quanto o triângulo gira em cada canto?"],
    errosComuns: ["Girar 60 (ângulo interno) em vez de 120 (ângulo externo)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(3, move(100), wait(0.5), left(120)), move(50)),
  erros: [
    one(repeat(3, move(100), left(90))),
  ],
};
