import { flag, game } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";

export const licao: LessonContent = {
  slug: "um-novo-cenario",
  title: "Um novo cenário",
  type: "EXERCICIO",
  content: `## Missão: troque o fundo do palco

O fundo do palco se chama **cenário**. Hoje ele está todo branco. Vamos colocar uma **Floresta**.

## Passo a passo

1. À direita da lista de atores, ache a coluna **Palco**.
2. Embaixo dela, passe o mouse no botão redondo com uma **imagem**. Aparece **Selecionar Cenário**. Clique nele.
3. Abre a biblioteca de cenários. Clique na **Floresta**.
4. Pronto: o palco agora tem a floresta de fundo!

**Teste:** clique na bandeira verde. Depois clique em **Verificar**.

> Para ver todos os cenários do palco, clique em **Palco** e depois na aba **Cenários**, no alto à esquerda.`,
  allowedBlocks: ["event_whenflagclicked"],
  starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    maxSeconds: 1,
    checks: [
      { type: "backdrops", min: 2, message: "Coloque a Floresta pelo botão Selecionar Cenário (a imagem embaixo de Palco, à direita).", goal: "2 e 3. O palco ganha o cenário **Floresta**" },
    ],
  },
  guide: {
    objetivo: "Adicionar um cenário da biblioteca e saber onde ficam os cenários do palco.",
    minutos: 5,
    passos: ["Mostre a coluna Palco no projetor e o botão Selecionar Cenário embaixo dela."],
    errosComuns: ["Procurar o cenário no botão de atores: os cenários ficam embaixo de Palco, à direita."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag()]] }] },
};
