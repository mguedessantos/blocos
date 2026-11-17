import { TODOS } from "../../blocos/avancado";
import { flag, game, hide, repeat, show, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "invisibilidade",
  title: "Invisibilidade",
  type: "EXERCICIO",
  content: `## Missão: agora você me vê...

Faça o Bloquinho **piscar**: quando a bandeira for clicada, **repita 5 vezes**: **esconda**, **espere 0.3 segundos**, **mostre**, **espere 0.3 segundos**.`,
  allowedBlocks: TODOS,
  starter: game({ backdrops: ["castelo"], sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    checks: [
      { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_hide"], label: "Use “esconda” dentro de um repita" },
      { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_show"], label: "Use “mostre” dentro de um repita" },
      { type: "visible", value: true, message: "No fim, o Bloquinho precisa estar visível." },
    ],
  },
  guide: {
    objetivo: "Controlar a visibilidade de atores (itens coletados, inimigos derrotados).",
    minutos: 10,
    passos: ["Pergunte: em que jogos as coisas somem? (moedas pegas, inimigos derrotados, fantasmas)."],
    errosComuns: ["Terminar com o ator escondido e não conseguir mais vê-lo: comece com “mostre” na bandeira."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo"], sprites: [{ name: "Bloquinho", code: [[flag(), repeat(5, hide(), wait(0.3), show(), wait(0.3))]] }] },
};
