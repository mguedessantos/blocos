import { GRID, MOVE } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { move, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "passeio-com-pausa",
  title: "Um passeio com pausa",
  type: "EXERCICIO",
  content: `## Missão: respire fundo

O computador é rápido demais: às vezes nem dá para ver o que aconteceu! O bloco **espere 1 segundos** dá uma pausa entre um passo e outro.`,
  allowedBlocks: [...MOVE, "control_wait"],
  starter: GRID,
  checks: {
    checks: [
      {
        type: "visits",
        points: [
          { x: 50, y: 0, goal: "Ande **50 passos**" },
          { wait: 1, goal: "Espere **1 segundo**" },
          { x: 100, y: 0, goal: "Ande mais **50 passos**" },
        ],
        tolerance: 5,
      },
    ],
  },
  guide: {
    objetivo: "Usar espera para controlar o tempo de uma animação.",
    minutos: 10,
    passos: ["Rode sem a espera e pergunte: deu para ver o que aconteceu?", "Adicione a espera e compare."],
    errosComuns: ["Colocar a espera no final, onde ela não muda nada visível."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(move(50), wait(1), move(50)),
};
