import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "o-que-e-uma-game-jam",
  title: "O que é uma game jam?",
  type: "TEORIA",
  xp: 10,
  content: `# Game jam: criar um jogo contra o relógio

Uma **game jam** é um evento em que equipes criam um jogo do zero, sobre um **tema** revelado no início, em um **tempo limitado**.

## Como funciona

- O **tema** é anunciado no começo (ex.: “tudo ao contrário”, “um só botão”).
- As equipes têm um tempo fixo para criar.
- No fim, cada equipe **envia** o jogo e os **jurados** jogam e avaliam.

## O que os jurados avaliam

- **Diversão**: dá vontade de jogar de novo?
- **Tema**: o jogo combina com o tema?
- **Criatividade**: tem uma ideia diferente?
- **Capricho**: funciona sem erros? Tem sons, telas de início e fim?

> Na jam, **terminar** é mais importante que fazer um jogo enorme!`,
  guide: {
    objetivo: "Entender o formato da game jam e os critérios de avaliação.",
    minutos: 15,
    passos: ["Joguem juntos um jogo feito por outra turma e avaliem com os 4 critérios."],
    errosComuns: ["Achar que vence quem faz o jogo maior: reforce diversão e capricho."],
  },
};
