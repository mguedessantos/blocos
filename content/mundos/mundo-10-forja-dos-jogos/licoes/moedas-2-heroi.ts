import { heroControls, IFS, TODOS } from "../../blocos/avancado";
import { game } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "moedas-2-heroi",
  title: "Moedas 2: mova o herói",
  type: "EXERCICIO",
  content: `## Etapa 2: o controle

Faça o Bloquinho andar para a **direita** e para a **esquerda** com as setas, usando o **controle suave** (sempre + se tecla pressionada).`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    sprites: [{ name: "Bloquinho", y: -140 }, { name: "Moeda", character: "moeda", y: 170 }],
  }),
  checks: {
    maxSeconds: 2,
    inputs: [{ key: "left arrow", from: 0.1, to: 1.1 }],
    checks: [
      { type: "usesBlock", opcode: "sensing_keypressed", min: 2, message: "Use “tecla … pressionada?” para as duas setas." },
      { type: "inside", parent: ["control_forever"], child: IFS, label: "Os controles ficam dentro de um “sempre”" },
      { type: "movedBy", axis: "x", min: -80, label: "Segurando a seta para a esquerda, o Bloquinho precisa andar para a esquerda" },
    ],
  },
  guide: {
    objetivo: "Aplicar o padrão de controle em um projeto real.",
    minutos: 10,
    passos: ["Retome a missão “Controle suave” do Mundo 6."],
    errosComuns: ["Herói saindo da tela: limite o x entre -220 e 220."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170 }] },
};
