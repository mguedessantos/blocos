import { CONTROLE } from "../../blocos/intermediario";
import { changeX, changeY, game, whenKey } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "voo-em-4-direcoes",
  title: "Voo em 4 direções",
  type: "EXERCICIO",
  content: `## Missão: voe para cima e para baixo

O Bloquinho já anda para os **lados**: a seta para a **direita** soma 10 no **x** e a seta para a **esquerda** soma -10 no **x**. Falta voar!

Ele já tem os blocos **quando a tecla seta para cima for pressionada** e **quando a tecla seta para baixo for pressionada**, ainda vazios. Complete:

1. Embaixo da **seta para cima**: **adicione 10 a y** (sobe).
2. Embaixo da **seta para baixo**: **adicione -10 a y** (desce).

Lembre da grade do palco: o **y** cresce para **cima**. Clique no palco e teste as 4 setas (não precisa da bandeira verde).`,
  allowedBlocks: CONTROLE,
  starter: game({
    backdrops: ["grade"],
    sprites: [{ name: "Bloquinho", code: [[whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)], [whenKey("up arrow")], [whenKey("down arrow")]] }],
  }),
  checks: {
    maxSeconds: 2,
    inputs: [
      { key: "up arrow", from: 0.1, to: 0.2 }, { key: "up arrow", from: 0.3, to: 0.4 }, { key: "down arrow", from: 0.5, to: 0.6 },
      { key: "right arrow", from: 0.7, to: 0.8 }, { key: "left arrow", from: 0.9, to: 1.0 }, { key: "left arrow", from: 1.1, to: 1.2 },
    ],
    checks: [
      {
        type: "visits", tolerance: 1,
        points: [
          { y: 20, goal: "Seta para **cima**: o Bloquinho sobe 10 (**adicione 10 a y**)" },
          { y: 10, goal: "Seta para **baixo**: o Bloquinho desce 10 (**adicione -10 a y**)" },
        ],
      },
      { type: "finalPosition", x: -10, y: 10, tolerance: 1, message: "Com cima 2 vezes, baixo 1, direita 1 e esquerda 2, o Bloquinho deveria terminar em x: -10, y: 10.", goal: "As 4 setas juntas levam o Bloquinho a **x: -10, y: 10**" },
    ],
  },
  guide: {
    objetivo: "Controle em 4 direções com x e y.",
    minutos: 10,
    passos: ["Lembre: y positivo é para cima."],
    errosComuns: ["Trocar x por y."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [
  [whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)], [whenKey("up arrow"), changeY(10)], [whenKey("down arrow"), changeY(-10)],
  ] }] },
  erros: [
    { sprites: [{ name: "Bloquinho", code: [
    [whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)], [whenKey("up arrow"), changeY(10)], [whenKey("down arrow"), changeY(10)],
    ] }] },
  ],
};
