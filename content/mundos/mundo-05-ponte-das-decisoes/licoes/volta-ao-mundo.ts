import { COMPARE, MOVE, POS } from "../../blocos/condicionais";
import { one } from "../../teste";
import { b, changeX, gt, iff, n, r, repeat, xpos } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "volta-ao-mundo",
  title: "Volta ao mundo",
  type: "EXERCICIO",
  xp: 15,
  content: `## Missão: saiu de um lado, entra pelo outro

Repita **20 vezes**: adicione **15** ao x. **Se** a **posição x > 150**, mude o x para **-150** — como num videogame em que o personagem sai por um lado da tela e aparece do outro!`,
  allowedBlocks: [...MOVE, ...POS, ...COMPARE, "control_repeat", "control_if"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_if" },
      { type: "usesBlock", opcode: "operator_gt" },
      { type: "finalPosition", x: -15, y: 0, message: "Confira as regras: +15 no x a cada vez e, passando de 150, volta para -150." },
    ],
  },
  guide: {
    objetivo: "Usar condição para “dar a volta” no palco, como em jogos clássicos.",
    minutos: 15,
    passos: ["Relacione com jogos em que o personagem sai por um lado da tela e entra pelo outro."],
    errosComuns: ["Usar = 150 em vez de > 150: com passos de 15, o x pode nunca ser exatamente igual."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(20, changeX(15), iff(gt(r(xpos()), n(150)), b("motion_setx", { X: n(-150) })))),
};
