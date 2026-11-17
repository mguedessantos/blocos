import { COMPARE, MOVE, POS } from "../../blocos/condicionais";
import { one } from "../../teste";
import { b, gotoXY, gt, iff, n, r, say, t, xpos, ypos } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "e-ou-nao",
  title: "E, ou, não",
  type: "EXERCICIO",
  content: `## Missão: o canto de cima

Às vezes precisamos de **duas** condições ao mesmo tempo. O bloco **▢ e ▢** só é verdadeiro quando as duas forem verdadeiras.

1. Leve o Bloquinho para **x: 80, y: 60**.
2. **Se** a **posição x > 0** **e** a **posição y > 0**, ele diz **Canto de cima!**`,
  allowedBlocks: [...MOVE, ...POS, ...COMPARE, "operator_and", "operator_or", "operator_not", "control_if", "control_if_else", "looks_say"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "operator_and" },
      { type: "usesBlock", opcode: "control_if" },
      { type: "said", text: "Canto de cima" },
    ],
  },
  guide: {
    objetivo: "Combinar condições com e/ou/não.",
    minutos: 10,
    passos: ["Tabela no quadro: “está sol E é sábado?” / “está sol OU é sábado?”."],
    errosComuns: ["Usar “ou” quando precisa das duas condições."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(gotoXY(80, 60), iff(b("operator_and", { OPERAND1: r(gt(r(xpos()), n(0))), OPERAND2: r(gt(r(ypos()), n(0))) }), say(t("Canto de cima!")))),
};
