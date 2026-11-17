import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "por-que-repetir",
  title: "Por que repetir?",
  type: "TEORIA",
  xp: 5,
  content: `# Programadores são preguiçosos (do jeito bom!)

Imagine que você quer que o Bloquinho ande **10 passinhos**. Você poderia colocar 10 blocos iguais, um embaixo do outro... mas isso dá trabalho e é fácil errar.

O bloco **repita** resolve isso: tudo o que fica **dentro** dele acontece várias vezes.

## Como usar

- Arraste o bloco **repita 10 vezes** (ele parece uma boca aberta).
- Coloque os blocos que você quer repetir **dentro** da boca.
- Troque o número para escolher quantas vezes repetir.

> Dica: quando você perceber que está copiando os mesmos blocos várias vezes, pense no **repita**!`,
  guide: {
    objetivo: "Entender por que laços evitam blocos repetidos.",
    minutos: 5,
    passos: ["Pergunte: como você explicaria a um amigo “pule 20 vezes”? Você fala 20 vezes “pule”?"],
    errosComuns: ["Achar que o repita “repete o programa todo”: só repete o que está DENTRO."],
  },
};
