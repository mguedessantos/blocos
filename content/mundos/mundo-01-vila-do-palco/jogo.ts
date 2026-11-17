import type { BlocklyBlock } from "../../../src/lib/blocks/program";
import { backdrop, broadcast, changeVar, flag, game, type GameSpec, getVar, gt, hide, n, r, setVar, show, sound, stopAll, touching, wait, waitUntil } from "../../../src/lib/blocks/build";

// Mundo 1: o jogo da caça ao tesouro. As moedas já estão programadas; o aluno leva o Bloquinho até elas.
export const ANDAR = ["motion_movesteps", "motion_turnright", "motion_turnleft", "motion_gotoxy", "control_wait"];

/** Caça ao tesouro: pegar todas as moedas mostra a tela de CONCLUÍDO. `heroi` é o que vem depois da bandeira do Bloquinho. */
export function cacaAoTesouro(moedas: [number, number][], heroi: BlocklyBlock[] = []): GameSpec {
  return {
    backdrops: ["grade", "concluido"],
    variables: ["tesouros"],
    stage: [[
      flag(), backdrop("grade"), setVar("tesouros", n(0)),
      waitUntil(gt(r(getVar("tesouros")), n(moedas.length - 1))), backdrop("concluido"), broadcast("concluido"), wait(1), stopAll(), // espera o último som tocar
    ]],
    sprites: [
      // o Bloquinho sempre começa no centro, olhando para a direita
      { name: "Bloquinho", code: [[flag(), ...heroi]] },
      ...moedas.map(([x, y], i) => ({
        name: `Moeda ${i + 1}`, character: "moeda" as const, x, y,
        code: [[flag(), show(), wait(0.2), waitUntil(touching("Bloquinho")), hide(), sound("moeda"), changeVar("tesouros", n(1))]],
      })),
    ],
  };
}

export const caca = (moedas: [number, number][]) => ({
  allowedBlocks: ANDAR,
  starter: game(cacaAoTesouro(moedas)),
});
