import { caca, cacaAoTesouro } from "../jogo";
import { move } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "tesouro-primeira-moeda",
  title: "Tesouro 1: a primeira moeda",
  type: "EXERCICIO",
  content: `## Jogo: caça ao tesouro

O Glitch espalhou moedas pela Vila do Palco! Cada moeda que o Bloquinho tocar some e conta em **tesouros**.

As moedas já estão programadas. Você só programa o **Bloquinho**: embaixo dos blocos que já estão lá, faça ele **andar até a moeda**.

> Dica: olhe a grade. A moeda está em **x: 150, y: 0**.`,
  ...caca([[150, 0]]),
  checks: {
    maxSeconds: 5,
    checks: [{ type: "variableAtLeast", name: "tesouros", min: 1, message: "O Bloquinho precisa chegar até a moeda (x: 150, y: 0).", goal: "Leve o Bloquinho até a **moeda** (x: 150, y: 0)" }],
  },
  guide: {
    objetivo: "Usar os movimentos aprendidos com um objetivo de jogo.",
    minutos: 10,
    passos: ["Mostre que as moedas já têm programa: clique nelas e veja os blocos.", "Pergunte: quantos passos até a moeda?"],
    errosComuns: ["Apagar os blocos que já vêm no Bloquinho (vá para o centro): eles fazem o jogo recomeçar certo."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cacaAoTesouro([[150, 0]], [move(150)]),
};
