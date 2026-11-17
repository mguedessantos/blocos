import { ATAQUE, ataqueDoGlitch } from "../jogo";
import { changeX, game, whenKey } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: ataqueDoGlitch([[whenKey("right arrow"), changeX(20)], [whenKey("left arrow"), changeX(-20)]]),
  erros: [
    ataqueDoGlitch([[whenKey("right arrow"), changeX(-20)], [whenKey("left arrow"), changeX(20)]]),
  ],
};
