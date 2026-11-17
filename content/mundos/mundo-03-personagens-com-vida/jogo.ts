import { b, backdrop, broadcast, c, flag, type GameSpec, gotoXY, gt, move, n, nextCostume, r, sayFor, stopAll, touching, wait, waitUntil, whenReceive, xpos } from "../../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../../src/lib/blocks/program";

// Mundo 3: a corrida animada. A pista, a chegada e o Glitch já estão programados; o aluno anima e faz o Bloquinho correr.
export const CORRER = ["control_repeat", "motion_movesteps", "looks_nextcostume", "control_wait", "sound_play", "sound_playuntildone", "looks_sayforsecs"];

export const pointDir = (d: number) => b("motion_pointindirection", { DIRECTION: n(d) });

export const repeatUntil = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_repeat_until", { CONDITION: r(cond) }, body);

/** Corrida: quem chegar primeiro na bandeira vence. Com `rival`, o Glitch corre também (6 passos a cada 0,1 s). */
export function corrida(bloquinho: BlocklyBlock[] = [], rival = false): GameSpec {
  return {
    backdrops: ["cidade", "concluido", "fim"],
    stage: [
      [flag(), backdrop("cidade")],
      [whenReceive("bloquinho venceu"), backdrop("concluido"), wait(1), stopAll()], // espera o último som
      [whenReceive("glitch venceu"), backdrop("fim"), wait(1), stopAll()],
    ],
    sprites: [
      { name: "Bloquinho", x: -200, y: -60, code: [[flag(), ...bloquinho]] },
      {
        name: "Glitch", character: "glitch", x: -200, y: 60,
        code: [[flag(), gotoXY(-200, 60), pointDir(90), ...(rival
          ? [wait(0.5), repeatUntil(gt(r(xpos()), n(160)), move(6), nextCostume(), wait(0.1)), sayFor("Venci!", 1), broadcast("glitch venceu")]
          : [])]],
      },
      // a chegada fica na pista do Bloquinho
      { name: "Chegada", character: "bandeira", x: 200, y: -60, code: [[flag(), wait(0.2), waitUntil(touching("Bloquinho")), broadcast("bloquinho venceu")]] },
    ],
  };
}
