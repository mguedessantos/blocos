import { changeVar, game, n, whenClicked } from "../../../../src/lib/blocks/build";
import { cliqueNoGlitch, cliques, PONTO } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "clique-glitch-ponto",
  title: "Clique 1: pegue o Glitch",
  type: "EXERCICIO",
  content: `## Jogo: Clique no Glitch

O Glitch invadiu a Cidade dos Comandos! O jogo é rápido: **clique no Glitch** para ganhar pontos antes que o **tempo** acabe. O placar (**pontos**) e o relógio (**tempo**) já estão prontos.

No **Glitch**, embaixo de **quando este ator for clicado**, coloque **adicione 1 a pontos** (Variáveis, laranja).

Clique na bandeira verde e depois clique no Glitch!`,
  allowedBlocks: ["event_whenthisspriteclicked", "data_changevariableby"],
  starter: game(cliqueNoGlitch([[whenClicked()]])),
  checks: {
    maxSeconds: 2.5,
    inputs: cliques(3, 0.5),
    checks: [
      { type: "usesBlock", opcode: "data_changevariableby", min: 1, message: "Use adicione 1 a pontos embaixo de quando este ator for clicado.", goal: "Use **adicione 1 a pontos**" },
      { type: "variableEquals", name: "pontos", value: 3, message: "Com 3 cliques no Glitch, pontos deveria valer 3.", goal: "Cada clique no Glitch vale **1 ponto**" },
    ],
  },
  guide: {
    objetivo: "Usar o evento de clique para marcar pontos.",
    minutos: 10,
    passos: ["Mostre o placar no palco subindo a cada clique.", "Pergunte: o que deixaria o jogo mais difícil? (o Glitch fugir)."],
    errosComuns: ["Clicar no Glitch sem antes clicar na bandeira verde: o placar não zera.", "Usar adicione 10: cada clique vale 10."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cliqueNoGlitch([PONTO]),
  erros: [
    cliqueNoGlitch([[whenClicked(), changeVar("pontos", n(10))]]),
  ],
};
