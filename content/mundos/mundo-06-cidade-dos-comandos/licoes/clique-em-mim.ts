import { CONTROLE } from "../../blocos/intermediario";
import { game, sayFor, whenClicked } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "clique-em-mim",
  title: "Clique em mim!",
  type: "EXERCICIO",
  content: `## Missão: cócegas!

Use **quando este ator for clicado** → **diga “Ai, que cócegas!” por 1 segundo**.

Execute e clique no Bloquinho no palco!`,
  allowedBlocks: CONTROLE,
  starter: game({ sprites: [{ name: "Bloquinho" }] }),
  checks: {
    maxSeconds: 2,
    inputs: [{ click: "Bloquinho", at: 0.3 }],
    checks: [
      { type: "usesBlock", opcode: "event_whenthisspriteclicked" },
      { type: "said", text: "Ai, que cocegas!" },
    ],
  },
  guide: {
    objetivo: "Usar o evento de clique, base de botões e menus.",
    minutos: 10,
    passos: ["Conte que botões de “Jogar” em menus funcionam assim."],
    errosComuns: ["Esquecer de clicar na bandeira verde antes de clicar no ator."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [[whenClicked(), sayFor("Ai, que cócegas!", 1)]] }] },
};
