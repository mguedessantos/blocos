import { BASE } from "../../blocos/repeticao";
import { one } from "../../teste";
import { left, move, repeat, right, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "escada",
  title: "Escada",
  type: "EXERCICIO",
  content: `## Missão: suba a escada

Cada degrau é assim: **anda 30 para a direita, sobe 30**. Faça o Bloquinho subir **4 degraus**.

Ele precisa terminar em **x: 120, y: 120**, olhando para a **direita** (direção 90).

> Dica: para subir, gire para a esquerda; depois, gire de volta para a direita. Coloque um **espere** dentro do repita para ver cada degrau.`,
  allowedBlocks: [...BASE, "control_wait"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat", goal: "Use o bloco **repita**" },
      { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Coloque um bloco “espere” dentro do repita", goal: "Coloque um **espere** dentro do **repita**, para ver o Bloquinho subindo" },
      {
        type: "visits",
        points: [
          { x: 30, y: 30, goal: "Suba o **1º degrau** (x: 30, y: 30)" },
          { x: 60, y: 60, goal: "Suba o **2º degrau** (x: 60, y: 60)" },
          { x: 90, y: 90, goal: "Suba o **3º degrau** (x: 90, y: 90)" },
          { x: 120, y: 120, goal: "Suba o **4º degrau** (x: 120, y: 120)" },
        ],
        tolerance: 5,
      },
      { type: "finalDirection", direction: 90, goal: "Termine olhando para a **direita**" },
      { type: "maxBlocks", max: 7, bonus: true, goal: "Use só **7 blocos** no total" },
    ],
  },
  guide: {
    objetivo: "Repetir uma sequência de vários blocos.",
    minutos: 10,
    passos: ["Desenhe um degrau no quadro e peça para a turma ditar os 4 movimentos."],
    errosComuns: ["Esquecer de girar de volta para a direita no fim de cada degrau."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(4, move(30), left(90), move(30), right(90), wait(0.3))),
};
