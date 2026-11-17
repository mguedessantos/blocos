import { BASE, VARS } from "../../blocos/variaveis";
import { changeVar, flag, getVar, move, n, r, repeat, say, setVar, t } from "../../../../src/lib/blocks/build";
import { one } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "contando-passos",
  title: "Contando passos",
  type: "EXERCICIO",
  content: `## Missão: um contador de passos

1. Comece com **pontos = 0**.
2. Repita **5 vezes**: ande **20 passos** e **adicione 1 a pontos**.
3. No final, o Bloquinho **diz** o valor de **pontos**.`,
  allowedBlocks: [...BASE, ...VARS, "control_repeat"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "variableEquals", name: "pontos", value: 5 },
      { type: "usesBlock", opcode: "data_variable", message: "Encaixe o bloco redondo “pontos” no “diga”." },
      { type: "said", text: "5" },
      { type: "finalPosition", x: 100, y: 0 },
    ],
  },
  guide: {
    objetivo: "Usar uma variável como contador dentro de um laço.",
    minutos: 10,
    passos: ["Mostre o bloco redondo “pontos” encaixado no “diga”."],
    errosComuns: ["Digitar a palavra “pontos” no diga, em vez de encaixar o bloco."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(5, move(20), changeVar("pontos", n(1))), say(r(getVar("pontos")))]] }] },
  erros: [
    one(repeat(5, move(20)), say(t("5"))),
  ],
};
