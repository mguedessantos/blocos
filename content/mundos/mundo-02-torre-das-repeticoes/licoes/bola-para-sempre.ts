import { BOLA, bolaQuicando } from "../jogo";
import { forever, game, move } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "bola-para-sempre",
  title: "Bola 2: rolando para sempre",
  type: "EXERCICIO",
  content: `## Para sempre

Contar quantas vezes repetir dá trabalho. Em jogos, usamos o **sempre**: o que está dentro dele não para nunca.

Troque o repita por **sempre**, com **mova 10 passos** dentro. A bola rola até a borda do palco.`,
  allowedBlocks: BOLA,
  starter: game(bolaQuicando([[100, 0]], 99, [], -200)),
  checks: {
    maxSeconds: 4,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "Coloque o mova dentro do sempre", goal: "Use **sempre** com **mova 10 passos** dentro" },
      { type: "variableAtLeast", name: "batidas", min: 1, message: "A bola precisa passar pela estrela.", goal: "A bola passa pela **estrela**" },
      { type: "finalPosition", sprite: "Bola", x: 240, y: 0, tolerance: 30, message: "A bola precisa rolar até a borda da direita.", goal: "A bola chega na **borda** do palco" },
    ],
  },
  guide: {
    objetivo: "Usar o laço infinito, base de todo jogo.",
    minutos: 10,
    passos: ["Explique que jogos rodam dentro de um sempre: o jogo nunca para sozinho.", "Pergunte: e quando a bola chega na borda?"],
    errosComuns: ["Colocar o sempre embaixo do mova, e não em volta dele."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: bolaQuicando([[100, 0]], 99, [forever(move(10))], -200),
};
