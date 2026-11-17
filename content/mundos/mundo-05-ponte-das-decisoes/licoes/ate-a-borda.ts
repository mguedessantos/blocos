import { MOVE } from "../../blocos/condicionais";
import { one } from "../../teste";
import { b, c, move, r, say, t } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "ate-a-borda",
  title: "Até a borda",
  type: "EXERCICIO",
  content: `## Missão: ande até encostar

O bloco **repita até que ▢** repete os blocos **até** a condição ficar verdadeira.

Faça o Bloquinho andar **5 passos** **até que** esteja **tocando na borda**. Depois, ele diz **Cheguei!**`,
  allowedBlocks: [...MOVE, "control_repeat_until", "sensing_touchingobject", "looks_say"],
  startWithFlag: true,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat_until" },
      { type: "said", text: "Cheguei" },
      { type: "finalPosition", x: 195, y: 0, tolerance: 6, message: "O Bloquinho precisa parar quando encostar na borda da direita." },
    ],
  },
  guide: {
    objetivo: "Usar o laço repita até que.",
    minutos: 10,
    passos: ["Compare: “repita 10 vezes” (sabemos quantas) × “repita até” (não sabemos quantas)."],
    errosComuns: ["Colocar o “diga” dentro do laço."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(c("control_repeat_until", { CONDITION: r(b("sensing_touchingobject")) }, [move(5)]), say(t("Cheguei!"))),
};
