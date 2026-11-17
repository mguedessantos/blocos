import type { BlocklyBlock } from "../../../src/lib/blocks/program";
import { b, backdrop, broadcast, changeVar, flag, forever, type GameSpec, getVar, gt, n, nextCostume, r, setVar, sound, stopAll, touching, wait, waitUntil } from "../../../src/lib/blocks/build";

// Mundo 2: o jogo da bola quicando. As estrelas já contam as batidas; o aluno programa a bola com repita e sempre.
export const BOLA = ["motion_movesteps", "control_repeat", "control_forever", "motion_ifonedgebounce", "control_wait"];
export const not = (cond: BlocklyBlock) => b("operator_not", { OPERAND: r(cond) });

/** Bola quicando: cada vez que a bola passa por uma estrela, soma 1 em batidas; `meta` batidas mostra o CONCLUÍDO. */
export function bolaQuicando(estrelas: [number, number][], meta: number, bola: BlocklyBlock[] = [], inicioX = 0): GameSpec {
  return {
    backdrops: ["castelo", "concluido"],
    variables: ["batidas"],
    stage: [[
      flag(), backdrop("castelo"), setVar("batidas", n(0)),
      waitUntil(gt(r(getVar("batidas")), n(meta - 1))), backdrop("concluido"), broadcast("concluido"), wait(1), stopAll(), // espera o último som
    ]],
    sprites: [
      // a bola sempre começa no mesmo lugar, indo para a direita
      { name: "Bola", character: "bola", x: inicioX, code: [[flag(), ...bola]] },
      ...estrelas.map(([x, y], i) => ({
        name: `Estrela ${i + 1}`, character: "estrela" as const, x, y,
        code: [[flag(), wait(0.2), forever(waitUntil(touching("Bola")), changeVar("batidas", n(1)), nextCostume(), sound("pop"), waitUntil(not(touching("Bola"))))]],
      })),
    ],
  };
}
