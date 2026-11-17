import { SENSORES } from "../../blocos/intermediario";
import { flag, forever, game, iff, move, say, stopAll, t, touching } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "bati",
  title: "Bati!",
  type: "EXERCICIO",
  content: `## Missão: cuidado com a parede

O Bloquinho vai andar até a **Parede**. No **Bloquinho**:

**sempre** → **mova 5 passos** → **se tocando em [Parede]? então** → **diga “Bati!”** e **pare [tudo]**.`,
  allowedBlocks: SENSORES,
  starter: game({ sprites: [{ name: "Bloquinho", x: -150 }, { name: "Parede", character: "parede", x: 120 }] }),
  checks: {
    maxSeconds: 5,
    checks: [
      { type: "usesBlock", opcode: "sensing_touchingobject" },
      { type: "said", text: "Bati" },
      { type: "stopped" },
      { type: "finalPosition", x: 50, y: 0, tolerance: 8, message: "O Bloquinho precisa parar quando encostar na Parede (escolha “Parede” no menu do sensor, não “borda”)." },
    ],
  },
  guide: {
    objetivo: "Detectar colisão entre atores e parar o jogo.",
    minutos: 10,
    passos: ["Mostre o menu do sensor: borda, ponteiro do mouse e cada ator do projeto."],
    errosComuns: ["Escolher “borda” em vez de “Parede” no menu."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [
  { name: "Bloquinho", x: -150, code: [[flag(), forever(move(5), iff(touching("Parede"), say(t("Bati!")), stopAll()))]] },
  { name: "Parede", character: "parede", x: 120 },
  ] },
  erros: [
    { sprites: [
    { name: "Bloquinho", x: -150, code: [[flag(), forever(move(5), iff(touching("_edge_"), say(t("Bati!")), stopAll()))]] },
    { name: "Parede", character: "parede", x: 120 },
    ] },
  ],
};
