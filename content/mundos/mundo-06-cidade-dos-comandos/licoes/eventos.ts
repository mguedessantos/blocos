import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "eventos",
  title: "Quem começa o código?",
  type: "TEORIA",
  xp: 5,
  content: `# Eventos: o “gatilho” de cada script

Até agora, todo código começou com a **bandeira verde**. Mas um jogo precisa reagir ao **jogador**!

Os blocos amarelos de **Eventos** começam scripts:

- **quando a bandeira verde for clicada**: quando o jogo começa.
- **quando a tecla [espaço] for pressionada**: quando o jogador aperta uma tecla.
- **quando este ator for clicado**: quando o jogador clica no ator.

> Um mesmo ator pode ter **vários scripts**, cada um com o seu evento. Eles funcionam ao mesmo tempo!

## Testando

Clique na **bandeira verde** e depois use o **teclado** e o **mouse** no palco. O jogo fica esperando você até clicar no **botão vermelho** (parar).`,
  guide: {
    objetivo: "Entender que eventos diferentes disparam scripts diferentes, ao mesmo tempo.",
    minutos: 10,
    passos: ["Mostre um ator com 3 scripts (bandeira, tecla, clique) e teste cada um."],
    errosComuns: ["Achar que só pode existir um script por ator."],
  },
};
