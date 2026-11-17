import type { BlocklyBlock } from "../../../src/lib/blocks/program";
import { backdrop, c, changeVar, flag, forever, type GameSpec, getVar, goTo, gt, lt, n, r, setVar, stopAll, wait, waitUntil, whenClicked } from "../../../src/lib/blocks/build";

// Mundo 6: Clique no Glitch. O placar e o relógio já estão prontos; o aluno programa o Glitch.
export const repeatUntil = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_repeat_until", { CONDITION: r(cond) }, body);

/** Peças que o aluno programa (soluções de referência e projetos iniciais das lições seguintes). */
export const PONTO = [whenClicked(), changeVar("pontos", n(1))];
export const PULA = [...PONTO, goTo("_random_")];
export const SOZINHO = [flag(), forever(wait(1), goTo("_random_"))];

/**
 * Clique no Glitch: cada clique vale 1 ponto. 10 pontos antes do tempo (20 s) acabar: CONCLUÍDO; senão, Tela de fim.
 * `glitch` são os scripts do Glitch (o ator principal).
 */
export function cliqueNoGlitch(glitch: BlocklyBlock[][]): GameSpec {
  return {
    backdrops: ["cidade", "concluido", "fim"],
    variables: ["pontos", "tempo"],
    stage: [
      [flag(), backdrop("cidade"), setVar("pontos", n(0)), setVar("tempo", n(20)), repeatUntil(lt(r(getVar("tempo")), n(1)), wait(1), changeVar("tempo", n(-1))), backdrop("fim"), stopAll()],
      [flag(), wait(0.1), waitUntil(gt(r(getVar("pontos")), n(9))), backdrop("concluido"), stopAll()],
    ],
    sprites: [{ name: "Glitch", character: "glitch", code: glitch }],
  };
}

export const cliques = (n: number, every: number) => Array.from({ length: n }, (_, i) => ({ click: "Glitch", at: 0.5 + i * every }));
