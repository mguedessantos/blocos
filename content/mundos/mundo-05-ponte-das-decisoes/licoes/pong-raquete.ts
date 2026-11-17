import { changeX, forever, game, iff, keyPressed } from "../../../../src/lib/blocks/build";
import { pong, RAQUETE, SE, SEMPRE_SE } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pong-raquete",
  title: "Pong 1: a raquete",
  type: "EXERCICIO",
  content: `## Jogo: Pong

No **Pong**, uma bola cai e você rebate com uma **raquete**. O jogo inteiro é feito de **decisões**: *se* a seta está apertada, a raquete anda; *se* a bola toca na raquete, ela sobe; *se* a bola passa, você perde.

Primeiro, a raquete. Na **Raquete**, embaixo da bandeira, monte:

1. **sempre**
2. dentro dele, **se (tecla seta para a direita pressionada?) então** com **adicione 10 a x**
3. outro **se** para a **seta para a esquerda**, com **adicione -10 a x**

Diferente do Mundo 4, o **sempre** pergunta pelas teclas o tempo todo: segurando a seta, a raquete desliza sem parar.

> Clique no palco antes de apertar as setas.`,
  allowedBlocks: ["control_forever", "control_if", "sensing_keypressed", "motion_changexby"],
  starter: game(pong([], [], false)),
  checks: {
    maxSeconds: 2,
    inputs: [{ key: "right arrow", from: 0.1, to: 0.6 }, { key: "left arrow", from: 0.7, to: 1.7 }],
    checks: [
      { type: "inside", parent: SEMPRE_SE, child: SE, label: "Use se… então dentro do sempre", goal: "Use **se… então** dentro do **sempre**" },
      {
        type: "visits", sprite: "Raquete", tolerance: 30,
        points: [
          { x: 100, goal: "Segurando a **seta para a direita**, a raquete desliza para a direita" },
          { x: -100, goal: "Segurando a **seta para a esquerda**, a raquete desliza para a esquerda" },
        ],
      },
    ],
  },
  guide: {
    objetivo: "Usar se… então com um sensor de tecla dentro do sempre (controle suave).",
    minutos: 15,
    passos: [
      "Compare com o Mundo 4: lá o bloco de tecla era um chapéu e andava um passo por toque; aqui o sempre pergunta o tempo todo.",
      "Peça para a turma segurar a seta e ver a raquete deslizar.",
    ],
    errosComuns: ["Colocar os se… então fora do sempre: a pergunta é feita uma vez só, no começo.", "Usar 10 nas duas setas: a raquete só vai para a direita."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pong(RAQUETE, [], false),
  erros: [
    pong([forever(iff(keyPressed("right arrow"), changeX(10)), iff(keyPressed("left arrow"), changeX(10)))], [], false),
    pong([iff(keyPressed("right arrow"), changeX(10)), iff(keyPressed("left arrow"), changeX(-10))], [], false), // sem sempre
  ],
};
