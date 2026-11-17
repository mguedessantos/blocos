import { TODOS } from "../../blocos/avancado";
import { backdrop, flag, game } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "moedas-1-cenario",
  title: "Moedas 1: monte o cenário",
  type: "EXERCICIO",
  content: `## Etapa 1: os personagens

1. Adicione uma **Moeda** (botão **+ Ator**) e arraste para o alto do palco.
2. Arraste o **Bloquinho** para baixo: ele é o herói.
3. Adicione o cenário **Floresta** e, quando a bandeira for clicada, **mude para o cenário Floresta**.`,
  allowedBlocks: TODOS,
  starter: game({ sprites: [{ name: "Bloquinho" }] }),
  checks: {
    maxSeconds: 1,
    checks: [
      { type: "sprites", min: 2, message: "Adicione a Moeda com o botão “+ Ator”." },
      { type: "backdrops", min: 2, message: "Adicione o cenário Floresta com o botão “Cenário”." },
      { type: "backdropIs", backdrop: "floresta" },
    ],
  },
  guide: {
    objetivo: "Preparar os recursos do jogo.",
    minutos: 10,
    passos: ["Cada etapa seguinte já começa com a etapa anterior pronta: ninguém fica para trás."],
    errosComuns: ["Esquecer de adicionar o cenário antes de usar o bloco “mude para o cenário”."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag(), backdrop("floresta")]] }, { name: "Moeda", character: "moeda", y: 150 }] },
};
