import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "do-tema-a-ideia",
  title: "Do tema à ideia",
  type: "TEORIA",
  xp: 10,
  content: `# Tempestade de ideias

Quando o tema sair:

1. **5 minutos de ideias malucas**: cada um fala o que vier à cabeça. Nada é errado!
2. **Escolham uma ideia** que combine com o tema e que seja **simples**.
3. **Descubram o “coração” do jogo**: qual é a única coisa que o jogador faz o tempo todo? (pular, desviar, pegar...)
4. **Façam a lista do mínimo**: o que o jogo PRECISA ter para funcionar? Façam isso primeiro.
5. **Lista dos extras**: só se sobrar tempo (mais fases, chefão, efeitos...).

> Treino: tema **“pequeno contra grande”**. Que jogo vocês fariam?`,
  guide: {
    objetivo: "Transformar um tema em uma ideia de jogo com escopo realista.",
    minutos: 20,
    passos: ["Treino com tema surpresa e 10 minutos para a equipe apresentar a ideia em 1 frase.", "Peça a “lista do mínimo” de cada equipe e ajude a cortar o excesso."],
    errosComuns: ["Lista do mínimo com 10 itens: o mínimo deve caber em 3–4 itens."],
  },
};
