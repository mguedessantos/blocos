import { MOVE } from "../../blocos/condicionais";
import { one } from "../../teste";
import { b, iff, move, repeat, right } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "bate-e-volta",
  title: "Bate e volta",
  type: "EXERCICIO",
  content: `## Missão: não bata a cabeça!

Faça o Bloquinho andar **10 passos, 30 vezes**. Mas atenção: **se** ele estiver **tocando na borda**, ele deve **girar 180 graus** para voltar.

No final, ele vai estar olhando para a **esquerda**.`,
  allowedBlocks: [...MOVE, "control_repeat", "control_if", "sensing_touchingobject"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_if" },
      { type: "usesBlock", opcode: "sensing_touchingobject" },
      { type: "finalDirection", direction: -90, message: "Quando tocar na borda, o Bloquinho precisa virar para a esquerda (girar 180)." },
    ],
  },
  guide: {
    objetivo: "Usar um sensor dentro de um se, dentro de um laço.",
    minutos: 15,
    passos: ["Mostre que o “se” é verificado a cada volta do repita."],
    errosComuns: ["Colocar o “se” fora do repita: ele só é testado uma vez."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(30, move(10), iff(b("sensing_touchingobject"), right(180)))),
  erros: [
    one(repeat(30, move(10))),
  ],
};
