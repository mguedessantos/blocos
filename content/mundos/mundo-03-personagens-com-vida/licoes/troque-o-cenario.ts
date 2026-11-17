import { VIDA } from "../../blocos/basico";
import { backdrop, flag, game, sayFor } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "troque-o-cenario",
  title: "Troque o cenário",
  type: "EXERCICIO",
  content: `## Missão: uma viagem

O palco deste projeto tem dois cenários: **Branco** e **Floresta**.

Quando a bandeira for clicada: o Bloquinho diz **“Vamos passear!”** por 2 segundos e depois **mude para o cenário Floresta**.

> Para ver os cenários, clique em **Palco** (à direita da lista de atores) e depois na aba **Cenários**.`,
  allowedBlocks: VIDA,
  starter: game({ backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    checks: [
      { type: "usesBlock", opcode: "looks_switchbackdropto", goal: "Use **mude para o cenário**" },
      { type: "backdropIs", backdrop: "floresta", goal: "Termine no cenário **Floresta**" },
      { type: "said", text: "passear", goal: "Diga **Vamos passear!**" },
    ],
  },
  guide: {
    objetivo: "Trocar cenários pelo código (base para fases e telas de jogo).",
    minutos: 10,
    passos: ["Mostre a coluna Palco e a aba Cenários no projetor."],
    errosComuns: ["Trocar o cenário antes de o Bloquinho falar (a ordem dos blocos importa)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag(), sayFor("Vamos passear!", 2), backdrop("floresta")]] }] },
};
