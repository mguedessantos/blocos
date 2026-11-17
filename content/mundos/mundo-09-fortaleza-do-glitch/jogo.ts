// Mundo 9: Cobrinha. A Cabeça anda de 20 em 20; o corpo são clones do Gomo deixados para trás.
// Cada clone vive "tamanho × 0,15 s", então a cobrinha cresce quando come. Bater na borda ou no corpo: fim.
// A Cabeça só confere se bateu logo depois de andar: assim o gomo que nasce embaixo dela nunca conta como batida.
import {
  b, backdrop, c, changeVar, createClone, deleteClone, flag, forever, getVar, goTo, gotoXY, iff, move, n, r, setVar, show, stopAll,
  touching, wait, waitUntil, whenClone, whenKey, type GameSpec,
} from "../../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../../src/lib/blocks/program";

/** Tempo de cada passo da cobrinha (segundos). */
export const PASSO = 0.15;
export const aponte = (d: number) => b("motion_pointindirection", { DIRECTION: n(d) });
const vezes = (a: BlocklyBlock, z: number) => b("operator_multiply", { NUM1: r(a), NUM2: n(z) });

/** Peças que o aluno programa (soluções de referência e projetos iniciais das lições seguintes). */
export const SETAS: BlocklyBlock[][] = [
  [whenKey("up arrow"), aponte(0)], [whenKey("down arrow"), aponte(180)],
  [whenKey("right arrow"), aponte(90)], [whenKey("left arrow"), aponte(-90)],
];
/** Clone do corpo: aparece e some quando fica velho (vive tamanho × 0,15 s = "tamanho" passos). */
export const CORPO = [whenClone(), show(), b("control_wait", { DURATION: r(vezes(getVar("tamanho"), PASSO)) }), deleteClone()];
/** Corpo de tamanho fixo (Cobrinha 2): cada clone fica 1 segundo no palco. */
export const CORPO_FIXO = [whenClone(), show(), wait(1), deleteClone()];
/** Regras de bater (cada uma num se, entre o mova e o espere da Cabeça). */
export const BORDA = iff(touching("_edge_"), backdrop("fim"), stopAll());
export const NO_CORPO = iff(touching("Gomo"), backdrop("fim"), stopAll());
/** As duas regras juntas. */
export const BATEU = [BORDA, NO_CORPO];
const nao = (cond: BlocklyBlock) => b("operator_not", { OPERAND: r(cond) });
/** A fruta nunca aparece em cima do corpo: se o sorteio cair num gomo, sorteia de novo. */
export const NOVO_LUGAR = [goTo("_random_"), c("control_repeat_until", { CONDITION: r(nao(touching("Gomo"))) }, [goTo("_random_")])];
export const COME = [flag(), gotoXY(60, 0), forever(waitUntil(touching("Cabeça")), changeVar("pontos", n(1)), changeVar("tamanho", n(1)), ...NOVO_LUGAR)];

/** Uma volta fechada: cima, esquerda e baixo, um passo de cada (a cabeça entra no próprio corpo). */
export const VOLTA = [
  { key: "up arrow", from: 0.5, to: 0.53 }, { key: "left arrow", from: 0.68, to: 0.71 }, { key: "down arrow", from: 0.86, to: 0.89 },
];

/** Cabeça: anda sempre para a frente; `extra` vai logo depois do "mova" (a regra de bater). */
export const cabeca = (...extra: BlocklyBlock[]) => [flag(), gotoXY(0, 0), aponte(90), forever(move(20), ...extra, wait(PASSO))];

/**
 * Cobrinha: `cabecaCode` são os scripts da Cabeça; `corpo` o script do clone do Gomo; `fruta` o script da Fruta.
 * O Gomo original (escondido) já segue a cabeça e cria um clone a cada passo.
 */
export function cobrinha(cabecaCode: BlocklyBlock[][], corpo: BlocklyBlock[], fruta: BlocklyBlock[]): GameSpec {
  return {
    // sem tela de vitória: como na Cobrinha de verdade, joga-se até bater (e a graça é ver quantas frutas deu para comer)
    backdrops: ["espaco", "fim"],
    variables: ["pontos", "tamanho"],
    stage: [[flag(), backdrop("espaco"), setVar("pontos", n(0)), setVar("tamanho", n(4))]],
    sprites: [
      { name: "Cabeça", character: "cabeca", code: cabecaCode },
      { name: "Gomo", character: "gomo", visible: false, code: [[flag(), forever(goTo("Cabeça"), createClone(), wait(PASSO))], corpo] },
      { name: "Fruta", character: "fruta", x: 60, code: [fruta] },
    ],
  };
}
