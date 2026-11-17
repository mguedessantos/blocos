import { COMPARE, MOVE, POS } from "../../blocos/condicionais";
import { one } from "../../teste";
import { b, gt, ifElse, n, r, say, t, xpos } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "direita-ou-esquerda",
  title: "Direita ou esquerda?",
  type: "EXERCICIO",
  content: `## Missão: onde estou?

1. Mude o **x** do Bloquinho para **150**.
2. Use **se ▢ então ... senão**: **se** a **posição x > 0**, ele diz **Direita!**; **senão**, diz **Esquerda!**.

Teste também com x **-150** para ver o outro caminho funcionando!`,
  allowedBlocks: [...MOVE, ...POS, ...COMPARE, "control_if", "control_if_else", "looks_say", "looks_sayforsecs"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_if_else" },
      { type: "usesBlock", opcode: "motion_xposition" },
      { type: "said", text: "Direita" },
    ],
  },
  guide: {
    objetivo: "Usar se… senão e comparar números.",
    minutos: 10,
    passos: ["Teste com x = 150 e x = -150 para ver os dois caminhos."],
    errosComuns: ["Inverter > e <."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(b("motion_setx", { X: n(150) }), ifElse(gt(r(xpos()), n(0)), [say(t("Direita!"))], [say(t("Esquerda!"))])),
  erros: [
    one(say(t("Direita!"))),
  ],
};
