import type { TrackContent } from "./types";

const BASE = ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "motion_turnleft", "looks_say", "looks_sayforsecs"];
const VARS = ["data_setvariableto", "data_changevariableby", "data_variable"];
const MATH = ["operator_add", "operator_subtract", "operator_multiply", "operator_divide"];

export const variaveis: TrackContent = {
  slug: "variaveis-e-operadores",
  title: "Variáveis e Operadores",
  description: "Guarde informações em variáveis, faça contas e crie placares.",
  level: 4,
  order: 4,
  modules: [
    {
      title: "Guardando informações",
      lessons: [
        {
          slug: "caixinhas-com-nome",
          title: "Caixinhas com nome",
          type: "TEORIA",
          xp: 5,
          content: `# Variáveis: caixinhas com nome 📦

Uma **variável** é como uma caixinha com uma etiqueta. Dentro dela você guarda um valor — um número ou um texto — e pode mudar esse valor quando quiser.

Nos jogos, variáveis guardam os **pontos**, as **vidas**, o **tempo**...

## Os blocos

- **mude pontos para ▢**: troca o que está na caixinha.
- **adicione ▢ a pontos**: soma um número ao que já está lá (use números negativos para tirar).
- **pontos** (o bloco redondo): mostra o valor guardado. Você pode encaixá-lo em outros blocos, como **diga** ou **mover**.

> Dica: comece sempre o programa dando um valor inicial, como **mude pontos para 0**.`,
        },
        {
          slug: "placar",
          title: "Placar",
          type: "EXERCICIO",
          content: `## Missão: marque 30 pontos

1. Comece com **mude pontos para 0**.
2. Some **10** aos pontos **3 vezes**.

No final, a variável **pontos** precisa valer **30**.`,
          allowedBlocks: [...BASE, ...VARS, "control_repeat"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "data_changevariableby" },
              { type: "variableEquals", name: "pontos", value: 30 },
              { type: "usesBlock", opcode: "control_repeat", bonus: true, message: "Use o repita para não repetir o mesmo bloco 3 vezes." },
            ],
          },
        },
        {
          slug: "contando-passos",
          title: "Contando passos",
          type: "EXERCICIO",
          content: `## Missão: um contador de passos

1. Comece com **pontos = 0**.
2. Repita **5 vezes**: ande **20 passos** e **adicione 1 a pontos**.
3. No final, o Bloquinho **diz** o valor de **pontos**.`,
          allowedBlocks: [...BASE, ...VARS, "control_repeat"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "variableEquals", name: "pontos", value: 5 },
              { type: "usesBlock", opcode: "data_variable", message: "Encaixe o bloco redondo “pontos” no “diga”." },
              { type: "said", text: "5" },
              { type: "finalPosition", x: 100, y: 0 },
            ],
          },
        },
      ],
    },
    {
      title: "Fazendo contas",
      lessons: [
        {
          slug: "calculadora",
          title: "Calculadora",
          type: "EXERCICIO",
          content: `## Missão: o Bloquinho sabe a tabuada

Os blocos verdes de **Operadores** fazem contas. Encaixe **7 × 8** dentro do bloco **diga** e veja o Bloquinho responder!`,
          allowedBlocks: [...BASE, ...MATH],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "operator_multiply" },
              { type: "said", text: "56" },
            ],
          },
        },
        {
          slug: "juntando-palavras",
          title: "Juntando palavras",
          type: "EXERCICIO",
          content: `## Missão: monte uma frase

O bloco **junte ▢ com ▢** gruda dois textos. Faça o Bloquinho dizer **Olá, mundo!** usando o **junte** com **Olá, ** e **mundo!**.

> Repare no espaço depois da vírgula!`,
          allowedBlocks: [...BASE, "operator_join"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "operator_join" },
              { type: "said", text: "Olá, mundo" },
            ],
          },
        },
        {
          slug: "espiral",
          title: "Espiral",
          type: "EXERCICIO",
          xp: 15,
          content: `## Missão: passos que crescem

Variáveis podem controlar o movimento! Desenhe uma espiral:

1. Abaixe a caneta e comece com **pontos = 10**.
2. Repita **5 vezes**: **mova pontos passos**, gire **90 graus** e **adicione 10 a pontos**.

Cada linha fica 10 passos maior que a anterior. 🌀`,
          allowedBlocks: [...BASE, ...VARS, "control_repeat", "pen_penDown", "pen_penUp", "pen_clear"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "data_variable", message: "Encaixe o bloco “pontos” dentro do “mover”." },
              { type: "drawnLength", min: 150, max: 150, message: "As linhas da espiral devem ter 10, 20, 30, 40 e 50 passos." },
              { type: "variableEquals", name: "pontos", value: 60 },
            ],
          },
        },
        {
          slug: "tabuada-do-3",
          title: "Tabuada do 3",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Desafio: a tabuada do 3

Faça o Bloquinho falar a tabuada do 3, um número de cada vez: **3, 6, 9, ... até 30**.

> Dica: use uma variável que começa em 0 e vai ganhando 3 a cada repetição. Use o **diga ▢ por ▢ segundos** para dar tempo de ler!`,
          allowedBlocks: [...BASE, ...VARS, ...MATH, "control_repeat", "control_wait"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat" },
              { type: "said", text: "27" },
              { type: "said", text: "30" },
              { type: "variableEquals", name: "pontos", value: 30 },
            ],
          },
        },
      ],
    },
  ],
};
