import {
  backdrop, broadcast, c, changeVar, changeY, createClone, deleteClone, flag, forever, game, getVar, goTo, gt, hide, ifEdgeBounce, iff, lt, move, n,
  r, rotationLR, setVar, show, stopAll, touching, wait, waitUntil, whenClone, whenReceive, ypos, type GameSpec,
} from "../../src/lib/blocks/build";
import type { BlocklyBlock } from "../../src/lib/blocks/program";
import type { TrackContent } from "./types";

// Mundo 4 (fim do nível básico): um jogo pronto em que só falta programar o herói.
const ATAQUE = ["event_whenkeypressed", "motion_changexby"];
const repeatUntil = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_repeat_until", { CONDITION: r(cond) }, body);

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

const treino = { maxSeconds: 2 };

export const mundoGlitch: TrackContent = {
  slug: "mundo-ataque-do-glitch",
  title: "Mundo 4 · O Ataque do Glitch",
  description: "Um jogo quase pronto: o Glitch atira raios e você programa o Bloquinho para desviar com as setas do teclado.",
  story: "O Glitch descobriu que o Bloquinho está devolvendo a aura aos mundos e veio atacar! O jogo já está montado, só falta uma coisa: ensinar o Bloquinho a fugir.",
  level: 1,
  order: 4,
  modules: [
    {
      title: "O Glitch chegou",
      lessons: [
        {
          slug: "o-glitch-atacou",
          title: "O Glitch atacou!",
          type: "TEORIA",
          xp: 5,
          content: `# O Glitch atacou!

O **Glitch**, o vilão que causou a Grande Pane, apareceu no topo do palco. Ele anda de um lado para o outro e **atira raios** para baixo.

O jogo já está quase pronto: o Glitch e os raios já foram programados. **Falta o herói!** Nas próximas missões, você vai programar o **Bloquinho** para andar com as **setas do teclado** e fugir dos raios.

## Dois blocos novos

- **quando a tecla [seta para a direita] for pressionada** (Eventos, amarelo): o que estiver embaixo dele acontece toda vez que você aperta essa tecla.
- **adicione 20 a x** (Movimento, azul): anda 20 para os lados. Número **positivo** vai para a **direita**; número **negativo** (com sinal de menos) vai para a **esquerda**.

> Dica: antes de apertar as setas, clique no palco. Assim o teclado conversa com o jogo.`,
          guide: {
            objetivo: "Apresentar o jogo do Glitch e os blocos de tecla e de mudar x.",
            minutos: 5,
            passos: [
              "Abra o desafio final no projetor e mostre o Glitch atirando, com o Bloquinho parado levando raios.",
              "Pergunte: o que falta para virar um jogo de verdade? (o jogador controlar o herói).",
            ],
            errosComuns: ["Apertar as setas sem clicar no palco antes: o teclado continua na página."],
          },
        },
        {
          slug: "glitch-para-a-direita",
          title: "Fuja para a direita",
          type: "EXERCICIO",
          content: `## Missão: um passo para a direita

O Glitch ainda está parado, só observando. Treine o Bloquinho antes do ataque!

Use **quando a tecla seta para a direita for pressionada** e, embaixo dele, **adicione 20 a x**. Clique no palco e aperte a seta para testar.`,
          allowedBlocks: ATAQUE,
          starter: game(ataqueDoGlitch([], false)),
          checks: {
            ...treino,
            inputs: [{ key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.4, to: 0.5 }, { key: "right arrow", from: 0.7, to: 0.8 }],
            checks: [
              { type: "keys", min: 1, message: "Use o bloco “quando a tecla … for pressionada”.", goal: "Use **quando a tecla seta para a direita for pressionada**" },
              {
                type: "finalPosition", sprite: "Bloquinho", x: 60, y: -140, tolerance: 1,
                message: "Com 3 toques na seta da direita, o Bloquinho deveria chegar em x: 60. Use adicione 20 a x.",
                goal: "A cada toque, ande **20** para a direita (**adicione 20 a x**)",
              },
            ],
          },
          guide: {
            objetivo: "Controlar o ator com um evento de tecla.",
            minutos: 10,
            passos: ["Mostre que o bloco de tecla é um chapéu: ele começa um programa novo, sem a bandeira verde."],
            errosComuns: ["Encaixar embaixo da bandeira verde em vez de usar o bloco de tecla.", "Usar 20 negativo e o Bloquinho ir para a esquerda."],
          },
        },
        {
          slug: "glitch-dois-lados",
          title: "Fuja para os dois lados",
          type: "EXERCICIO",
          content: `## Missão: direita e esquerda

Agora o Bloquinho precisa fugir para **os dois lados**.

1. Mantenha o programa da **seta para a direita** (adicione **20** a x).
2. Monte outro: **quando a tecla seta para a esquerda for pressionada** e **adicione -20 a x**.`,
          allowedBlocks: ATAQUE,
          starter: game(ataqueDoGlitch([], false)),
          checks: {
            ...treino,
            inputs: [
              { key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.4, to: 0.5 },
              { key: "right arrow", from: 0.7, to: 0.8 }, { key: "left arrow", from: 1.0, to: 1.1 },
            ],
            checks: [
              { type: "keys", min: 2, message: "Use as duas setas: direita e esquerda.", goal: "Use as setas **direita** e **esquerda**" },
              {
                type: "finalPosition", sprite: "Bloquinho", x: 40, y: -140, tolerance: 1,
                message: "Com 3 toques na direita e 1 na esquerda, o Bloquinho deveria chegar em x: 40. Confira: 20 e -20.",
                goal: "Cada toque anda **20** para o lado certo (**20** e **-20**)",
              },
            ],
          },
          guide: {
            objetivo: "Usar número negativo para andar para a esquerda.",
            minutos: 10,
            passos: ["Lembre a régua do x: à esquerda do centro os números ficam negativos."],
            errosComuns: ["Usar adicione 20 a x nas duas setas: o Bloquinho só anda para a direita."],
          },
        },
      ],
    },
    {
      title: "Desvie dos raios",
      lessons: [
        {
          slug: "glitch-desvie-dos-raios",
          title: "Desafio: desvie dos raios!",
          type: "DESAFIO",
          xp: 30,
          content: `# Desafio: desvie dos raios!

Agora é para valer: o **Glitch** anda de um lado para o outro e **atira um raio a cada segundo**. Cada raio que passa sem acertar o Bloquinho soma 1 em **desvios**. Raio que acerta não conta!

O jogo está pronto, menos o herói. **Programe só o Bloquinho**:

1. **Seta para a direita**: o Bloquinho anda para a direita.
2. **Seta para a esquerda**: o Bloquinho anda para a esquerda.

Clique na bandeira verde, clique no palco e fuja dos raios! Ao chegar em **10 desvios**, aparece a tela de **CONCLUÍDO** no palco. Depois clique em **Verificar** para liberar a próxima missão.`,
          allowedBlocks: ATAQUE,
          starter: game(ataqueDoGlitch()),
          checks: {
            maxSeconds: 30,
            inputs: [
              { key: "right arrow", from: 0.1, to: 0.2 }, { key: "left arrow", from: 0.5, to: 0.6 },
              { key: "left arrow", from: 0.9, to: 1.0 }, { key: "left arrow", from: 1.3, to: 1.4 },
            ],
            checks: [
              { type: "keys", min: 2, message: "Use as duas setas: direita e esquerda.", goal: "Controle o Bloquinho com as setas **direita** e **esquerda**" },
              {
                type: "movedBy", axis: "x", min: -1, sprite: "Bloquinho",
                label: "Com 1 toque na direita e 3 na esquerda, o Bloquinho deveria terminar à esquerda de onde começou",
                goal: "O Bloquinho anda para o lado da seta apertada",
              },
              {
                type: "variableAtLeast", name: "desvios", min: 10,
                message: "O jogo precisa chegar em 10 desvios. Não mude os programas do Glitch e do Raio.",
                goal: "Desvie de **10 raios** e veja a tela de **CONCLUÍDO**",
              },
            ],
          },
          guide: {
            objetivo: "Completar um jogo pronto programando só o controle do herói.",
            minutos: 20,
            passos: [
              "Deixe a turma jogar até a tela de CONCLUÍDO e comparar quem chegou mais rápido.",
              "Pergunte: o que muda se o Bloquinho andar 40 em vez de 20 a cada toque?",
            ],
            errosComuns: ["Mexer nos programas do Glitch ou do Raio: o desafio é programar só o Bloquinho.", "Esquecer de clicar no palco antes de apertar as setas."],
          },
        },
      ],
    },
  ],
};
