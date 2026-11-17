import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "atores-e-cenarios",
  title: "Atores e cenários",
  type: "TEORIA",
  xp: 5,
  content: `# Seu palco, seus personagens

Até agora, só o Bloquinho estava no palco. A partir de agora você pode ter **vários atores**!

## No painel “Atores e palco”

- **+ Ator**: escolhe um personagem novo (moeda, estrela, Glitch, nave...).
- Clique em um ator para ver e montar **os blocos dele**. Cada ator tem o **seu próprio código**!
- Arraste os atores no palco para escolher **onde eles começam**.
- **Palco**: escolha os **cenários** (fundos) com o botão **Cenário**.

## Fantasias e sons

- Cada ator tem **fantasias** (imagens diferentes). Trocando rápido, parece que ele se mexe!
- Os blocos **rosa** tocam **sons**.`,
  guide: {
    objetivo: "Entender que cada ator tem seu próprio código, fantasias e posição.",
    minutos: 10,
    passos: ["Mostre o painel de atores: adicionar, selecionar, renomear e arrastar no palco.", "Mostre que, ao trocar de ator, a área de blocos muda."],
    errosComuns: ["Montar os blocos no ator errado: confira o nome em “Blocos de:” acima da área."],
  },
};
