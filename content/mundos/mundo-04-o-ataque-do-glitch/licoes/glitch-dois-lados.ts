import { ATAQUE, ataqueDoGlitch, treino } from "../jogo";
import { changeX, game, whenKey } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "glitch-dois-lados",
  title: "Fuja para os dois lados",
  type: "EXERCICIO",
  content: `## Missão: direita e esquerda

Agora o Bloquinho precisa fugir para **os dois lados**.

1. Mantenha o programa da **seta para a direita** (adicione **20** a x).
2. Monte outro: **quando a tecla seta para a esquerda for pressionada** e **adicione -20 a x**.`,
  allowedBlocks: ATAQUE,
  starter: game(ataqueDoGlitch([], false)),
  checks: {
    ...treino,
    inputs: [
      { key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.4, to: 0.5 },
      { key: "right arrow", from: 0.7, to: 0.8 }, { key: "left arrow", from: 1.0, to: 1.1 },
    ],
    checks: [
      { type: "keys", min: 2, message: "Use as duas setas: direita e esquerda.", goal: "Use as setas **direita** e **esquerda**" },
      {
        type: "finalPosition", sprite: "Bloquinho", x: 40, y: -140, tolerance: 1,
        message: "Com 3 toques na direita e 1 na esquerda, o Bloquinho deveria chegar em x: 40. Confira: 20 e -20.",
        goal: "Cada toque anda **20** para o lado certo (**20** e **-20**)",
      },
    ],
  },
  guide: {
    objetivo: "Usar número negativo para andar para a esquerda.",
    minutos: 10,
    passos: ["Lembre a régua do x: à esquerda do centro os números ficam negativos."],
    errosComuns: ["Usar adicione 20 a x nas duas setas: o Bloquinho só anda para a direita."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: ataqueDoGlitch([[whenKey("right arrow"), changeX(20)], [whenKey("left arrow"), changeX(-20)]], false),
  erros: [
    ataqueDoGlitch([[whenKey("right arrow"), changeX(20)], [whenKey("left arrow"), changeX(20)]], false),
  ],
};
