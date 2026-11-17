import { BASE } from "../../blocos/repeticao";
import { one } from "../../teste";
import { move, repeat } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "dez-passinhos",
  title: "Dez passinhos",
  type: "EXERCICIO",
  content: `## Missão: 10 passinhos de 10

Faça o Bloquinho dar **10 passinhos de 10 passos** cada um, usando o bloco **repita**.

No final ele vai estar em **x: 100**.`,
  allowedBlocks: BASE,
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat", goal: "Use o bloco **repita**" },
      { type: "finalPosition", x: 100, y: 0, goal: "Termine em **x: 100** (10 passinhos de 10)" },
      { type: "maxBlocks", max: 3, bonus: true, message: "Dá para fazer com só 2 blocos embaixo da bandeira.", goal: "Bônus: use só **2 blocos** embaixo da bandeira" },
    ],
  },
  guide: {
    objetivo: "Usar o bloco repita com um bloco dentro.",
    minutos: 10,
    passos: ["Compare 10 blocos “mover” com 1 repita: qual é mais fácil de mudar para 20 passinhos?"],
    errosComuns: ["Colocar o mover embaixo do repita, e não dentro."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(10, move(10))),
};
