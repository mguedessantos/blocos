import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "se-entao",
  title: "Se... então",
  type: "TEORIA",
  xp: 5,
  content: `# O Bloquinho aprende a pensar

Todo dia você toma decisões: **se** estiver chovendo, **então** leva o guarda-chuva.

Os programas também! O bloco **se ▢ então** só executa os blocos de dentro quando a **condição** for verdadeira.

## As condições

- Têm a forma de um **hexágono** ⬡ e só cabem nos espaços hexagonais.
- **tocando na borda?** é verdadeiro quando o Bloquinho encosta na borda do palco.
- **▢ > ▢**, **▢ < ▢** e **▢ = ▢** comparam números, como **posição x > 100**.

## Se... senão

O bloco **se ▢ então ... senão** tem dois caminhos: um para quando a condição é verdadeira e outro para quando é falsa.`,
  guide: {
    objetivo: "Entender condições (verdadeiro/falso) e o bloco se… então.",
    minutos: 10,
    passos: ["Brinque de “se… então” com a turma: “SE você estiver de tênis, ENTÃO levante a mão”.", "Mostre o formato hexagonal das condições."],
    errosComuns: ["Tentar encaixar uma condição num espaço redondo (não cabe)."],
  },
};
