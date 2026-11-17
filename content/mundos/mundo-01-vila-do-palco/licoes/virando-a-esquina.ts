import { GRID, MOVE } from "../../blocos/primeiros-passos";
import { one } from "../../teste";
import { left, move } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "virando-a-esquina",
  title: "Virando a esquina",
  type: "EXERCICIO",
  content: `## Missão: vire a esquina

Girar **90 graus** é virar uma esquina. Para virar à esquerda, use **gire ↺ 90 graus**.

Cumpra os objetivos **na ordem**: um bloco para cada objetivo. Eles vão sendo marcados enquanto você monta.`,
  allowedBlocks: MOVE,
  starter: GRID,
  checks: {
    checks: [
      {
        type: "visits",
        points: [
          { x: 100, y: 0, goal: "Ande **100 passos** para a direita" },
          { dir: 0, goal: "Gire **↺ 90 graus** para olhar para cima" },
          { x: 100, y: 100, goal: "Ande **100 passos** para cima" },
        ],
        tolerance: 5,
      },
    ],
  },
  guide: {
    objetivo: "Combinar andar e girar; entender 90 graus como uma esquina.",
    minutos: 10,
    passos: ["Peça para um aluno “ser o robô” na sala enquanto a turma dá os comandos.", "Pergunte: girar para a direita ou para a esquerda?"],
    errosComuns: ["Girar para o lado errado (↻ em vez de ↺)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: one(move(100), left(90), move(100)),
};
