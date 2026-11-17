import { CORRER, corrida } from "../jogo";
import { game, move, nextCostume, repeat, sayFor, sound, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: corrida([sayFor("Preparar!", 1), sound("pop"), repeat(40, move(10), nextCostume(), wait(0.1))]),
};
