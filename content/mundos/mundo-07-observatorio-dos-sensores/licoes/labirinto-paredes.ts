import { game, gotoXY, iff, touching } from "../../../../src/lib/blocks/build";
import { bloquinho, CHEGOU, COM_BATIDA, labirinto, PAREDE } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "labirinto-paredes",
  title: "Labirinto 2: não atravesse as paredes",
  type: "EXERCICIO",
  content: `## Missão: parede é parede

Até agora o Bloquinho atravessa as paredes. Num labirinto de verdade, encostar na parede tem **castigo**: volta para o começo!

No **sempre** do Bloquinho, coloque mais um:

**se (tocando em Muro?) então**

- **vá para x: -192 y: -120**

O sensor **tocando em** é o "olho" do Bloquinho: ele sente quando encosta em outro ator. Depois, chegue na **bandeira de saída** sem encostar nas paredes.`,
  allowedBlocks: ["sensing_touchingobject"],
  starter: game(labirinto(bloquinho())),
  checks: {
    maxSeconds: 12,
    inputs: COM_BATIDA,
    checks: [
      { type: "usesBlock", opcode: "sensing_touchingobject", min: 1, message: "Use se tocando em Muro, então vá para o começo.", goal: "Use **tocando em Muro?**" },
      {
        ...CHEGOU,
        message: "O Bloquinho encosta no muro logo no começo e precisa voltar para x: -192, y: -120 (sem atravessar). Depois, leve-o até a bandeira.",
        goal: "Encostou no **Muro**: volta para o começo; depois chegue na **bandeira**",
      },
    ],
  },
  guide: {
    objetivo: "Usar o sensor tocando em como regra do jogo.",
    minutos: 10,
    passos: ["Pergunte: que outro castigo poderia ter? (perder uma vida, voltar um passo)."],
    errosComuns: ["Escolher a Saída no menu do sensor em vez do Muro.", "Colocar o se tocando fora do sempre: só confere uma vez, no começo."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: labirinto(bloquinho(PAREDE)),
  erros: [
    labirinto(bloquinho(iff(touching("Saída"), gotoXY(-192, -120)))), // sensor errado
    labirinto(bloquinho()), // sem a regra da parede
  ],
};
