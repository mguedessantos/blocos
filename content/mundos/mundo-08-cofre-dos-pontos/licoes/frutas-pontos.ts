import { changeVar, game, n } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { fruta, pegaFrutas, PONTO, SETAS } from "../jogo";

export const licao: LessonContent = {
  slug: "frutas-pontos",
  title: "Pega-frutas 1: pontos",
  type: "EXERCICIO",
  content: `## Jogo: Pega-frutas

As frutas caem do alto e o **Bloquinho** pega com as **setas**. Ele já anda, e a **Fruta** já cai. Falta o **placar**!

O jogo tem duas variáveis, que aparecem no palco: **pontos** (começa em 0) e **vidas** (começa em 3).

Na **Fruta**, dentro de **se tocando em Bloquinho? então**, coloque **adicione 1 a pontos** (Variáveis, laranja).

Pegue **5 frutas** para ver o **CONCLUÍDO**!`,
  allowedBlocks: ["data_changevariableby"],
  starter: game(pegaFrutas(SETAS, fruta([], []))),
  checks: {
    maxSeconds: 3,
    checks: [
      { type: "usesBlock", opcode: "data_changevariableby", min: 1, message: "Use adicione 1 a pontos dentro de se tocando em Bloquinho.", goal: "Use **adicione 1 a pontos**" },
      { type: "variableEquals", name: "pontos", value: 1, message: "A primeira fruta cai bem no Bloquinho: pontos deveria valer 1.", goal: "Cada fruta pega vale **1 ponto**" },
    ],
  },
  guide: {
    objetivo: "Usar uma variável como placar do jogo.",
    minutos: 10,
    passos: ["Mostre o placar no canto do palco subindo a cada fruta.", "Pergunte: onde o placar volta para 0? (no Palco, quando a bandeira é clicada)."],
    errosComuns: ["Colocar o adicione fora do se tocando: os pontos sobem sem parar.", "Usar adicione 10: cada fruta vale 10."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pegaFrutas(SETAS, fruta([PONTO], [])),
  erros: [
    pegaFrutas(SETAS, fruta([changeVar("pontos", n(10))], [])),
    pegaFrutas(SETAS, fruta([], [PONTO])), // no chão em vez de na cesta
  ],
};
