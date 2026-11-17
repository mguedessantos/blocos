import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "caixinhas-com-nome",
  title: "Caixinhas com nome",
  type: "TEORIA",
  xp: 5,
  content: `# Variáveis: caixinhas com nome

Uma **variável** é como uma caixinha com uma etiqueta. Dentro dela você guarda um valor — um número ou um texto — e pode mudar esse valor quando quiser.

Nos jogos, variáveis guardam os **pontos**, as **vidas**, o **tempo**...

## Os blocos

- **mude pontos para ▢**: troca o que está na caixinha.
- **adicione ▢ a pontos**: soma um número ao que já está lá (use números negativos para tirar).
- **pontos** (o bloco redondo): mostra o valor guardado. Você pode encaixá-lo em outros blocos, como **diga** ou **mover**.

> Dica: comece sempre o programa dando um valor inicial, como **mude pontos para 0**.`,
  guide: {
    objetivo: "Entender variável como um valor com nome que pode mudar.",
    minutos: 10,
    passos: ["Use caixas de papel com etiquetas (pontos, vidas) e mude os valores na frente da turma."],
    errosComuns: ["Confundir “mude para” (troca) com “adicione” (soma)."],
  },
};
