import {
  b, backdrop, broadcast, changeVar, flag, forever, game, getVar, gotoXY, gt, n, nextCostume, r, setVar, sound, stopAll, touching, wait, waitUntil,
  type GameSpec,
} from "../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../src/lib/blocks/program";
import type { TrackContent } from "./types";

// Mundo 2: o jogo da bola quicando. As estrelas já contam as batidas; o aluno programa a bola com repita e sempre.
const BOLA = ["motion_movesteps", "control_repeat", "control_forever", "motion_ifonedgebounce", "control_wait"];
const pointDir = (d: number) => b("motion_pointindirection", { DIRECTION: n(d) });
const not = (cond: BlocklyBlock) => b("operator_not", { OPERAND: r(cond) });

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
      { name: "Bola", character: "bola", x: inicioX, code: [[flag(), gotoXY(inicioX, 0), pointDir(90), ...bola]] },
      ...estrelas.map(([x, y], i) => ({
        name: `Estrela ${i + 1}`, character: "estrela" as const, x, y,
        code: [[flag(), wait(0.2), forever(waitUntil(touching("Bola")), changeVar("batidas", n(1)), nextCostume(), sound("pop"), waitUntil(not(touching("Bola"))))]],
      })),
    ],
  };
}

export const modulo: TrackContent["modules"][number] = {
  title: "Jogo: bola quicando",
  lessons: [
    {
      slug: "bola-repita",
      title: "Bola 1: repita para chegar",
      type: "EXERCICIO",
      content: `## Jogo: a bola mágica da torre

Na Torre das Repetições há uma **bola mágica**. Cada vez que ela passa por uma **estrela**, soma 1 em **batidas**.

As estrelas já estão programadas. Você programa a **Bola**: use **repita** com **mova 10 passos** dentro, para a bola rolar até a estrela.

> Dica: a bola começa em **x: -200** e a estrela está em **x: 100**. Quantas vezes 10 passos?`,
      allowedBlocks: BOLA,
      starter: game(bolaQuicando([[100, 0]], 99, [], -200)),
      checks: {
        maxSeconds: 6,
        checks: [
          { type: "usesBlock", opcode: "control_repeat", message: "Use o bloco repita para a bola rolar aos poucos.", goal: "Use **repita** com **mova 10 passos** dentro" },
          { type: "variableAtLeast", name: "batidas", min: 1, message: "A bola precisa passar pela estrela (x: 100).", goal: "A bola passa pela **estrela**" },
        ],
      },
      guide: {
        objetivo: "Usar repita para animar um movimento em um jogo.",
        minutos: 10,
        passos: ["Compare: mova 300 passos (pula) e repita 30 vezes mova 10 (rola). Qual parece um jogo?"],
        errosComuns: ["Repetir poucas vezes e a bola parar antes da estrela.", "Colocar o mova embaixo do repita, e não dentro."],
      },
    },
    {
      slug: "bola-para-sempre",
      title: "Bola 2: rolando para sempre",
      type: "EXERCICIO",
      content: `## Para sempre

Contar quantas vezes repetir dá trabalho. Em jogos, usamos o **sempre**: o que está dentro dele não para nunca.

Troque o repita por **sempre**, com **mova 10 passos** dentro. A bola rola até a borda do palco.`,
      allowedBlocks: BOLA,
      starter: game(bolaQuicando([[100, 0]], 99, [], -200)),
      checks: {
        maxSeconds: 4,
        checks: [
          { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "Coloque o mova dentro do sempre", goal: "Use **sempre** com **mova 10 passos** dentro" },
          { type: "variableAtLeast", name: "batidas", min: 1, message: "A bola precisa passar pela estrela.", goal: "A bola passa pela **estrela**" },
          { type: "finalPosition", sprite: "Bola", x: 240, y: 0, tolerance: 30, message: "A bola precisa rolar até a borda da direita.", goal: "A bola chega na **borda** do palco" },
        ],
      },
      guide: {
        objetivo: "Usar o laço infinito, base de todo jogo.",
        minutos: 10,
        passos: ["Explique que jogos rodam dentro de um sempre: o jogo nunca para sozinho.", "Pergunte: e quando a bola chega na borda?"],
        errosComuns: ["Colocar o sempre embaixo do mova, e não em volta dele."],
      },
    },
    {
      slug: "bola-quicando-desafio",
      title: "Desafio: bola quicando",
      type: "DESAFIO",
      xp: 30,
      content: `# Desafio: faça a bola quicar!

Agora há **duas estrelas**. A bola precisa ir e voltar **sem parar**, passando por elas até somar **10 batidas**.

Dentro do **sempre**, além de **mova 10 passos**, use **se tocar na borda, volte**. Ao chegar em 10 batidas, aparece a tela de **CONCLUÍDO**.`,
      allowedBlocks: BOLA,
      starter: game(bolaQuicando([[-150, 0], [150, 0]], 10)),
      checks: {
        maxSeconds: 20,
        checks: [
          { type: "inside", parent: ["control_forever"], child: ["motion_ifonedgebounce"], label: "Use se tocar na borda, volte dentro do sempre", goal: "Use **se tocar na borda, volte** dentro do **sempre**" },
          { type: "variableAtLeast", name: "batidas", min: 10, message: "A bola precisa ir e voltar até somar 10 batidas.", goal: "Some **10 batidas**" },
          { type: "backdropIs", backdrop: "concluido", message: "O jogo termina na tela de CONCLUÍDO.", goal: "Veja a tela de **CONCLUÍDO**" },
        ],
      },
      guide: {
        objetivo: "Combinar sempre e quicar na borda para criar o movimento de um jogo.",
        minutos: 15,
        passos: ["Pergunte: quantas batidas a bola faz em cada ida e volta?", "Desafie a turma a deixar a bola mais rápida."],
        errosComuns: ["Colocar o quicar fora do sempre: ele só funciona uma vez."],
      },
    },
  ],
};
