import { backdrop, game, iff, touching } from "../../../../src/lib/blocks/build";
import { bloquinho, CAMINHO, labirinto, PAREDE, SAIDA } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "labirinto-saida",
  title: "Labirinto 3: encontre a saída",
  type: "EXERCICIO",
  content: `## Missão: a saída

Até agora, a **bandeira de saída** tinha um programa pronto que mostrava o CONCLUÍDO. Ela não tem mais: agora é **você** quem programa a vitória, no Bloquinho.

No **sempre** do Bloquinho, coloque mais um:

**se (tocando em Saída?) então**

- **mude o cenário para Concluído**
- **pare todos**

Depois jogue: passe pelas aberturas sem encostar nas paredes!`,
  allowedBlocks: ["looks_switchbackdropto", "control_stop"],
  starter: game(labirinto(bloquinho(PAREDE), false)),
  checks: {
    maxSeconds: 11,
    inputs: CAMINHO,
    checks: [
      { type: "usesBlock", opcode: "sensing_touchingobject", min: 2, message: "Use também se tocando em Saída.", goal: "Use **tocando em Saída?**" },
      { type: "backdropIs", backdrop: "concluido", message: "Quando o Bloquinho tocar na Saída, mude o cenário para Concluído.", goal: "Na **Saída**, mostre a tela de **CONCLUÍDO**" },
      { type: "stopped", message: "Depois do Concluído, use pare todos.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Programar a condição de vitória do jogo.",
    minutos: 15,
    passos: ["Deixe a turma jogar e contar quantas vezes voltou para o começo.", "Pergunte: como deixar o labirinto mais difícil? (Bloquinho mais rápido, aberturas menores)."],
    errosComuns: ["Mudar o cenário sem pare todos: o jogo continua rodando atrás da tela."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: labirinto(bloquinho(PAREDE, SAIDA), false),
  erros: [
    labirinto(bloquinho(PAREDE, iff(touching("Saída"), backdrop("concluido"))), false), // sem pare todos
  ],
};
