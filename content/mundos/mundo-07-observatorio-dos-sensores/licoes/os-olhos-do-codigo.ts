import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "os-olhos-do-codigo",
  title: "Os olhos do código",
  type: "TEORIA",
  xp: 5,
  content: `# Sensores: o jogo percebendo o mundo

Os blocos **azul-claros** de **Sensores** fazem perguntas ao jogo:

- **tocando em [ator]?**: encostou em alguém (ou na borda)?
- **distância até [ator]**: quão perto algo está.
- **tecla [ ] pressionada?** / **mouse pressionado?**: o que o jogador está fazendo.
- **posição x do mouse** / **posição y do mouse**: onde está o cursor.
- **cronômetro**: quanto tempo passou.

> Quase sempre os sensores ficam dentro de um **se**, dentro de um **sempre**: o jogo fica perguntando o tempo todo.`,
  guide: {
    objetivo: "Conhecer os principais sensores e o padrão sempre + se + sensor.",
    minutos: 10,
    passos: ["Pergunte: em que jogos você já viu algo “perceber” o jogador?"],
    errosComuns: ["Achar que o sensor “avisa” sozinho: ele só responde quando o código pergunta."],
  },
};
