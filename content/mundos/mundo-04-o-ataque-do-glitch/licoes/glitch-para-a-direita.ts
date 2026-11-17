import { ATAQUE, ataqueDoGlitch, treino } from "../jogo";
import { changeX, game, whenKey } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "glitch-para-a-direita",
  title: "Fuja para a direita",
  type: "EXERCICIO",
  content: `## Missão: um passo para a direita

O Glitch ainda está parado, só observando. Treine o Bloquinho antes do ataque!

Use **quando a tecla seta para a direita for pressionada** e, embaixo dele, **adicione 20 a x**. Clique no palco e aperte a seta para testar.`,
  allowedBlocks: ATAQUE,
  starter: game(ataqueDoGlitch([], false)),
  checks: {
    ...treino,
    inputs: [{ key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.4, to: 0.5 }, { key: "right arrow", from: 0.7, to: 0.8 }],
    checks: [
      { type: "keys", min: 1, message: "Use o bloco “quando a tecla … for pressionada”.", goal: "Use **quando a tecla seta para a direita for pressionada**" },
      {
        type: "finalPosition", sprite: "Bloquinho", x: 60, y: -140, tolerance: 1,
        message: "Com 3 toques na seta da direita, o Bloquinho deveria chegar em x: 60. Use adicione 20 a x.",
        goal: "A cada toque, ande **20** para a direita (**adicione 20 a x**)",
      },
    ],
  },
  guide: {
    objetivo: "Controlar o ator com um evento de tecla.",
    minutos: 10,
    passos: ["Mostre que o bloco de tecla é um chapéu: ele começa um programa novo, sem a bandeira verde."],
    errosComuns: ["Encaixar embaixo da bandeira verde em vez de usar o bloco de tecla.", "Usar 20 negativo e o Bloquinho ir para a esquerda."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: ataqueDoGlitch([[whenKey("right arrow"), changeX(20)]], false),
};
