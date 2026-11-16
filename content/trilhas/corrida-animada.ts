import {
  b, backdrop, broadcast, c, flag, game, gotoXY, gt, move, n, nextCostume, r, stopAll, touching, wait, waitUntil, whenReceive, xpos, sayFor,
  type GameSpec,
} from "../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../src/lib/blocks/program";
import type { TrackContent } from "./types";

// Mundo 3: a corrida animada. A pista, a chegada e o Glitch já estão programados; o aluno anima e faz o Bloquinho correr.
const CORRER = ["control_repeat", "motion_movesteps", "looks_nextcostume", "control_wait", "sound_play", "sound_playuntildone", "looks_sayforsecs"];
const pointDir = (d: number) => b("motion_pointindirection", { DIRECTION: n(d) });
const repeatUntil = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_repeat_until", { CONDITION: r(cond) }, body);

/** Corrida: quem chegar primeiro na bandeira vence. Com `rival`, o Glitch corre também (6 passos a cada 0,1 s). */
export function corrida(bloquinho: BlocklyBlock[] = [], rival = false): GameSpec {
  return {
    backdrops: ["cidade", "concluido", "fim"],
    stage: [
      [flag(), backdrop("cidade")],
      [whenReceive("bloquinho venceu"), backdrop("concluido"), wait(1), stopAll()], // espera o último som
      [whenReceive("glitch venceu"), backdrop("fim"), wait(1), stopAll()],
    ],
    sprites: [
      { name: "Bloquinho", x: -200, y: -60, code: [[flag(), gotoXY(-200, -60), pointDir(90), ...bloquinho]] },
      {
        name: "Glitch", character: "glitch", x: -200, y: 60,
        code: [[flag(), gotoXY(-200, 60), pointDir(90), ...(rival
          ? [wait(0.5), repeatUntil(gt(r(xpos()), n(160)), move(6), nextCostume(), wait(0.1)), sayFor("Venci!", 1), broadcast("glitch venceu")]
          : [])]],
      },
      // a chegada fica na pista do Bloquinho
      { name: "Chegada", character: "bandeira", x: 200, y: -60, code: [[flag(), wait(0.2), waitUntil(touching("Bloquinho")), broadcast("bloquinho venceu")]] },
    ],
  };
}

export const modulo: TrackContent["modules"][number] = {
  title: "Jogo: corrida animada",
  lessons: [
    {
      slug: "corrida-animada",
      title: "Corrida 1: correndo com estilo",
      type: "EXERCICIO",
      content: `## Jogo: a grande corrida

O Bloquinho vai correr até a **bandeira**! Para parecer que ele corre de verdade, ele precisa **mexer os pés**.

Use **repita** com três blocos dentro:

1. **mova 10 passos**
2. **próxima fantasia** (troca o desenho e os pés mexem)
3. **espere 0.1 segundos**

Quando o Bloquinho tocar na bandeira, a corrida termina.`,
      allowedBlocks: CORRER,
      starter: game(corrida()),
      checks: {
        maxSeconds: 8,
        checks: [
          { type: "inside", parent: ["control_repeat"], child: ["looks_nextcostume"], label: "Use próxima fantasia dentro do repita", goal: "Use **próxima fantasia** dentro do **repita**" },
          { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Use espere dentro do repita, para ver a animação", goal: "Use **espere** dentro do **repita**" },
          { type: "backdropIs", backdrop: "concluido", message: "O Bloquinho precisa chegar na bandeira. Repita mais vezes.", goal: "Chegue na **bandeira**" },
        ],
      },
      guide: {
        objetivo: "Animar um personagem trocando fantasias dentro de um laço.",
        minutos: 15,
        passos: ["Mostre a aba Fantasias: o Bloquinho tem duas, parado e andando.", "Pergunte: o que acontece sem o espere?"],
        errosComuns: ["Repetir poucas vezes e não chegar na bandeira.", "Colocar a próxima fantasia fora do repita."],
      },
    },
    {
      slug: "corrida-largada",
      title: "Corrida 2: preparar, apontar, já!",
      type: "EXERCICIO",
      content: `## A largada

Toda corrida tem largada! Antes de correr, o Bloquinho precisa:

1. **dizer Preparar!** por 1 segundo;
2. **tocar um som** (a buzina da largada);
3. depois, correr como na lição anterior.`,
      allowedBlocks: CORRER,
      starter: game(corrida()),
      checks: {
        maxSeconds: 10,
        checks: [
          { type: "said", text: "preparar", goal: "Diga **Preparar!** antes de correr" },
          { type: "playedSound", goal: "Toque um **som** na largada" },
          { type: "backdropIs", backdrop: "concluido", message: "Depois da largada, o Bloquinho precisa correr até a bandeira.", goal: "Chegue na **bandeira**" },
        ],
      },
      guide: {
        objetivo: "Usar fala e som para dar vida a um jogo.",
        minutos: 10,
        passos: ["Compare tocar o som e tocar o som até o fim: qual espera antes de correr?"],
        errosComuns: ["Colocar a largada depois da corrida."],
      },
    },
    {
      slug: "corrida-contra-o-glitch",
      title: "Desafio: corrida contra o Glitch",
      type: "DESAFIO",
      xp: 30,
      content: `# Desafio: vença o Glitch!

O **Glitch** entrou na corrida! Ele corre **6 passos** a cada **0,1 segundo**.

Programe o Bloquinho para chegar **primeiro** na bandeira: faça a largada, anime os pés e escolha **quantos passos** ele anda a cada vez.

- Se o Bloquinho chegar primeiro: tela de **CONCLUÍDO**.
- Se o Glitch chegar primeiro: **FIM DE JOGO**. Tente de novo!`,
      allowedBlocks: CORRER,
      starter: game(corrida([], true)),
      checks: {
        maxSeconds: 15,
        checks: [
          { type: "inside", parent: ["control_repeat"], child: ["looks_nextcostume"], label: "Anime o Bloquinho com próxima fantasia dentro do repita", goal: "Anime os pés com **próxima fantasia**" },
          { type: "backdropIs", backdrop: "concluido", message: "O Glitch chegou primeiro. Faça o Bloquinho andar mais passos a cada vez.", goal: "Chegue na bandeira **antes do Glitch**" },
          { type: "playedSound", bonus: true, goal: "Bônus: toque um som na largada" },
        ],
      },
      guide: {
        objetivo: "Ajustar números (velocidade) para vencer um jogo.",
        minutos: 20,
        passos: ["Pergunte: se o Glitch anda 6 por vez, quanto o Bloquinho precisa andar?", "Deixe testarem números diferentes."],
        errosComuns: ["Esquecer o espere: o Bloquinho chega na hora, sem animação."],
      },
    },
  ],
};
