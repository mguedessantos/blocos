import { VIDA } from "../../blocos/basico";
import { flag, game, move, playUntilDone, sound } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "sons-no-palco",
  title: "Som na caixa!",
  type: "EXERCICIO",
  content: `## Missão: faça barulho

Os blocos **rosa** tocam sons. Quando a bandeira for clicada:

1. **toque o som Pulo**
2. **mova 50 passos**
3. **toque o som Vitória até o fim**

> Ligue o som do computador (ou use fones de ouvido).`,
  allowedBlocks: VIDA,
  starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    checks: [
      { type: "usesAnyBlock", opcodes: ["sound_play", "sound_playuntildone"], min: 2, label: "Toque pelo menos 2 sons", goal: "Use pelo menos **2 sons**" },
      { type: "playedSound", sound: "pulo", goal: "Toque o som **Pulo**" },
      { type: "playedSound", sound: "vitoria", goal: "Toque o som **Vitória**" },
    ],
  },
  guide: {
    objetivo: "Usar sons como retorno para o jogador.",
    minutos: 10,
    passos: ["Compare “toque o som” e “toque o som até o fim”: qual espera?", "Fones de ouvido ajudam muito nesta aula!"],
    errosComuns: ["Achar que o som não tocou porque o computador está no mudo."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [[flag(), sound("pulo"), move(50), playUntilDone("vitoria")]] }] },
};
