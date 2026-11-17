import { GRID, MOVE } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { left, move, repeat, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "quadrado-magico",
  title: "Quadrado mágico",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: ande em quadrado

Faça o Bloquinho andar em um **quadrado** com lados de **100 passos**, voltar para onde começou e depois **sair** do quadrado.

Um quadrado tem **4 lados iguais** e **4 cantos de 90 graus**. Em vez de repetir os mesmos blocos 4 vezes, use o bloco **repita**!

Coloque um **espere** dentro do repita: assim dá para ver o Bloquinho andando, em vez de pular.`,
  allowedBlocks: [...MOVE, "control_repeat", "control_wait"],
  starter: GRID,
  checks: {
    checks: [
      { type: "usesBlock", opcode: "control_repeat", message: "Use o bloco “repita” para não precisar repetir os blocos.", goal: "Use o bloco **repita**" },
      { type: "inside", parent: ["control_repeat"], child: ["control_wait"], label: "Coloque um bloco “espere” dentro do repita", goal: "Coloque um **espere** dentro do **repita**, para ver o Bloquinho andando" },
      {
        type: "visits",
        points: [
          { x: 100, y: 0, goal: "Chegue no **1º canto** (x: 100, y: 0)" },
          { x: 100, y: 100, goal: "Chegue no **2º canto** (x: 100, y: 100)" },
          { x: 0, y: 100, goal: "Chegue no **3º canto** (x: 0, y: 100)" },
          { x: 0, y: 0, goal: "Volte para o **começo** (x: 0, y: 0)" },
          { x: 50, y: 0, goal: "Depois do **repita**, ande **50 passos** para sair do quadrado" },
        ],
        tolerance: 5,
      },
      { type: "maxBlocks", max: 6, bonus: true, message: "Um programa caprichado usa só 6 blocos no total.", goal: "Use só **6 blocos** no total" },
    ],
  },
  guide: {
    objetivo: "Descobrir o padrão de um quadrado (4 × andar + girar 90).",
    minutos: 15,
    passos: ["Peça para desenharem o caminho no caderno e contarem quantas vezes repetem os mesmos movimentos."],
    errosComuns: ["Colocar o giro fora do repita.", "Girar 45 em vez de 90."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(repeat(4, move(100), wait(0.5), left(90)), move(50)),
  erros: [
    one(move(100), left(90), move(100), left(90), move(100), left(90), move(100), left(90)),
  ],
};
