import { caca, cacaAoTesouro } from "../jogo";
import { gotoXY, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "tesouro-caca-completa",
  title: "Desafio: caça ao tesouro",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: pegue todos os tesouros!

Há **4 moedas** espalhadas pela vila. Pegue **todas** para ver a tela de **CONCLUÍDO**.

- Use a grade para descobrir onde cada moeda está.
- Você pode andar e girar ou pular com **vá para x: y:**.
- Não esqueça de **esperar** um pouco em cada moeda.`,
  ...caca([[100, 100], [-100, 100], [-100, -100], [100, -100]]),
  checks: {
    maxSeconds: 12,
    checks: [
      { type: "variableAtLeast", name: "tesouros", min: 4, message: "Pegue as 4 moedas, esperando um pouco em cada uma.", goal: "Pegue as **4 moedas**" },
      { type: "backdropIs", backdrop: "concluido", message: "O jogo termina na tela de CONCLUÍDO quando as 4 moedas são pegas.", goal: "Veja a tela de **CONCLUÍDO**" },
    ],
  },
  guide: {
    objetivo: "Planejar um caminho com coordenadas para completar um jogo.",
    minutos: 20,
    passos: ["Peça para planejarem a rota no caderno antes de montar os blocos.", "Compare rotas: quem chegou com menos blocos?"],
    errosComuns: ["Trocar x e y.", "Esquecer a espera e uma moeda ficar no palco."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cacaAoTesouro([[100, 100], [-100, 100], [-100, -100], [100, -100]],
  [gotoXY(100, 100), wait(1), gotoXY(-100, 100), wait(1), gotoXY(-100, -100), wait(1), gotoXY(100, -100), wait(1)]),
  erros: [
    cacaAoTesouro([[100, 100], [-100, 100], [-100, -100], [100, -100]], [gotoXY(100, 100), gotoXY(-100, 100), gotoXY(-100, -100), gotoXY(100, -100)]),
  ],
};
