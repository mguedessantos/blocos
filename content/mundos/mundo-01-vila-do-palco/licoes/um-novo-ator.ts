import { flag, game } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";

export const licao: LessonContent = {
  slug: "um-novo-ator",
  title: "Um novo ator",
  type: "EXERCICIO",
  content: `## Missão: chame um amigo para o palco

O Bloquinho está sozinho. Vamos colocar a **Estrela** no palco.

## Passo a passo

1. Embaixo do palco, ache a **lista de atores** (o Bloquinho está nela).
2. No canto da lista, passe o mouse no botão redondo com uma **carinha**. Aparece **Selecione um Ator**. Clique nele.
3. Abre a biblioteca de atores. Clique na **Estrela**.
4. A Estrela aparece no palco e na lista. **Arraste** a Estrela no palco para um canto.
5. Na lista, clique no **Bloquinho** e depois na **Estrela**. Veja que cada ator tem a **sua própria** área de código.

**Teste:** clique na bandeira verde. Depois clique em **Verificar**.

> Errou de ator? Clique na lixeira que aparece no canto do ator escolhido, na lista.`,
  allowedBlocks: ["event_whenflagclicked"],
  starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    maxSeconds: 1,
    checks: [
      { type: "sprites", min: 2, message: "Coloque a Estrela pelo botão Selecione um Ator (a carinha no canto da lista de atores).", goal: "2 e 3. A **Estrela** entra no palco" },
    ],
  },
  guide: {
    objetivo: "Adicionar um ator da biblioteca e entender que cada ator tem o seu próprio código.",
    minutos: 10,
    passos: ["Mostre no projetor onde fica o botão Selecione um Ator: ele só mostra o nome quando o mouse passa por cima.", "Peça para trocarem entre o Bloquinho e a Estrela na lista e verem a área de código mudar."],
    errosComuns: ["Clicar no palco em vez da lista de atores.", "Achar que os blocos sumiram: estão no outro ator. Confira qual ator está com a borda roxa."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [[flag()]] }, { name: "Estrela", character: "estrela", x: 150, y: 100 }] },
};
