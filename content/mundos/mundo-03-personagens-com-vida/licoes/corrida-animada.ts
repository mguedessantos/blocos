import { CORRER, corrida } from "../jogo";
import { game, move, nextCostume, repeat, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "corrida-animada",
  title: "Corrida 1: correndo com estilo",
  type: "EXERCICIO",
  content: `## Jogo: a grande corrida

O Bloquinho vai correr até a **bandeira**! Para parecer que ele corre de verdade, ele precisa **mexer os pés**.

Use **repita** com três blocos dentro:

1. **mova 10 passos**
2. **próxima fantasia** (troca o desenho e os pés mexem)
3. **espere 0.1 segundos**

Quando o Bloquinho tocar na bandeira, a corrida termina.`,
  allowedBlocks: CORRER,
  starter: game(corrida()),
  checks: {
    maxSeconds: 8,
    checks: [
      { type: "inside", parent: ["control_repeat"], child: ["looks_nextcostume"], label: "Use próxima fantasia dentro do repita", goal: "Use **próxima fantasia** dentro do **repita**" },
      { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Use espere dentro do repita, para ver a animação", goal: "Use **espere** dentro do **repita**" },
      { type: "backdropIs", backdrop: "concluido", message: "O Bloquinho precisa chegar na bandeira. Repita mais vezes.", goal: "Chegue na **bandeira**" },
    ],
  },
  guide: {
    objetivo: "Animar um personagem trocando fantasias dentro de um laço.",
    minutos: 15,
    passos: ["Mostre a aba Fantasias: o Bloquinho tem duas, parado e andando.", "Pergunte: o que acontece sem o espere?"],
    errosComuns: ["Repetir poucas vezes e não chegar na bandeira.", "Colocar a próxima fantasia fora do repita."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: corrida([repeat(40, move(10), nextCostume(), wait(0.1))]),
  erros: [
    corrida([repeat(40, move(10))]),
  ],
};
