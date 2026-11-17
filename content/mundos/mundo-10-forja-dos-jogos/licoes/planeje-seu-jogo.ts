import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "planeje-seu-jogo",
  title: "Planeje seu jogo",
  type: "TEORIA",
  xp: 10,
  content: `# Todo jogo bom começa com um plano

Antes de programar, responda no caderno:

1. **Objetivo**: o que o jogador precisa fazer? (pegar moedas, fugir do monstro...)
2. **Controles**: como o jogador joga? (setas, mouse, espaço)
3. **Regras**: o que dá pontos? O que tira vidas?
4. **Fim**: quando o jogo acaba? Dá para ganhar e perder?
5. **Atores e cenários**: quem aparece no jogo?

## O ciclo do jogo

Todo jogo repete o mesmo ciclo, muitas vezes por segundo, dentro de um **sempre**:

> **ler os controles → mover as coisas → conferir colisões → atualizar placar → repetir**

> Comece **pequeno**: um jogo simples e terminado é melhor que um jogo gigante pela metade!`,
  guide: {
    objetivo: "Planejar um jogo antes de programar (ficha de design).",
    minutos: 15,
    passos: ["Distribua uma ficha com as 5 perguntas.", "Analise juntos um jogo simples conhecido usando a ficha."],
    errosComuns: ["Planos grandes demais. Pergunte: “dá para fazer em 2 aulas?”"],
  },
};
