import {
  b, backdrop, broadcast, changeVar, flag, game, getVar, gotoXY, gt, hide, n, r, setVar, show, sound, stopAll, touching, wait, waitUntil, type GameSpec,
} from "../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../src/lib/blocks/program";
import type { TrackContent } from "./types";

// Mundo 1: o jogo da caça ao tesouro. As moedas já estão programadas; o aluno leva o Bloquinho até elas.
const ANDAR = ["motion_movesteps", "motion_turnright", "motion_turnleft", "motion_gotoxy", "control_wait"];
const pointDir = (d: number) => b("motion_pointindirection", { DIRECTION: n(d) });

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
      { name: "Bloquinho", code: [[flag(), gotoXY(0, 0), pointDir(90), ...heroi]] },
      ...moedas.map(([x, y], i) => ({
        name: `Moeda ${i + 1}`, character: "moeda" as const, x, y,
        code: [[flag(), show(), wait(0.2), waitUntil(touching("Bloquinho")), hide(), sound("moeda"), changeVar("tesouros", n(1))]],
      })),
    ],
  };
}

const caca = (moedas: [number, number][]) => ({
  allowedBlocks: ANDAR,
  starter: game(cacaAoTesouro(moedas)),
});

export const modulo: TrackContent["modules"][number] = {
  title: "Jogo: caça ao tesouro",
  lessons: [
    {
      slug: "tesouro-primeira-moeda",
      title: "Tesouro 1: a primeira moeda",
      type: "EXERCICIO",
      content: `## Jogo: caça ao tesouro

O Glitch espalhou moedas pela Vila do Palco! Cada moeda que o Bloquinho tocar some e conta em **tesouros**.

As moedas já estão programadas. Você só programa o **Bloquinho**: embaixo dos blocos que já estão lá, faça ele **andar até a moeda**.

> Dica: olhe a grade. A moeda está em **x: 150, y: 0**.`,
      ...caca([[150, 0]]),
      checks: {
        maxSeconds: 5,
        checks: [{ type: "variableAtLeast", name: "tesouros", min: 1, message: "O Bloquinho precisa chegar até a moeda (x: 150, y: 0).", goal: "Leve o Bloquinho até a **moeda** (x: 150, y: 0)" }],
      },
      guide: {
        objetivo: "Usar os movimentos aprendidos com um objetivo de jogo.",
        minutos: 10,
        passos: ["Mostre que as moedas já têm programa: clique nelas e veja os blocos.", "Pergunte: quantos passos até a moeda?"],
        errosComuns: ["Apagar os blocos que já vêm no Bloquinho (vá para o centro): eles fazem o jogo recomeçar certo."],
      },
    },
    {
      slug: "tesouro-dobrando-a-esquina",
      title: "Tesouro 2: dobrando a esquina",
      type: "EXERCICIO",
      content: `## Duas moedas, uma esquina

Agora há **duas moedas**: uma em **x: 100, y: 0** e outra **em cima dela**, em **x: 100, y: 100**.

1. Ande até a primeira moeda.
2. **Espere 1 segundo**: assim a moeda tem tempo de ver que foi pega.
3. Gire para cima e ande até a segunda.

> Por que esperar? O computador é tão rápido que, sem espera, o Bloquinho passa pela moeda sem ela perceber.`,
      ...caca([[100, 0], [100, 100]]),
      checks: {
        maxSeconds: 6,
        checks: [
          { type: "visits", tolerance: 10, points: [{ x: 100, y: 0, goal: "Chegue na **1ª moeda** (x: 100, y: 0)" }, { x: 100, y: 100, goal: "Chegue na **2ª moeda** (x: 100, y: 100)" }] },
          { type: "variableAtLeast", name: "tesouros", min: 2, message: "Espere 1 segundo em cada moeda para ela ser pega.", goal: "Pegue as **2 moedas** (espere em cada uma)" },
        ],
      },
      guide: {
        objetivo: "Perceber que o tempo importa no jogo: esperar para a moeda ser pega.",
        minutos: 10,
        passos: ["Deixe rodarem sem a espera e perguntarem por que a 1ª moeda não sumiu.", "Ligue com a lição do passeio com pausa."],
        errosComuns: ["Girar para o lado errado (↻ em vez de ↺).", "Esperar só no fim."],
      },
    },
    {
      slug: "tesouro-caca-completa",
      title: "Desafio: caça ao tesouro",
      type: "DESAFIO",
      xp: 30,
      content: `# Desafio: pegue todos os tesouros!

Há **4 moedas** espalhadas pela vila. Pegue **todas** para ver a tela de **CONCLUÍDO**.

- Use a grade para descobrir onde cada moeda está.
- Você pode andar e girar ou pular com **vá para x: y:**.
- Não esqueça de **esperar** um pouco em cada moeda.`,
      ...caca([[100, 100], [-100, 100], [-100, -100], [100, -100]]),
      checks: {
        maxSeconds: 12,
        checks: [
          { type: "variableAtLeast", name: "tesouros", min: 4, message: "Pegue as 4 moedas, esperando um pouco em cada uma.", goal: "Pegue as **4 moedas**" },
          { type: "backdropIs", backdrop: "concluido", message: "O jogo termina na tela de CONCLUÍDO quando as 4 moedas são pegas.", goal: "Veja a tela de **CONCLUÍDO**" },
        ],
      },
      guide: {
        objetivo: "Planejar um caminho com coordenadas para completar um jogo.",
        minutos: 20,
        passos: ["Peça para planejarem a rota no caderno antes de montar os blocos.", "Compare rotas: quem chegou com menos blocos?"],
        errosComuns: ["Trocar x e y.", "Esquecer a espera e uma moeda ficar no palco."],
      },
      extra: "Volte para o **centro** depois de pegar a última moeda.",
    },
  ],
};
