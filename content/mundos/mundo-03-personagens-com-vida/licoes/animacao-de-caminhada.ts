import { VIDA } from "../../blocos/basico";
import { flag, game, move, nextCostume, repeat, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "animacao-de-caminhada",
  title: "Animação de caminhada",
  type: "EXERCICIO",
  xp: 15,
  content: `## Missão: ande de verdade!

Personagens de jogo parecem andar porque **trocam de fantasia** enquanto se movem. O Bloquinho tem duas fantasias: **parado** e **andando**.

Quando a bandeira for clicada, **repita 10 vezes**:
- **mova 10 passos**
- **próxima fantasia**
- **espere 0.2 segundos**`,
  allowedBlocks: VIDA,
  starter: game({ sprites: [{ name: "Bloquinho", x: -180, code: [[flag()]] }] }),
  checks: {
    checks: [
      { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_nextcostume"], label: "Coloque “próxima fantasia” dentro do repita", goal: "Use **próxima fantasia** dentro do **repita**" },
      { type: "inside", parent: ["control_repeat", "control_forever"], child: ["motion_movesteps", "motion_changexby"], label: "Coloque um bloco de movimento dentro do repita", goal: "Coloque um bloco de **movimento** dentro do **repita**" },
      { type: "inside", parent: ["control_repeat", "control_forever"], child: ["control_wait"], label: "Use uma espera dentro do repita para a animação não ficar rápida demais", goal: "Use **espere** dentro do **repita**" },
      { type: "walked", min: 80, message: "O Bloquinho precisa andar enquanto troca de fantasia.", goal: "O Bloquinho **anda** enquanto troca de fantasia" },
    ],
  },
  guide: {
    objetivo: "Criar animação trocando fantasias em um laço — técnica básica de todo jogo.",
    minutos: 15,
    passos: ["Mostre um desenho animado quadro a quadro (flipbook) para explicar a ideia.", "Testem diferentes tempos de espera: 0.5, 0.2, 0.05."],
    errosComuns: ["Sem espera, a animação fica rápida demais para ver.", "Blocos fora do repita."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", x: -180, code: [[flag(), repeat(10, move(10), nextCostume(), wait(0.2))]] }] },
};
