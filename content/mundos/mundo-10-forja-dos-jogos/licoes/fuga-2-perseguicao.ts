import { heroControls4, TODOS } from "../../blocos/avancado";
import { flag, forever, game, move, pointTowards } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-2-perseguicao",
  title: "Fuga 2: o Glitch persegue",
  type: "EXERCICIO",
  content: `## Etapa 2: perseguição

No **Glitch**: **sempre** → **aponte para [Bloquinho]** → **mova 2 passos**.

> Ajuste a velocidade: rápido demais fica impossível, devagar demais fica sem graça!`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo"],
    sprites: [{ name: "Bloquinho", x: -150, code: [heroControls4()] }, { name: "Glitch", character: "glitch", x: 150, y: 100 }],
  }),
  checks: {
    maxSeconds: 3,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "O Glitch aponta para o Bloquinho dentro de um “sempre”" },
      { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "O Glitch anda dentro do “sempre”" },
      { type: "walked", sprite: "Glitch", min: 60, message: "O Glitch precisa andar em direção ao Bloquinho." },
    ],
  },
  guide: {
    objetivo: "Criar um inimigo que persegue.",
    minutos: 10,
    passos: ["Discuta equilíbrio de dificuldade: qual velocidade deixa o jogo divertido?"],
    errosComuns: ["Escolher “ponteiro do mouse” em vez de “Bloquinho” no menu."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4()] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(2))]] },
  ] },
};
