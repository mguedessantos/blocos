import { TODOS } from "../../blocos/avancado";
import { changeY, createClone, deleteClone, flag, game, gotoXY, hide, random, repeat, show, wait, whenClone } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "exercito-de-clones",
  title: "Exército de clones",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: chuva de meteoros (sem perigo... ainda)

**Clones** são cópias de um ator criadas durante o jogo — perfeitos para tiros, inimigos e moedas. No **Meteoro**:

1. Quando a bandeira for clicada → **esconda** → **repita 5 vezes**: **crie clone de [este ator]** e **espere 0.5 segundos**.
2. **quando eu começar como um clone** → **mostre** → **vá para x: (número aleatório entre -200 e 200) y: 170** → **repita 35 vezes: adicione -10 a y** → **apague este clone**.`,
  allowedBlocks: TODOS,
  starter: game({ backdrops: ["espaco"], sprites: [{ name: "Meteoro", character: "meteoro", y: 170 }] }),
  checks: {
    maxSeconds: 8,
    checks: [
      { type: "usesBlock", opcode: "control_start_as_clone" },
      { type: "usesBlock", opcode: "control_delete_this_clone", message: "Apague os clones quando eles chegarem embaixo (o jogo fica leve)." },
      { type: "clonesAtLeast", min: 3 },
    ],
  },
  guide: {
    objetivo: "Criar e controlar clones.",
    minutos: 20,
    passos: ["Explique: o ator original fica escondido e serve só como “fábrica”.", "Mostre por que apagar os clones que saem da tela."],
    errosComuns: ["Clones que nunca são apagados deixam o jogo lento.", "Criar clones dentro de “sempre” sem espera: centenas de clones de uma vez."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["espaco"], sprites: [{ name: "Meteoro", character: "meteoro", y: 170, code: [
  [flag(), hide(), repeat(5, createClone(), wait(0.5))],
  [whenClone(), show(), gotoXY(random(-200, 200), 170), repeat(35, changeY(-10)), deleteClone()],
  ] }] },
};
