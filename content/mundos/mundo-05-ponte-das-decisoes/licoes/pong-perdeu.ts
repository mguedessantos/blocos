import { backdrop, game, gt, iff, lt, n, r, stopAll, ypos } from "../../../../src/lib/blocks/build";
import { PERDEU, pong, RAQUETE, SE, SEMPRE_SE } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pong-perdeu",
  title: "Pong 2: quando a bola passa",
  type: "EXERCICIO",
  content: `## Missão: o jogo precisa terminar

A bola já cai e quica nas bordas, mas ela **atravessa a raquete** e cai sem fim. Ainda não existe "perder"!

Na **Bola**, dentro do **sempre**, coloque:

**se (posição y < -165) então**

- **mude o cenário para Tela de fim**
- **pare todos**

A **posição y** diz a altura da bola: lá embaixo do palco, abaixo da raquete, ela fica menor que -165.`,
  allowedBlocks: ["operator_lt", "motion_yposition", "looks_switchbackdropto", "control_stop"],
  starter: game(pong(RAQUETE)),
  checks: {
    maxSeconds: 5,
    checks: [
      { type: "inside", parent: SEMPRE_SE, child: SE, label: "Use se… então dentro do sempre da Bola", goal: "Use **se… então** dentro do **sempre** da Bola" },
      { type: "visits", sprite: "Bola", tolerance: 10, points: [{ y: -155, goal: "O jogo continua até a bola cair lá embaixo" }] },
      { type: "backdropIs", backdrop: "fim", message: "Quando a bola passar da raquete (y menor que -165), mude o cenário para a Tela de fim.", goal: "Quando a bola passar da raquete, mostre a **Tela de fim**" },
      { type: "stopped", message: "Depois da Tela de fim, use pare todos para o jogo acabar.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Usar uma comparação (<) com a posição do ator como condição de fim de jogo.",
    minutos: 15,
    passos: ["Mostre a régua do y no palco: embaixo os números são negativos.", "Pergunte: por que -165 e não -180? (a bola quica na borda antes de chegar em -180)."],
    errosComuns: ["Usar > em vez de <.", "Usar = -165: a bola anda de 6 em 6 e pode nunca valer exatamente -165."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pong(RAQUETE, [PERDEU]),
  erros: [
    pong(RAQUETE, [iff(gt(r(ypos()), n(-165)), backdrop("fim"), stopAll())]), // > em vez de <
    pong(RAQUETE, [iff(lt(r(ypos()), n(-165)), backdrop("fim"))]), // sem pare todos
  ],
};
