import { BASE, VARS } from "../../blocos/variaveis";
import { changeVar, flag, n, repeat, setVar } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "placar",
  title: "Placar",
  type: "EXERCICIO",
  content: `## Missão: marque 30 pontos

1. Comece com **mude pontos para 0**.
2. Some **10** aos pontos **3 vezes**.

No final, a variável **pontos** precisa valer **30**.`,
  allowedBlocks: [...BASE, ...VARS, "control_repeat"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "data_changevariableby" },
      { type: "variableEquals", name: "pontos", value: 30 },
      { type: "usesBlock", opcode: "control_repeat", bonus: true, message: "Use o repita para não repetir o mesmo bloco 3 vezes." },
    ],
  },
  guide: {
    objetivo: "Inicializar e alterar uma variável.",
    minutos: 10,
    passos: ["Pergunte: o que acontece se não começarmos com “mude pontos para 0”?"],
    errosComuns: ["Esquecer a inicialização."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(3, changeVar("pontos", n(10)))]] }] },
};
