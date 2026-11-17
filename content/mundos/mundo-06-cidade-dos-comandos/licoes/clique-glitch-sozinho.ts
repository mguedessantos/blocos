import { flag, forever, game, goTo } from "../../../../src/lib/blocks/build";
import { cliqueNoGlitch, PULA, SOZINHO } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "clique-glitch-sozinho",
  title: "Clique 3: o Glitch não para",
  type: "EXERCICIO",
  content: `## Missão: o Glitch pula sozinho

Agora o Glitch não espera o clique: ele **pula sozinho a cada segundo**. Quem demorar, perde a chance!

No **Glitch**, embaixo da **bandeira verde**, monte:

**sempre**

- **espere 1 segundo**
- **vá para posição aleatória**

Os dois scripts do Glitch funcionam **ao mesmo tempo**: um pula sozinho, o outro conta os cliques.`,
  allowedBlocks: ["control_forever", "control_wait"],
  starter: game(cliqueNoGlitch([PULA, [flag()]])),
  checks: {
    maxSeconds: 3.5,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["control_wait"], label: "Use espere dentro do sempre", goal: "Use **espere 1 segundo** dentro do **sempre**" },
      { type: "walked", sprite: "Glitch", min: 100, message: "Sem nenhum clique, o Glitch precisa pular sozinho: sempre, espere 1 segundo, vá para posição aleatória.", goal: "Sem clique, o Glitch **pula sozinho**" },
    ],
  },
  guide: {
    objetivo: "Ter dois scripts no mesmo ator funcionando ao mesmo tempo.",
    minutos: 15,
    passos: ["Mostre os dois scripts do Glitch lado a lado e pergunte qual roda primeiro (os dois juntos).", "Troque 1 por 0.5 segundo e veja o jogo ficar mais difícil."],
    errosComuns: ["Esquecer o espere: o Glitch pula sem parar e ninguém consegue clicar."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cliqueNoGlitch([PULA, SOZINHO]),
  erros: [
    cliqueNoGlitch([PULA, [flag(), forever(goTo("_random_"))]]), // sem espere
  ],
};
