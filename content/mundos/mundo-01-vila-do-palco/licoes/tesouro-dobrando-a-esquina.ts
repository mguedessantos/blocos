import { caca, cacaAoTesouro } from "../jogo";
import { left, move, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "tesouro-dobrando-a-esquina",
  title: "Tesouro 2: dobrando a esquina",
  type: "EXERCICIO",
  content: `## Duas moedas, uma esquina

Agora há **duas moedas**: uma em **x: 100, y: 0** e outra **em cima dela**, em **x: 100, y: 100**.

1. Ande até a primeira moeda.
2. **Espere 1 segundo**: assim a moeda tem tempo de ver que foi pega.
3. Gire para cima e ande até a segunda.

> Por que esperar? O computador é tão rápido que, sem espera, o Bloquinho passa pela moeda sem ela perceber.`,
  ...caca([[100, 0], [100, 100]]),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "visits", tolerance: 10, points: [{ x: 100, y: 0, goal: "Chegue na **1ª moeda** (x: 100, y: 0)" }, { x: 100, y: 100, goal: "Chegue na **2ª moeda** (x: 100, y: 100)" }] },
      { type: "variableAtLeast", name: "tesouros", min: 2, message: "Espere 1 segundo em cada moeda para ela ser pega.", goal: "Pegue as **2 moedas** (espere em cada uma)" },
    ],
  },
  guide: {
    objetivo: "Perceber que o tempo importa no jogo: esperar para a moeda ser pega.",
    minutos: 10,
    passos: ["Deixe rodarem sem a espera e perguntarem por que a 1ª moeda não sumiu.", "Ligue com a lição do passeio com pausa."],
    errosComuns: ["Girar para o lado errado (↻ em vez de ↺).", "Esperar só no fim."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cacaAoTesouro([[100, 0], [100, 100]], [move(100), wait(1), left(90), move(100), wait(1)]),
  erros: [
    cacaAoTesouro([[100, 0], [100, 100]], [move(100), left(90), move(100)]),
  ],
};
