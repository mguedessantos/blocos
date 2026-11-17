import { changeVar, game, n } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { fruta, pegaFrutas, PONTO, SETAS, VIDA } from "../jogo";

export const licao: LessonContent = {
  slug: "frutas-vidas",
  title: "Pega-frutas 2: vidas",
  type: "EXERCICIO",
  content: `## Missão: cuidado com o chão

Toda fruta que cai no **chão** custa uma **vida**. Você começa com **3 vidas**.

Na **Fruta**, dentro de **se (posição y < -170) então** (a fruta chegou no chão), coloque **adicione -1 a vidas**.

Com o sinal de menos, o **adicione** diminui a variável. Teste: deixe uma fruta cair e veja as vidas baixarem.`,
  allowedBlocks: [],
  starter: game(pegaFrutas(SETAS, fruta([PONTO], []))),
  checks: {
    maxSeconds: 3,
    inputs: [{ key: "right arrow", from: 0.1, to: 0.6 }],
    checks: [
      { type: "variableEquals", name: "vidas", value: 2, message: "O Bloquinho sai do caminho e a primeira fruta cai no chão: vidas deveria ir de 3 para 2. Use adicione -1 a vidas.", goal: "Fruta no chão: **-1 vida** (de 3 para 2)" },
      { type: "variableEquals", name: "pontos", value: 0, message: "A fruta caiu no chão: os pontos não podem subir.", goal: "Fruta no chão não vale ponto" },
    ],
  },
  guide: {
    objetivo: "Diminuir uma variável com um número negativo.",
    minutos: 10,
    passos: ["Lembre a régua do x: números negativos andam para trás; no adicione, eles diminuem a variável."],
    errosComuns: ["Usar adicione 1 a vidas: as vidas aumentam em vez de diminuir.", "Escolher pontos no menu em vez de vidas."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pegaFrutas(SETAS, fruta([PONTO], [VIDA])),
  erros: [
    pegaFrutas(SETAS, fruta([PONTO], [changeVar("vidas", n(1))])),
    pegaFrutas(SETAS, fruta([PONTO], [changeVar("pontos", n(-1))])), // variável errada
  ],
};
