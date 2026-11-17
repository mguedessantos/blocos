import { game } from "../../../../src/lib/blocks/build";
import { PERDEU, pong, RAQUETE, REBATE } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "pong-desafio",
  title: "Desafio: Pong completo",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: Pong completo

Agora é com você: a bola cai e quica nas bordas, mas **a raquete não anda, a bola não rebate e ninguém perde**. Monte as três decisões do jogo:

1. **Raquete**: segurando as setas, ela desliza para os lados.
2. **Bola**: se tocar na Raquete, sobe num ângulo sorteado.
3. **Bola**: se passar da raquete (y menor que -165), Tela de fim e pare todos.

Cada bola que chega lá em cima vale 1 ponto. Com **5 pontos** aparece a tela de **CONCLUÍDO**. Depois clique em **Verificar**.`,
  allowedBlocks: [],
  starter: game(pong()),
  checks: {
    maxSeconds: 20,
    inputs: [{ key: "right arrow", from: 2.6, to: 3.2 }, { key: "left arrow", from: 3.3, to: 3.5 }],
    checks: [
      { type: "movedBy", axis: "x", min: 30, sprite: "Raquete", label: "Segurando a seta para a direita, a raquete deveria ir para a direita", goal: "A **Raquete** desliza com as setas" },
      { type: "variableAtLeast", name: "pontos", min: 1, message: "A bola precisa rebater na raquete e subir.", goal: "A bola rebate na raquete e sobe" },
      { type: "backdropIs", backdrop: "fim", message: "Quando a bola passar da raquete, mostre a Tela de fim.", goal: "Se a bola passar, **Tela de fim**" },
      { type: "stopped", message: "Use pare todos quando a bola passar.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Montar sozinho as três decisões de um jogo completo.",
    minutos: 25,
    passos: [
      "Deixe a turma jogar até os 5 pontos e ver o CONCLUÍDO.",
      "Pergunte: quais são as três decisões do jogo? (anda, rebate, perde).",
    ],
    errosComuns: ["Esquecer o sempre na Raquete.", "Colocar os se… então da Bola fora do sempre."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pong(RAQUETE, [REBATE, PERDEU]),
  erros: [
    pong(RAQUETE, [PERDEU]),
    pong([], [REBATE, PERDEU]),
  ],
};
