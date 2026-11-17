import type { BlocklyBlock } from "../../../src/lib/blocks/program";
import { backdrop, broadcast, c, changeVar, changeY, createClone, deleteClone, flag, forever, type GameSpec, getVar, goTo, gt, hide, ifEdgeBounce, iff, lt, move, n, r, rotationLR, setVar, show, stopAll, touching, wait, waitUntil, whenClone, whenReceive, ypos } from "../../../src/lib/blocks/build";

// Mundo 4 (fim do nível básico): um jogo pronto em que só falta programar o herói.
export const ATAQUE = ["event_whenkeypressed", "motion_changexby"];
export const repeatUntil = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_repeat_until", { CONDITION: r(cond) }, body);

/** O jogo do ataque: o Glitch anda de um lado para o outro e atira raios. Só falta programar o Bloquinho. */
export function ataqueDoGlitch(heroi: BlocklyBlock[][] = [], atirando = true): GameSpec {
  return {
    backdrops: ["espaco", "concluido"],
    variables: ["desvios"],
    // 10 raios desviados: tela de CONCLUÍDO e o jogo para
    stage: [[flag(), backdrop("espaco"), setVar("desvios", n(0)), waitUntil(gt(r(getVar("desvios")), n(9))), backdrop("concluido"), broadcast("concluido")]],
    sprites: [
      { name: "Bloquinho", y: -140, code: heroi },
      {
        name: "Glitch", character: "glitch", y: 130,
        code: atirando
          ? [[flag(), show(), rotationLR(), forever(move(4), ifEdgeBounce())], [flag(), forever(wait(1), createClone("Raio"))], [whenReceive("concluido"), hide(), stopAll()]]
          : [],
      },
      {
        name: "Raio", character: "raio", y: 130, visible: false,
        code: [[whenClone(), goTo("Glitch"), show(), repeatUntil(lt(r(ypos()), n(-160)), changeY(-7), iff(touching("Bloquinho"), deleteClone())), changeVar("desvios", n(1)), deleteClone()]],
      },
    ],
  };
}

export const treino = { maxSeconds: 2 };
