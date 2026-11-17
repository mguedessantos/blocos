import { SENSORES } from "../../blocos/intermediario";
import { flag, forever, game, move, pointTowards } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "siga-o-mouse",
  title: "Siga o mouse",
  type: "EXERCICIO",
  content: `## Missão: o Bloquinho e o mouse

**sempre** → **aponte para [ponteiro do mouse]** → **mova 3 passos**.

Execute e passeie com o mouse pelo palco!

> Na verificação, o mouse fica parado no centro: o Bloquinho precisa ir até lá.`,
  allowedBlocks: SENSORES,
  starter: game({ sprites: [{ name: "Bloquinho", x: 150, y: 100 }] }),
  checks: {
    maxSeconds: 3,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "Dentro do “sempre”, aponte para o mouse" },
      { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "Dentro do “sempre”, mova o Bloquinho" },
      { type: "finalPosition", x: 0, y: 0, tolerance: 12, message: "O Bloquinho precisa chegar até o mouse (no centro do palco, na verificação)." },
    ],
  },
  guide: {
    objetivo: "Usar o mouse como controle.",
    minutos: 10,
    passos: ["Compare “aponte + mova” (persegue) com “vá para o ponteiro do mouse” (teletransporta)."],
    errosComuns: ["Bloquinho tremendo em cima do mouse: só ande se a distância até o mouse for > 10."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", x: 150, y: 100, code: [[flag(), forever(pointTowards("_mouse_"), move(3))]] }] },
};
