import { BASE, MATH } from "../../blocos/variaveis";
import { one } from "../../teste";
import { b, n, r, say, t } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "calculadora",
  title: "Calculadora",
  type: "EXERCICIO",
  content: `## Missão: o Bloquinho sabe a tabuada

Os blocos verdes de **Operadores** fazem contas. Encaixe **7 × 8** dentro do bloco **diga** e veja o Bloquinho responder!`,
  allowedBlocks: [...BASE, ...MATH],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "operator_multiply" },
      { type: "said", text: "56" },
    ],
  },
  guide: {
    objetivo: "Usar operadores matemáticos.",
    minutos: 5,
    passos: ["Peça para a turma calcular de cabeça antes de rodar."],
    errosComuns: ["Digitar o resultado em vez de usar o operador."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(say(r(b("operator_multiply", { NUM1: n(7), NUM2: n(8) })))),
  erros: [
    one(say(t("56"))),
  ],
};
