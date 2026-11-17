import { BROADCAST, TODOS } from "../../blocos/avancado";
import { backdrop, broadcast, flag, game, hide, say, show, t, whenClicked, whenReceive } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "telas-do-jogo",
  title: "Início, jogo e fim",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: as telas do jogo

Todo jogo tem telas: **início**, **jogo** e **fim**. Este projeto já tem os cenários **Tela de início**, **Floresta** e **Tela de fim**.

1. No **Botão**: quando a bandeira for clicada → **mude para o cenário Tela de início** e **mostre**.
2. No **Botão**: quando for clicado → **mude para o cenário Floresta**, **transmita [começar]** e **esconda**.
3. No **Bloquinho**: **quando eu receber [começar]** → **diga “O jogo começou!”**.`,
  allowedBlocks: TODOS,
  starter: game({ backdrops: ["inicio", "floresta", "fim"], sprites: [{ name: "Botão", character: "botao", y: -60 }, { name: "Bloquinho", x: -150, y: -120 }] }),
  checks: {
    maxSeconds: 3,
    inputs: [{ click: "Botão", at: 0.5 }],
    checks: [
      { type: "usesBlock", opcode: "looks_switchbackdropto", min: 2 },
      { type: "usesAnyBlock", opcodes: BROADCAST, label: "Avise os atores com uma mensagem quando o jogo começar" },
      { type: "backdropIs", backdrop: "floresta", message: "Depois do clique no Botão, o palco precisa mostrar a Floresta." },
      { type: "said", text: "começou" },
    ],
  },
  guide: {
    objetivo: "Estruturar um jogo em estados (início → jogo → fim).",
    minutos: 25,
    passos: ["Mostre um jogo conhecido e identifique as telas com a turma."],
    errosComuns: ["Atores do jogo aparecendo na tela de início: use esconda/mostre com as mensagens."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["inicio", "floresta", "fim"], sprites: [
  { name: "Botão", character: "botao", y: -60, code: [[flag(), backdrop("inicio"), show()], [whenClicked(), backdrop("floresta"), broadcast("começar"), hide()]] },
  { name: "Bloquinho", x: -150, y: -120, code: [[whenReceive("começar"), say(t("O jogo começou!"))]] },
  ] },
};
