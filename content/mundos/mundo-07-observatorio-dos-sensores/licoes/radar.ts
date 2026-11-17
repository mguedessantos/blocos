import { SENSORES } from "../../blocos/intermediario";
import { distanceTo, flag, forever, game, ifElse, lt, n, r, say, t } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "radar",
  title: "Radar do Glitch",
  type: "EXERCICIO",
  content: `## Missão: o Glitch percebe você

No **Glitch**: **sempre** → **se distância até [Bloquinho] < 120 então** → **diga “Te vi!”**, **senão** → **diga ""** (nada).

Teste: antes de executar, arraste o Bloquinho para **perto** e depois para **longe** do Glitch.`,
  allowedBlocks: SENSORES,
  starter: game({ sprites: [{ name: "Bloquinho", x: -50 }, { name: "Glitch", character: "glitch", x: 50 }] }),
  checks: {
    maxSeconds: 1,
    checks: [
      { type: "usesBlock", opcode: "sensing_distanceto" },
      { type: "usesAnyBlock", opcodes: ["operator_lt", "operator_gt"], label: "Compare a distância com um número (< ou >)" },
      { type: "said", text: "Te vi" },
    ],
  },
  guide: {
    objetivo: "Usar distância + comparação para criar inimigos que “enxergam”.",
    minutos: 15,
    passos: ["Teste com o Bloquinho perto e longe (arrastando antes de executar)."],
    errosComuns: ["Usar = 120: a distância quase nunca é exatamente igual."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [
  { name: "Bloquinho", x: -50 },
  { name: "Glitch", character: "glitch", x: 50, code: [[flag(), forever(ifElse(lt(r(distanceTo("Bloquinho")), n(120)), [say(t("Te vi!"))], [say(t(""))]))]] },
  ] },
};
