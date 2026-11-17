import type { BlocklyBlock } from "../../../src/lib/blocks/program";
import { b, backdrop, changeVar, changeX, flag, forever, type GameSpec, getVar, gotoXY, gt, ifEdgeBounce, iff, keyPressed, lt, move, n, r, random, setVar, stopAll, touching, wait, waitUntil, ypos } from "../../../src/lib/blocks/build";

// Mundo 5: Pong de uma raquete só. A cada lição o aluno programa uma decisão do jogo (se… então).
export const pointDir = (d: BlocklyBlock | number) => b("motion_pointindirection", { DIRECTION: typeof d === "number" ? n(d) : r(d) });

/** Peças que o aluno programa (soluções de referência; também usadas nos projetos iniciais das lições seguintes). */
export const RAQUETE = [forever(iff(keyPressed("right arrow"), changeX(10)), iff(keyPressed("left arrow"), changeX(-10)))];

export const PERDEU = iff(lt(r(ypos()), n(-165)), backdrop("fim"), stopAll());
export const REBATE = iff(touching("Raquete"), pointDir(random(-45, 45)));

/**
 * Pong: a bola cai, a raquete rebate e cada bola que chega lá em cima vale 1 ponto. 5 pontos: CONCLUÍDO.
 * `raquete` vai embaixo da bandeira da Raquete; `bola` vai dentro do "sempre" da Bola. Sem `andando`, a bola fica parada.
 */
export function pong(raquete: BlocklyBlock[] = [], bola: BlocklyBlock[] = [], andando = true): GameSpec {
  return {
    backdrops: ["ceu", "concluido", "fim"],
    variables: ["pontos"],
    // sem a bola andando (Pong 1) não há fim de jogo: só o cenário
    stage: [andando ? [flag(), backdrop("ceu"), setVar("pontos", n(0)), waitUntil(gt(r(getVar("pontos")), n(4))), backdrop("concluido"), stopAll()] : [flag(), backdrop("ceu")]],
    sprites: [
      { name: "Raquete", character: "raquete", y: -130, code: [[flag(), ...raquete]] },
      {
        name: "Bola", character: "bola", y: 100,
        code: andando
          ? [
              [flag(), gotoXY(0, 100), pointDir(180), wait(1), forever(move(6), ifEdgeBounce(), ...bola)],
              // ponto quando a bola rebatida chega lá em cima (só conta de novo depois de descer)
              [flag(), wait(1), forever(waitUntil(gt(r(ypos()), n(150))), changeVar("pontos", n(1)), waitUntil(lt(r(ypos()), n(0))))],
            ]
          : [[flag(), gotoXY(0, 100)]],
      },
    ],
  };
}

export const SEMPRE_SE = ["control_forever"];
export const SE = ["control_if", "control_if_else"];
