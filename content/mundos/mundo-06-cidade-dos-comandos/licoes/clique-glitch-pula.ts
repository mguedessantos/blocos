import { game } from "../../../../src/lib/blocks/build";
import { cliqueNoGlitch, cliques, PONTO, PULA } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "clique-glitch-pula",
  title: "Clique 2: o Glitch foge",
  type: "EXERCICIO",
  content: `## Missão: o Glitch foge do clique

Parado, o Glitch é fácil demais. Depois de cada ponto, ele precisa **pular para outro lugar**.

No script do clique, embaixo de **adicione 1 a pontos**, coloque **vá para posição aleatória**. Cada vez o Glitch aparece num lugar sorteado do palco.`,
  allowedBlocks: ["motion_goto"],
  starter: game(cliqueNoGlitch([PONTO])),
  checks: {
    maxSeconds: 2.5,
    inputs: cliques(3, 0.5),
    checks: [
      { type: "usesBlock", opcode: "motion_goto", min: 1, message: "Use vá para posição aleatória depois do ponto.", goal: "Use **vá para posição aleatória**" },
      { type: "walked", sprite: "Glitch", min: 50, message: "Depois de cada clique, o Glitch precisa pular para outro lugar.", goal: "A cada clique, o Glitch **pula** para um lugar sorteado" },
      { type: "variableEquals", name: "pontos", value: 3, message: "Cada clique ainda precisa valer 1 ponto.", goal: "Cada clique ainda vale **1 ponto**" },
    ],
  },
  guide: {
    objetivo: "Usar posição aleatória para o jogo nunca ficar igual.",
    minutos: 10,
    passos: ["Compare com vá para x: y: (sempre o mesmo lugar) e pergunte qual deixa o jogo mais divertido."],
    errosComuns: ["Colocar o vá para antes do adicione: funciona, mas confira que os dois estão no mesmo script."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cliqueNoGlitch([PULA]),
  erros: [
    cliqueNoGlitch([PONTO]),
  ],
};
