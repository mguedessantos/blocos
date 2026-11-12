import type { TrackContent } from "../trilhas/types";

const BASE = ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "motion_turnleft", "control_repeat"];
const PEN = ["pen_penDown", "pen_penUp", "pen_clear"];

export const repeticao: TrackContent = {
  slug: "repeticao",
  title: "Repetição",
  description: "Use o bloco repita para fazer muito com pouco: escadas, polígonos, flores e estrelas.",
  level: 2,
  order: 2,
  modules: [
    {
      title: "Repetir é poder",
      lessons: [
        {
          slug: "por-que-repetir",
          title: "Por que repetir?",
          type: "TEORIA",
          xp: 5,
          content: `# Programadores são preguiçosos (do jeito bom!) 😄

Imagine que você quer que o Bloquinho ande **10 passinhos**. Você poderia colocar 10 blocos iguais, um embaixo do outro... mas isso dá trabalho e é fácil errar.

O bloco **repita** resolve isso: tudo o que fica **dentro** dele acontece várias vezes.

## Como usar

- Arraste o bloco **repita 10 vezes** (ele parece uma boca aberta 🟧).
- Coloque os blocos que você quer repetir **dentro** da boca.
- Troque o número para escolher quantas vezes repetir.

> Dica: quando você perceber que está copiando os mesmos blocos várias vezes, pense no **repita**!`,
        },
        {
          slug: "dez-passinhos",
          title: "Dez passinhos",
          type: "EXERCICIO",
          content: `## Missão: 10 passinhos de 10

Faça o Bloquinho dar **10 passinhos de 10 passos** cada um, usando o bloco **repita**.

No final ele vai estar em **x: 100**.`,
          allowedBlocks: BASE,
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat" },
              { type: "finalPosition", x: 100, y: 0 },
              { type: "maxBlocks", max: 3, bonus: true, message: "Dá para fazer com só 2 blocos embaixo da bandeira." },
            ],
          },
        },
        {
          slug: "triangulo",
          title: "Triângulo",
          type: "EXERCICIO",
          content: `## Missão: desenhe um triângulo

Um triângulo tem **3 lados**. Para fechar a figura, o Bloquinho precisa girar **120 graus** em cada canto (3 × 120 = 360, uma volta inteira!).

Abaixe a caneta e desenhe um triângulo com lados de **100 passos**.`,
          allowedBlocks: [...BASE, ...PEN],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat" },
              { type: "drawnLength", min: 300, max: 300, message: "O triângulo precisa ter 3 lados de 100 passos." },
              { type: "finalPosition", x: 0, y: 0, message: "Volte ao ponto de partida para fechar o triângulo." },
              { type: "maxBlocks", max: 5, bonus: true },
            ],
          },
        },
        {
          slug: "escada",
          title: "Escada",
          type: "EXERCICIO",
          content: `## Missão: suba a escada

Cada degrau é assim: **anda 30 para a direita, sobe 30**. Faça o Bloquinho subir **4 degraus**.

Ele precisa terminar em **x: 120, y: 120**, olhando para a **direita** (direção 90).

> Dica: para subir, gire para a esquerda; depois, gire de volta para a direita.`,
          allowedBlocks: [...BASE, ...PEN],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat" },
              { type: "finalPosition", x: 120, y: 120 },
              { type: "finalDirection", direction: 90 },
              { type: "maxBlocks", max: 6, bonus: true },
            ],
          },
        },
      ],
    },
    {
      title: "Repetições dentro de repetições",
      lessons: [
        {
          slug: "flor-de-quadrados",
          title: "Flor de quadrados",
          type: "EXERCICIO",
          xp: 15,
          content: `## Missão: uma flor feita de quadrados

Dá para colocar um **repita dentro de outro repita**!

1. Monte um quadrado com lados de **50 passos** (repita 4 vezes: mover e girar 90).
2. Coloque esse quadrado dentro de **outro repita 4 vezes**, girando **90 graus** depois de cada quadrado.

Você vai ver 4 quadrados formando uma flor. 🌸`,
          allowedBlocks: [...BASE, ...PEN],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat", min: 2, message: "Use um repita dentro de outro repita." },
              { type: "drawnLength", min: 800, max: 800, message: "A flor tem 4 quadrados com lados de 50 passos." },
              { type: "finalPosition", x: 0, y: 0 },
            ],
          },
        },
        {
          slug: "estrela",
          title: "Estrela de 5 pontas",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Desafio: desenhe uma estrela

Uma estrela de 5 pontas é um caminho com **5 linhas de 100 passos**. O segredo é o ângulo: em cada ponta, o Bloquinho gira **144 graus**.

Desenhe a estrela e volte ao ponto de partida.`,
          allowedBlocks: [...BASE, ...PEN],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat" },
              { type: "drawnLength", min: 500, max: 500 },
              { type: "finalPosition", x: 0, y: 0 },
              { type: "maxBlocks", max: 5, bonus: true },
            ],
          },
        },
        {
          slug: "para-sempre",
          title: "Para sempre!",
          type: "EXERCICIO",
          content: `## Missão: uma bola que nunca para

O bloco **sempre** repete sem parar, até você clicar em **Parar**.

Faça o Bloquinho andar **5 passos** para sempre e **quicar** quando encostar na borda (bloco **se tocar na borda, volte**).

> Dica: comece apontando para uma direção inclinada, como **45**, para ele quicar pelo palco todo.`,
          allowedBlocks: [...BASE, "control_forever", "motion_ifonedgebounce", "motion_pointindirection"],
          startWithFlag: true,
          checks: {
            maxSeconds: 10,
            checks: [
              { type: "usesBlock", opcode: "control_forever" },
              { type: "usesBlock", opcode: "motion_ifonedgebounce" },
              { type: "walked", min: 1000, message: "O Bloquinho precisa continuar andando pelo palco sem ficar preso na borda." },
            ],
          },
        },
      ],
    },
  ],
};
