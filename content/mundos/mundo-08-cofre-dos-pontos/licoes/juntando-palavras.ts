import { BASE } from "../../blocos/variaveis";
import { one } from "../../teste";
import { join, r, say, t } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "juntando-palavras",
  title: "Juntando palavras",
  type: "EXERCICIO",
  content: `## Missão: monte uma frase

O bloco **junte ▢ com ▢** gruda dois textos. Faça o Bloquinho dizer **Olá, mundo!** usando o **junte** com **Olá, ** e **mundo!**.

> Repare no espaço depois da vírgula!`,
  allowedBlocks: [...BASE, "operator_join"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "operator_join" },
      { type: "said", text: "Olá, mundo" },
    ],
  },
  guide: {
    objetivo: "Juntar textos (concatenação).",
    minutos: 5,
    passos: ["Mostre o que acontece sem o espaço: “Olá,mundo!”."],
    errosComuns: ["Esquecer o espaço."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(say(r(join(t("Olá, "), t("mundo!"))))),
};
