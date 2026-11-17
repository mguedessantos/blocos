import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "teste-e-corrija",
  title: "Teste e corrija",
  type: "TEORIA",
  xp: 10,
  content: `# Caçando bugs

O Glitch adora jogos que não foram testados! Antes de entregar, confira:

- O jogo **começa certo** toda vez que clico na bandeira? (pontos zerados, atores no lugar)
- Dá para **ganhar** e dá para **perder**?
- Os atores **não saem do palco** sem querer?
- Os **sons** tocam na hora certa?
- Alguém de **fora da equipe** conseguiu jogar sem ajuda?

## Quando algo dá errado

1. **Descubra quando** o bug acontece (sempre? só às vezes?).
2. **Olhe o script** do ator envolvido, bloco por bloco.
3. Mostre os valores no palco: as **variáveis** aparecem no canto do palco enquanto o jogo roda.
4. **Mude uma coisa de cada vez** e teste de novo.`,
  guide: {
    objetivo: "Desenvolver o hábito de testar e depurar de forma organizada.",
    minutos: 15,
    passos: ["Faça “playtests cruzados”: equipes trocam de computador e anotam problemas no jogo da outra."],
    errosComuns: ["Mudar várias coisas ao mesmo tempo e não saber o que resolveu (ou piorou)."],
  },
};
