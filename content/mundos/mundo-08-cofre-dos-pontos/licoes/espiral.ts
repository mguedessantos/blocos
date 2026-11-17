import { BASE, VARS } from "../../blocos/variaveis";
import { b, changeVar, flag, getVar, n, r, repeat, right, setVar, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "espiral",
  title: "Espiral",
  type: "EXERCICIO",
  xp: 15,
  content: `## Missão: passos que crescem

Variáveis podem controlar o movimento! Faça o Bloquinho andar em **espiral**:

- Comece com **pontos = 10**.
- Repita **5 vezes**: **mova pontos passos**, gire **↻ 90 graus**, **adicione 10 a pontos** e **espere** um pouco.

Cada caminhada fica 10 passos maior que a anterior.`,
  allowedBlocks: [...BASE, ...VARS, "control_repeat", "control_wait"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "data_variable", message: "Encaixe o bloco “pontos” dentro do “mova”.", goal: "Use a variável **pontos** dentro do **mova**" },
      { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Coloque um bloco “espere” dentro do repita", goal: "Coloque um **espere** dentro do **repita**, para ver o Bloquinho andando" },
      {
        type: "visits",
        points: [
          { x: 10, y: 0, goal: "1ª caminhada: **10 passos** para a direita" },
          { x: 10, y: -20, goal: "2ª caminhada: **20 passos** para baixo" },
          { x: -20, y: -20, goal: "3ª caminhada: **30 passos** para a esquerda" },
          { x: -20, y: 20, goal: "4ª caminhada: **40 passos** para cima" },
          { x: 30, y: 20, goal: "5ª caminhada: **50 passos** para a direita" },
        ],
        tolerance: 3,
      },
      { type: "variableEquals", name: "pontos", value: 60, goal: "No fim, **pontos** vale **60**" },
    ],
  },
  guide: {
    objetivo: "Usar variável para controlar o movimento.",
    minutos: 15,
    passos: ["Antes de rodar, peça para a turma prever o caminho."],
    errosComuns: ["Mudar a variável antes de mover: a primeira caminhada fica com 20."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(10)), repeat(5, b("motion_movesteps", { STEPS: r(getVar("pontos")) }), right(90), changeVar("pontos", n(10)), wait(0.3))]] }] },
};
