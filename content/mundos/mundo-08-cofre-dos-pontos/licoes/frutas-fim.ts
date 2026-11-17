import { backdrop, eq, game, getVar, iff, n, r, stopAll } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { FIM, fruta, pegaFrutas, PONTO, SETAS, VIDA } from "../jogo";

export const licao: LessonContent = {
  slug: "frutas-fim",
  title: "Pega-frutas 3: fim de jogo",
  type: "EXERCICIO",
  content: `## Missão: acabaram as vidas

As vidas já diminuem, mas o jogo continua mesmo com **0 vidas** (e até com vidas negativas!). Falta o **fim de jogo**.

Na **Fruta**, logo depois de **adicione -1 a vidas**, coloque:

**se (vidas = 0) então**

- **mude o cenário para Tela de fim**
- **pare todos**

O bloco **=** (Operadores, verde) compara dois valores: ele é verdadeiro quando os dois são iguais.`,
  allowedBlocks: ["operator_equals", "looks_switchbackdropto", "control_stop"],
  starter: game(pegaFrutas(SETAS, fruta([PONTO], [VIDA]))),
  checks: {
    maxSeconds: 20,
    inputs: [{ key: "right arrow", from: 0.1, to: 0.6 }],
    checks: [
      { type: "usesBlock", opcode: "operator_equals", min: 1, message: "Use o bloco = para comparar vidas com 0.", goal: "Compare **vidas = 0**" },
      { type: "variableEquals", name: "vidas", value: 0, message: "O jogo precisa acabar quando as vidas chegarem em 0, não antes nem depois.", goal: "O jogo acaba com **0 vidas**" },
      { type: "backdropIs", backdrop: "fim", message: "Com 0 vidas, mude o cenário para a Tela de fim.", goal: "Mostre a **Tela de fim**" },
      { type: "stopped", message: "Depois da Tela de fim, use pare todos.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Usar o operador = numa condição de fim de jogo.",
    minutos: 15,
    passos: ["Pergunte: o que acontece se o teste for vidas = 1? (o jogo acaba cedo demais).", "Mostre que o = compara; o mude… para guarda um valor."],
    errosComuns: ["Colocar o se vidas = 0 dentro do se tocando: só confere quando pega uma fruta.", "Esquecer o pare todos: a Tela de fim aparece, mas as frutas continuam caindo."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pegaFrutas(SETAS, fruta([PONTO], [VIDA, FIM])),
  erros: [
    pegaFrutas(SETAS, fruta([PONTO], [VIDA, iff(eq(r(getVar("vidas")), n(0)), backdrop("fim"))])), // sem pare todos
    pegaFrutas(SETAS, fruta([PONTO], [VIDA, iff(eq(r(getVar("vidas")), n(1)), backdrop("fim"), stopAll())])), // acaba cedo
  ],
};
