import { CORRER, corrida } from "../jogo";
import { game, move, nextCostume, repeat, sayFor, sound, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: corrida([sayFor("Preparar!", 1), sound("pop"), repeat(20, move(20), nextCostume(), wait(0.1))], true),
  erros: [
    corrida([repeat(80, move(5), nextCostume(), wait(0.1))], true),
  ],
};
