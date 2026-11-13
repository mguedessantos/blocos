import type { TrackContent } from "../trilhas/types";

const JUMP = ["event_whenflagclicked", "motion_gotoxy"];
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
- Quando terminar, clique na **bandeira verde** acima da minha caixa para me ver em ação.
- Clique em **Verificar** para saber se você completou o desafio e ganhar estrelas.

> Dica: programar é tentar, ver o que acontece e ajustar. Errar faz parte!`,
        },
        {
          slug: "primeiros-passos",
          title: "Ande 100 passos",
          type: "EXERCICIO",
          content: `## Missão: ande até a linha!

O bloco **mova 10 passos** faz o Bloquinho andar. Troque o número para andar mais ou menos.

Encaixe o bloco embaixo da bandeira, clique na **bandeira verde** para testar e, quando o objetivo ficar marcado, clique em **Verificar**.`,
          allowedBlocks: MOVE,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "finalPosition", x: 100, y: 0, message: "O Bloquinho precisa terminar 100 passos à direita do centro (x: 100).", goal: "Ande **100 passos** para a direita" },
            ],
          },
        },
        {
          slug: "virando-a-esquina",
          title: "Virando a esquina",
          type: "EXERCICIO",
          content: `## Missão: vire a esquina

Girar **90 graus** é virar uma esquina. Para virar à esquerda, use **gire ↺ 90 graus**.

Cumpra os objetivos **na ordem**: um bloco para cada objetivo. Eles vão sendo marcados enquanto você monta.`,
          allowedBlocks: MOVE,
          startWithFlag: true,
          checks: {
            checks: [
              {
                type: "visits",
                points: [
                  { x: 100, y: 0, goal: "Ande **100 passos** para a direita" },
                  { dir: 0, goal: "Gire **↺ 90 graus** para olhar para cima" },
                  { x: 100, y: 100, goal: "Ande **100 passos** para cima" },
                ],
                tolerance: 5,
              },
            ],
          },
        },
        {
          slug: "pule-para-cima",
          title: "Pule para cima",
          type: "EXERCICIO",
          content: `## Missão: pule para o topo!

O palco é como um mapa. Todo lugar dele tem dois números:

- **x**: a posição na horizontal (de um lado para o outro).
- **y**: a posição na vertical (de cima para baixo).
- O centro do palco é **x: 0, y: 0**.

O bloco **vá para x: y:** faz o Bloquinho pular direto para um lugar. Quanto **maior o y**, mais para cima. O topo do palco é **y: 180**.`,
          allowedBlocks: JUMP,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o **topo** do palco: **vá para x: 0 y: 180**" },
              { type: "visits", points: [{ y: 180, goal: "Pule para o **topo** do palco: **vá para x: 0 y: 180**" }] },
            ],
          },
        },
        {
          slug: "pule-para-baixo",
          title: "Pule para baixo",
          type: "EXERCICIO",
          content: `## Missão: pule para o chão!

Abaixo do centro, o **y fica negativo**: tem um sinal de menos na frente. O chão do palco é **y: -180**.

Use **vá para x: y:** e coloque **-180** no y.`,
          allowedBlocks: JUMP,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para a parte de **baixo**: **vá para x: 0 y: -180**" },
              { type: "visits", points: [{ y: -180, goal: "Pule para a parte de **baixo**: **vá para x: 0 y: -180**" }] },
            ],
          },
        },
        {
          slug: "pule-para-a-esquerda",
          title: "Pule para a esquerda",
          type: "EXERCICIO",
          content: `## Missão: pule para a esquerda!

Agora é o **x**. À esquerda do centro, o **x fica negativo**. A borda esquerda do palco é **x: -240**.`,
          allowedBlocks: JUMP,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o lado **esquerdo**: **vá para x: -240 y: 0**" },
              { type: "visits", points: [{ x: -240, goal: "Pule para o lado **esquerdo**: **vá para x: -240 y: 0**" }] },
            ],
          },
        },
        {
          slug: "pule-para-a-direita",
          title: "Pule para a direita",
          type: "EXERCICIO",
          content: `## Missão: pule para a direita!

À direita do centro, o **x é positivo**. A borda direita do palco é **x: 240**.`,
          allowedBlocks: JUMP,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para o lado **direito**: **vá para x: 240 y: 0**" },
              { type: "visits", points: [{ x: 240, goal: "Pule para o lado **direito**: **vá para x: 240 y: 0**" }] },
            ],
          },
        },
        {
          slug: "pule-para-o-canto",
          title: "Pule para o canto",
          type: "EXERCICIO",
          content: `## Missão: x e y juntos!

Agora use os **dois números ao mesmo tempo**: o **x** escolhe o lado e o **y** escolhe a altura.

Use um bloco **vá para x: y:** para cada pulo, **na ordem** dos objetivos.`,
          allowedBlocks: JUMP,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "motion_gotoxy", goal: "Pule para **x: 150, y: 100**" },
              {
                type: "visits",
                points: [
                  { x: 150, y: 100, goal: "Pule para **x: 150, y: 100**" },
                  { x: 240, y: 180, goal: "Pule para o **canto de cima, à direita** (x: 240, y: 180)" },
                ],
              },
            ],
          },
        },
        {
          slug: "passeio-com-pausa",
          title: "Um passeio com pausa",
          type: "EXERCICIO",
          content: `## Missão: respire fundo

O computador é rápido demais: às vezes nem dá para ver o que aconteceu! O bloco **espere 1 segundos** dá uma pausa entre um passo e outro.`,
          allowedBlocks: [...MOVE, "control_wait"],
          startWithFlag: true,
          checks: {
            checks: [
              {
                type: "visits",
                points: [
                  { x: 50, y: 0, goal: "Ande **50 passos**" },
                  { wait: 1, goal: "Espere **1 segundo**" },
                  { x: 100, y: 0, goal: "Ande mais **50 passos**" },
                ],
                tolerance: 5,
              },
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

Os blocos de **Aparência** (roxos) mostram balões de fala. Use o bloco **diga** para o Bloquinho falar.`,
          allowedBlocks: [...MOVE, "looks_sayforsecs", "looks_say"],
          startWithFlag: true,
          checks: {
            checks: [
              {
                type: "visits",
                points: [
                  { say: "bloquinho", goal: "Diga **Olá, eu sou o Bloquinho!**" },
                  { x: 50, y: 0, goal: "Ande **50 passos**" },
                  { say: "tchau", goal: "Diga **Tchau!**" },
                ],
                tolerance: 5,
              },
            ],
          },
        },
        {
          slug: "quadrado-magico",
          title: "Quadrado mágico",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Desafio: ande em quadrado

Faça o Bloquinho andar em um **quadrado** com lados de **100 passos**, voltar para onde começou e depois **sair** do quadrado.

Um quadrado tem **4 lados iguais** e **4 cantos de 90 graus**. Em vez de repetir os mesmos blocos 4 vezes, use o bloco **repita**!

Coloque um **espere** dentro do repita: assim dá para ver o Bloquinho andando, em vez de pular.`,
          allowedBlocks: [...MOVE, "control_repeat", "control_wait"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat", message: "Use o bloco “repita” para não precisar repetir os blocos.", goal: "Use o bloco **repita**" },
              { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Coloque um bloco “espere” dentro do repita", goal: "Coloque um **espere** dentro do **repita**, para ver o Bloquinho andando" },
              {
                type: "visits",
                points: [
                  { x: 100, y: 0, goal: "Chegue no **1º canto** (x: 100, y: 0)" },
                  { x: 100, y: 100, goal: "Chegue no **2º canto** (x: 100, y: 100)" },
                  { x: 0, y: 100, goal: "Chegue no **3º canto** (x: 0, y: 100)" },
                  { x: 0, y: 0, goal: "Volte para o **começo** (x: 0, y: 0)" },
                  { x: 50, y: 0, goal: "Depois do **repita**, ande **50 passos** para sair do quadrado" },
                ],
                tolerance: 5,
              },
              { type: "maxBlocks", max: 6, bonus: true, message: "Um programa caprichado usa só 6 blocos no total.", goal: "Use só **6 blocos** no total" },
            ],
          },
        },
      ],
    },
  ],
};
