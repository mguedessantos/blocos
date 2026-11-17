// Mundo 8: Pega-frutas. As frutas caem em lugares sorteados; o Bloquinho pega com as setas.
// O placar começa sozinho (pontos 0, vidas 3) e 5 pontos mostram o CONCLUÍDO. O aluno programa os pontos, as vidas e o fim de jogo.
import {
  b, backdrop, changeVar, changeX, changeY, eq, flag, forever, getVar, gotoXY, gt, iff, keyPressed, lt, n, nextCostume, r, random, setVar,
  stopAll, touching, wait, waitUntil, ypos, type GameSpec,
} from "../../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../../src/lib/blocks/program";

/** Controle do Bloquinho (8 passos por quadro). Vem pronto nas lições 1 a 3; no desafio o aluno monta. */
export const SETAS = [flag(), forever(iff(keyPressed("right arrow"), changeX(8)), iff(keyPressed("left arrow"), changeX(-8)))];

/** Peças que o aluno programa na Fruta (soluções de referência e projetos iniciais das lições seguintes). */
export const PONTO = changeVar("pontos", n(1));
export const VIDA = changeVar("vidas", n(-1));
export const FIM = iff(eq(r(getVar("vidas")), n(0)), backdrop("fim"), stopAll());

/** A fruta volta para o alto num lugar sorteado, com outro desenho. */
const novaFruta = () => [b("motion_gotoxy", { X: r(random(-200, 200)), Y: n(170) }), nextCostume()];

/** Fruta caindo. `pegou` vai dentro do "se tocando em Bloquinho"; `caiu` dentro do "se chegou no chão". A 1ª fruta cai no meio. */
export const fruta = (pegou: BlocklyBlock[], caiu: BlocklyBlock[]) => [
  flag(), gotoXY(0, 170),
  forever(changeY(-5), iff(touching("Bloquinho"), ...pegou, ...novaFruta()), iff(lt(r(ypos()), n(-170)), ...caiu, ...novaFruta())),
];

/** Pega-frutas: `bloquinho` e `frutaCode` são os scripts dos dois atores. */
export function pegaFrutas(bloquinho: BlocklyBlock[], frutaCode: BlocklyBlock[]): GameSpec {
  return {
    backdrops: ["floresta", "concluido", "fim"],
    variables: ["pontos", "vidas"],
    stage: [
      [flag(), backdrop("floresta"), setVar("pontos", n(0)), setVar("vidas", n(3))],
      [flag(), wait(0.1), waitUntil(gt(r(getVar("pontos")), n(4))), backdrop("concluido"), stopAll()],
    ],
    sprites: [
      { name: "Bloquinho", y: -140, size: 70, code: [bloquinho] },
      { name: "Fruta", character: "fruta", y: 170, code: [frutaCode] },
    ],
  };
}
