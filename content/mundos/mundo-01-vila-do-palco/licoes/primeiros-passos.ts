import { GRID, MOVE } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { move } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "primeiros-passos",
  title: "Ande 100 passos",
  type: "EXERCICIO",
  content: `## Missão: ande até a linha!

O bloco **mova 10 passos** faz o Bloquinho andar. Troque o número para andar mais ou menos.

Encaixe o bloco embaixo da bandeira, clique na **bandeira verde** para testar e, quando o objetivo ficar marcado, clique em **Verificar**.`,
  allowedBlocks: MOVE,
  starter: GRID,
  checks: {
    checks: [
      { type: "finalPosition", x: 100, y: 0, message: "O Bloquinho precisa terminar 100 passos à direita do centro (x: 100).", goal: "Ande **100 passos** para a direita" },
    ],
  },
  guide: {
    objetivo: "Usar evento + movimento e entender que a ordem dos blocos importa.",
    minutos: 10,
    passos: ["Mostre que o bloco precisa ficar encaixado embaixo da bandeira.", "Deixe errar: “e se colocar 10?”. Depois peça 100.", "Mostre que o objetivo fica marcado sozinho quando o programa está certo."],
    errosComuns: ["Bloco solto ao lado da bandeira.", "Digitar 100 no bloco errado (girar)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(move(100)),
};
