import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "conheca-o-bloquinho",
  title: "Conheça o Bloquinho",
  type: "TEORIA",
  xp: 5,
  content: `# Oi! Eu sou o Bloquinho

Eu sou um personagem que obedece **blocos de programação**. Você encaixa os blocos, um embaixo do outro, e eu faço cada um deles **na ordem**, de cima para baixo.

## Como funciona

- Todo programa começa com o bloco **quando a bandeira verde for clicada**.
- Os blocos de **Movimento** (azuis) me fazem andar e girar.
- Quando terminar, clique na **bandeira verde** acima da minha caixa para me ver em ação.
- Clique em **Verificar** para saber se você completou o desafio e ganhar estrelas.

> Dica: programar é tentar, ver o que acontece e ajustar. Errar faz parte!`,
  guide: {
    objetivo: "Conhecer o editor: área de blocos, palco, bandeira verde e Verificar.",
    minutos: 10,
    passos: [
    "Projete o editor e mostre cada parte: categorias de blocos, área de montagem, palco e botões.",
    "Mostre que os blocos precisam ficar ENCAIXADOS embaixo do bloco amarelo para funcionar.",
    ],
    errosComuns: ["Achar que “Verificar” só mostra o resultado: ele confere a missão e dá as estrelas."],
  },
};
