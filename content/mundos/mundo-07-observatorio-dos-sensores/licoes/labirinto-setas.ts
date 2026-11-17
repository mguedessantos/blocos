import { changeX, flag, forever, game, iff, keyPressed } from "../../../../src/lib/blocks/build";
import { bloquinho, CHEGOU, COM_DESCIDA, labirinto } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "labirinto-setas",
  title: "Labirinto 1: ande com as setas",
  type: "EXERCICIO",
  content: `## Jogo: o labirinto

O Glitch escondeu a saída do Observatório num **labirinto**! As paredes e a **bandeira de saída** já estão no palco. Quem precisa de programa é o **Bloquinho**.

Embaixo da **bandeira verde** do Bloquinho, monte:

1. **vá para x: -192 y: -120** (o começo do labirinto)
2. **sempre**, com 4 blocos **se… então** dentro, um para cada seta:

- **tecla seta para a direita pressionada?** → **adicione 5 a x**
- **tecla seta para a esquerda pressionada?** → **adicione -5 a x**
- **tecla seta para cima pressionada?** → **adicione 5 a y**
- **tecla seta para baixo pressionada?** → **adicione -5 a y**

Teste levando o Bloquinho até a **bandeira de saída**, lá em cima à direita: chegando nela, aparece o **CONCLUÍDO**. Por enquanto ele ainda atravessa as paredes. Isso muda na próxima missão!`,
  allowedBlocks: ["control_forever", "control_if", "sensing_keypressed", "motion_changexby", "motion_changeyby", "motion_gotoxy"],
  starter: game(labirinto()),
  checks: {
    maxSeconds: 12,
    inputs: COM_DESCIDA,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["control_if", "control_if_else"], label: "Use se… então dentro do sempre", goal: "Use **se… então** dentro do **sempre**" },
      {
        type: "visits", sprite: "Bloquinho", tolerance: 10,
        points: [
          { y: -150, goal: "Seta para **baixo**: desce **5** por vez" },
          { x: 192, goal: "Seta para a **direita**: anda **5** por vez" },
          { y: 0, goal: "Seta para **cima**: sobe **5** por vez" },
          { x: -192, goal: "Seta para a **esquerda**: anda **5** por vez" },
        ],
      },
      CHEGOU,
    ],
  },
  guide: {
    objetivo: "Montar o controle nas 4 direções com sensores de tecla dentro do sempre.",
    minutos: 15,
    passos: ["Lembre o controle da raquete do Pong: aqui são 4 setas em vez de 2.", "Mostre que o vá para do começo faz o jogo recomeçar sempre do mesmo lugar."],
    errosComuns: ["Trocar x por y nas setas para cima e para baixo.", "Esquecer o sinal de menos na esquerda e para baixo."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: labirinto(bloquinho()),
  erros: [
    labirinto([flag(), forever(
    iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)),
    iff(keyPressed("up arrow"), changeX(5)), iff(keyPressed("down arrow"), changeX(-5)),
    )]), // x no lugar de y
  ],
};
