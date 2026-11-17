import { BOLA, bolaQuicando } from "../jogo";
import { game, move, repeat } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "bola-repita",
  title: "Bola 1: repita para chegar",
  type: "EXERCICIO",
  content: `## Jogo: a bola mágica da torre

Na Torre das Repetições há uma **bola mágica**. Cada vez que ela passa por uma **estrela**, soma 1 em **batidas**.

As estrelas já estão programadas. Você programa a **Bola**: use **repita** com **mova 10 passos** dentro, para a bola rolar até a estrela.

> Dica: a bola começa em **x: -200** e a estrela está em **x: 100**. Quantas vezes 10 passos?`,
  allowedBlocks: BOLA,
  starter: game(bolaQuicando([[100, 0]], 99, [], -200)),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "usesBlock", opcode: "control_repeat", message: "Use o bloco repita para a bola rolar aos poucos.", goal: "Use **repita** com **mova 10 passos** dentro" },
      { type: "variableAtLeast", name: "batidas", min: 1, message: "A bola precisa passar pela estrela (x: 100).", goal: "A bola passa pela **estrela**" },
    ],
  },
  guide: {
    objetivo: "Usar repita para animar um movimento em um jogo.",
    minutos: 10,
    passos: ["Compare: mova 300 passos (pula) e repita 30 vezes mova 10 (rola). Qual parece um jogo?"],
    errosComuns: ["Repetir poucas vezes e a bola parar antes da estrela.", "Colocar o mova embaixo do repita, e não dentro."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: bolaQuicando([[100, 0]], 99, [repeat(30, move(10))], -200),
  erros: [
    bolaQuicando([[100, 0]], 99, [move(300)], -200),
  ],
};
