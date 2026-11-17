import { backdrop, changeX, changeY, createClone, flag, forever, type GameSpec, gotoXY, hide, iff, keyPressed, repeat, show, stopAll, touching, wait, waitUntil } from "../../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../../src/lib/blocks/program";

// Mundo 7: o labirinto. As paredes (clones do Muro) e a saída já estão no palco; o aluno programa o Bloquinho.
// Caminho: começo embaixo à esquerda → direita → sobe pela abertura da direita → esquerda → sobe pela da esquerda → saída.
export const INICIO = { x: -192, y: -120 };

/** Peças que o aluno programa no Bloquinho (soluções de referência e projetos iniciais das lições seguintes). */
export const SETAS = [
  iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)),
  iff(keyPressed("up arrow"), changeY(5)), iff(keyPressed("down arrow"), changeY(-5)),
];

export const PAREDE = iff(touching("Muro"), gotoXY(INICIO.x, INICIO.y));
export const SAIDA = iff(touching("Saída"), backdrop("concluido"), stopAll());
export const bloquinho = (...extra: BlocklyBlock[]) => [flag(), gotoXY(INICIO.x, INICIO.y), forever(...SETAS, ...extra)];

/**
 * Labirinto: `heroi` é o script do Bloquinho (o ator principal, em tamanho 50 para caber nos corredores).
 * Com `saidaPronta`, a bandeira já mostra o CONCLUÍDO quando o Bloquinho chega; sem ela, o aluno programa a vitória.
 */
export function labirinto(heroi: BlocklyBlock[] = [flag()], saidaPronta = true): GameSpec {
  return {
    backdrops: ["ceu", "concluido"],
    stage: [[flag(), backdrop("ceu")]],
    sprites: [
      { name: "Bloquinho", x: INICIO.x, y: INICIO.y, size: 50, code: [heroi] },
      {
        // 8 pedaços de muro em duas fileiras, cada uma com uma abertura (uma à direita, outra à esquerda)
        name: "Muro", character: "muro", x: -192, y: -60,
        code: [[flag(), show(), gotoXY(-192, -60), repeat(4, createClone(), changeX(96)), gotoXY(-96, 60), repeat(4, createClone(), changeX(96)), hide()]],
      },
      {
        name: "Saída", character: "bandeira", x: 192, y: 120,
        code: saidaPronta ? [[flag(), wait(0.2), waitUntil(touching("Bloquinho")), backdrop("concluido"), stopAll()]] : [],
      },
    ],
  };
}

// Caminho completo até a saída, com as setas seguradas (5 passos por quadro).
export const CAMINHO = [
  { key: "right arrow", from: 0.1, to: 2.65 }, { key: "up arrow", from: 2.7, to: 3.5 }, { key: "left arrow", from: 3.55, to: 6.12 },
  { key: "up arrow", from: 6.15, to: 6.95 }, { key: "right arrow", from: 7.0, to: 9.8 },
];

export const depois = (s: number) => CAMINHO.map((i) => ({ ...i, from: i.from + s, to: i.to + s }));

/** Antes do caminho, uma descida e uma subida (testa a seta para baixo). */
export const COM_DESCIDA = [{ key: "down arrow", from: 0.1, to: 0.3 }, { key: "up arrow", from: 0.35, to: 0.55 }, ...depois(0.6)];

/** Antes do caminho, uma batida no muro (testa a volta para o começo). */
export const COM_BATIDA = [{ key: "up arrow", from: 0.1, to: 0.5 }, ...depois(0.5)];
export const CHEGOU = { type: "backdropIs" as const, backdrop: "concluido", message: "Na verificação, o site segura as setas pelo caminho do labirinto. Use 5 e -5 em todas as setas para o Bloquinho chegar na bandeira.", goal: "Leve o Bloquinho até a **bandeira de saída**" };
