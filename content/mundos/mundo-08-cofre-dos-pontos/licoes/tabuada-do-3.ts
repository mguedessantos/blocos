import { BASE, MATH, VARS } from "../../blocos/variaveis";
import { b, changeVar, flag, getVar, n, r, repeat, setVar } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "tabuada-do-3",
  title: "Tabuada do 3",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: a tabuada do 3

Faça o Bloquinho falar a tabuada do 3, um número de cada vez: **3, 6, 9, ... até 30**.

> Dica: use uma variável que começa em 0 e vai ganhando 3 a cada repetição. Use o **diga ▢ por ▢ segundos** para dar tempo de ler!`,
  allowedBlocks: [...BASE, ...VARS, ...MATH, "control_repeat", "control_wait"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat" },
      { type: "said", text: "27" },
      { type: "said", text: "30" },
      { type: "variableEquals", name: "pontos", value: 30 },
    ],
  },
  guide: {
    objetivo: "Combinar variável, laço e operação.",
    minutos: 15,
    passos: ["Deixe a turma tentar a tabuada do 7 depois."],
    errosComuns: ["Somar 3 depois de falar: a sequência começa em 0."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(10, changeVar("pontos", n(3)), b("looks_sayforsecs", { MESSAGE: r(getVar("pontos")), SECS: n(0.5) }))]] }] },
};
