import { TODOS } from "../../blocos/avancado";
import { game, goTo, sound, whenClicked } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "teleporte",
  title: "Teleporte",
  type: "EXERCICIO",
  content: `## Missão: me pega se puder!

Quando o Bloquinho for **clicado**, ele **vai para [posição aleatória]** e toca o som **Pop**.

Agora é um jogo de reflexo: tente clicar nele!`,
  allowedBlocks: TODOS,
  starter: game({ sprites: [{ name: "Bloquinho" }] }),
  checks: {
    maxSeconds: 2,
    inputs: [{ click: "Bloquinho", at: 0.3 }],
    checks: [
      { type: "usesBlock", opcode: "event_whenthisspriteclicked" },
      { type: "usesAnyBlock", opcodes: ["motion_goto", "motion_gotoxy"], label: "Mande o Bloquinho para outro lugar quando for clicado" },
      { type: "walked", min: 5, message: "Quando clicado, o Bloquinho precisa mudar de lugar." },
      { type: "playedSound", sound: "pop", bonus: true, message: "Bônus: toque o som Pop no clique." },
    ],
  },
  guide: {
    objetivo: "Usar aleatoriedade para deixar o jogo imprevisível.",
    minutos: 10,
    passos: ["Mostre a diferença entre “vá para posição aleatória” e “vá para x: (número aleatório) y: (número aleatório)”."],
    errosComuns: ["Sortear valores que saem do palco (ex.: x até 500)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [[whenClicked(), goTo("_random_"), sound("pop")]] }] },
};
