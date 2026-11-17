import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "o-glitch-atacou",
  title: "O Glitch atacou!",
  type: "TEORIA",
  xp: 5,
  content: `# O Glitch atacou!

O **Glitch**, o vilão que causou a Grande Pane, apareceu no topo do palco. Ele anda de um lado para o outro e **atira raios** para baixo.

O jogo já está quase pronto: o Glitch e os raios já foram programados. **Falta o herói!** Nas próximas missões, você vai programar o **Bloquinho** para andar com as **setas do teclado** e fugir dos raios.

## Dois blocos novos

- **quando a tecla [seta para a direita] for pressionada** (Eventos, amarelo): o que estiver embaixo dele acontece toda vez que você aperta essa tecla.
- **adicione 20 a x** (Movimento, azul): anda 20 para os lados. Número **positivo** vai para a **direita**; número **negativo** (com sinal de menos) vai para a **esquerda**.

> Dica: antes de apertar as setas, clique no palco. Assim o teclado conversa com o jogo.`,
  guide: {
    objetivo: "Apresentar o jogo do Glitch e os blocos de tecla e de mudar x.",
    minutos: 5,
    passos: [
      "Abra o desafio final no projetor e mostre o Glitch atirando, com o Bloquinho parado levando raios.",
      "Pergunte: o que falta para virar um jogo de verdade? (o jogador controlar o herói).",
    ],
    errosComuns: ["Apertar as setas sem clicar no palco antes: o teclado continua na página."],
  },
};
