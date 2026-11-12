import type { TrackContent } from "../trilhas/types";

const MOVE = ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "motion_turnleft"];

export const primeirosPassos: TrackContent = {
  slug: "primeiros-passos",
  title: "Primeiros Passos",
  description: "Conheça o Bloquinho e faça ele andar, girar, falar e desenhar.",
  level: 1,
  order: 1,
  modules: [
    {
      title: "Movendo o Bloquinho",
      lessons: [
        {
          slug: "conheca-o-bloquinho",
          title: "Conheça o Bloquinho",
          type: "TEORIA",
          xp: 5,
          content: `# Oi! Eu sou o Bloquinho 🤖

Eu sou um robô que obedece **blocos de programação**. Você encaixa os blocos, um embaixo do outro, e eu faço cada um deles **na ordem**, de cima para baixo.

## Como funciona

- Todo programa começa com o bloco **quando 🏁 for clicado**.
- Os blocos de **Movimento** (azuis) me fazem andar e girar.
- Quando terminar, clique em **Executar** para me ver em ação.
- Clique em **Verificar** para saber se você completou o desafio e ganhar estrelas.

> Dica: programar é tentar, ver o que acontece e ajustar. Errar faz parte!`,
        },
        {
          slug: "primeiros-passos",
          title: "Ande 100 passos",
          type: "EXERCICIO",
          content: `## Missão: ande até a linha!

Faça o Bloquinho andar **100 passos** para a direita.

1. Arraste o bloco **mover 10 passos** e encaixe embaixo do bloco da bandeira.
2. Troque o **10** por **100**.
3. Clique em **Executar** e depois em **Verificar**.`,
          allowedBlocks: MOVE,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "finalPosition", x: 100, y: 0, message: "O Bloquinho precisa terminar 100 passos à direita do centro (x: 100)." },
              { type: "maxBlocks", max: 2, bonus: true, message: "Dá para fazer com um bloco só, além da bandeira!" },
            ],
          },
        },
        {
          slug: "virando-a-esquina",
          title: "Virando a esquina",
          type: "EXERCICIO",
          content: `## Missão: chegue no canto

Leve o Bloquinho até **x: 100, y: 100**: ande 100 passos, **vire para cima** e ande mais 100.

Lembre: girar **90 graus** é virar uma esquina. Qual lado: ↻ ou ↺?`,
          allowedBlocks: MOVE,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "finalPosition", x: 100, y: 100 },
              { type: "maxBlocks", max: 4, bonus: true, message: "Consegue fazer com só 3 blocos embaixo da bandeira?" },
            ],
          },
        },
        {
          slug: "pule-para-o-canto",
          title: "Pule para o canto",
          type: "EXERCICIO",
          content: `## Missão: teletransporte!

O palco é como um mapa com **coordenadas**:

- **x** é a posição na horizontal: -240 (esquerda) até 240 (direita).
- **y** é a posição na vertical: -180 (embaixo) até 180 (em cima).
- O centro do palco é **x: 0, y: 0**.

Use o bloco **ir para x: y:** e leve o Bloquinho até **x: 150, y: 100** de uma vez só.`,
          allowedBlocks: [...MOVE, "motion_gotoxy", "motion_changexby", "motion_changeyby"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy" },
              { type: "finalPosition", x: 150, y: 100 },
            ],
          },
        },
        {
          slug: "passeio-com-pausa",
          title: "Um passeio com pausa",
          type: "EXERCICIO",
          content: `## Missão: respire fundo

O computador é rápido demais: às vezes nem dá para ver o que aconteceu!

Faça o Bloquinho andar **50 passos**, **esperar 1 segundo** e andar mais **50 passos**.`,
          allowedBlocks: [...MOVE, "control_wait"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_wait" },
              { type: "finalPosition", x: 100, y: 0 },
            ],
          },
        },
      ],
    },
    {
      title: "Falando e desenhando",
      lessons: [
        {
          slug: "diga-ola",
          title: "Diga olá!",
          type: "EXERCICIO",
          content: `## Missão: apresente-se

Faça o Bloquinho dizer **Olá!** por 2 segundos e depois andar **50 passos**.

Os blocos de **Aparência** (roxos) mostram balões de fala.`,
          allowedBlocks: [...MOVE, "looks_sayforsecs", "looks_say"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "looks_sayforsecs" },
              { type: "said", text: "olá" },
              { type: "finalPosition", x: 50, y: 0 },
            ],
          },
        },
        {
          slug: "quadrado-magico",
          title: "Quadrado mágico",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Desafio: desenhe um quadrado

Use a **caneta** para desenhar um quadrado com lados de **100 passos** e volte para onde começou.

Um quadrado tem **4 lados iguais** e **4 cantos de 90 graus**. Em vez de repetir os mesmos blocos 4 vezes, use o bloco **repita**!`,
          allowedBlocks: [...MOVE, "control_repeat", "pen_penDown", "pen_penUp", "pen_clear"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat", message: "Use o bloco “repita” para não precisar repetir os blocos." },
              { type: "drawnLength", min: 400, max: 400, message: "O quadrado precisa ter 4 lados de 100 passos. Não esqueça de abaixar a caneta!" },
              { type: "finalPosition", x: 0, y: 0, message: "O Bloquinho precisa terminar no ponto onde começou." },
              { type: "maxBlocks", max: 5, bonus: true, message: "Um programa caprichado usa só 5 blocos no total." },
            ],
          },
        },
      ],
    },
  ],
};
