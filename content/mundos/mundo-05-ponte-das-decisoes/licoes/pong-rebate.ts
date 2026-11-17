import { b, game, iff, n, touching } from "../../../../src/lib/blocks/build";
import { PERDEU, pong, RAQUETE, REBATE } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pong-rebate",
  title: "Pong 3: rebata a bola",
  type: "EXERCICIO",
  content: `## Missão: a raquete rebate

Agora falta a parte mais importante: a bola **voltar para cima** quando tocar na raquete.

Na **Bola**, dentro do **sempre**, coloque:

**se (tocando em Raquete?) então**

- **aponte para a direção (sorteie um número entre -45 e 45)**

Direção **0** é para cima. Com o **sorteie**, a bola sobe cada vez num ângulo diferente, e o jogo nunca fica igual. Cada bola que chega lá em cima vale **1 ponto**.`,
  allowedBlocks: ["sensing_touchingobject", "motion_pointindirection", "operator_random"],
  starter: game(pong(RAQUETE, [PERDEU])),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "usesBlock", opcode: "operator_random", min: 1, message: "Use sorteie um número entre -45 e 45 na direção.", goal: "Use **sorteie** para a bola subir num ângulo diferente" },
      { type: "variableAtLeast", name: "pontos", min: 1, message: "A bola precisa voltar para cima ao tocar na raquete. Use se tocando em Raquete, então aponte para a direção (sorteie -45 a 45).", goal: "A bola rebate na raquete e sobe (**1 ponto**)" },
    ],
  },
  guide: {
    objetivo: "Usar o sensor de toque como condição e o sorteio para o jogo variar.",
    minutos: 15,
    passos: ["Teste primeiro com aponte para a direção 0 e mostre que o jogo fica repetitivo; depois troque por sorteie.", "Lembre a bússola do Scratch: 0 é para cima, 90 é para a direita, 180 é para baixo."],
    errosComuns: ["Usar direção 180: a bola continua descendo.", "Sortear entre 0 e 360: às vezes a bola volta para baixo e atravessa a raquete."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pong(RAQUETE, [PERDEU, REBATE]),
  erros: [
    pong(RAQUETE, [PERDEU, iff(touching("Raquete"), b("motion_pointindirection", { DIRECTION: n(180) }))]),
  ],
};
