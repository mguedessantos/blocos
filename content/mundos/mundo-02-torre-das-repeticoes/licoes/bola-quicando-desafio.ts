import { BOLA, bolaQuicando } from "../jogo";
import { b, forever, game, move } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "bola-quicando-desafio",
  title: "Desafio: bola quicando",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: faça a bola quicar!

Agora há **duas estrelas**. A bola precisa ir e voltar **sem parar**, passando por elas até somar **10 batidas**.

Dentro do **sempre**, além de **mova 10 passos**, use **se tocar na borda, volte**. Ao chegar em 10 batidas, aparece a tela de **CONCLUÍDO**.`,
  allowedBlocks: BOLA,
  starter: game(bolaQuicando([[-150, 0], [150, 0]], 10)),
  checks: {
    maxSeconds: 20,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["motion_ifonedgebounce"], label: "Use se tocar na borda, volte dentro do sempre", goal: "Use **se tocar na borda, volte** dentro do **sempre**" },
      { type: "variableAtLeast", name: "batidas", min: 10, message: "A bola precisa ir e voltar até somar 10 batidas.", goal: "Some **10 batidas**" },
      { type: "backdropIs", backdrop: "concluido", message: "O jogo termina na tela de CONCLUÍDO.", goal: "Veja a tela de **CONCLUÍDO**" },
    ],
  },
  guide: {
    objetivo: "Combinar sempre e quicar na borda para criar o movimento de um jogo.",
    minutos: 15,
    passos: ["Pergunte: quantas batidas a bola faz em cada ida e volta?", "Desafie a turma a deixar a bola mais rápida."],
    errosComuns: ["Colocar o quicar fora do sempre: ele só funciona uma vez."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: bolaQuicando([[-150, 0], [150, 0]], 10, [forever(move(10), b("motion_ifonedgebounce"))]),
  erros: [
    bolaQuicando([[-150, 0], [150, 0]], 10, [forever(move(10))]),
  ],
};
