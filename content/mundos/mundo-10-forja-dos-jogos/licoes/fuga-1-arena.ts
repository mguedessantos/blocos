import { heroControls4, TODOS } from "../../blocos/avancado";
import { game } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-1-arena",
  title: "Fuga 1: monte a arena",
  type: "EXERCICIO",
  content: `## Etapa 1: a arena

1. Adicione o **Glitch** (botão **+ Ator**) e coloque-o longe do Bloquinho.
2. Adicione o cenário **Castelo**.
3. O Bloquinho anda nas **4 direções** com o **controle suave**.`,
  allowedBlocks: TODOS,
  starter: game({ sprites: [{ name: "Bloquinho", x: -150 }] }),
  checks: {
    maxSeconds: 2,
    inputs: [{ key: "up arrow", from: 0.1, to: 1.1 }],
    checks: [
      { type: "sprites", min: 2 },
      { type: "backdrops", min: 2 },
      { type: "keys", min: 4, message: "O Bloquinho precisa andar nas 4 direções (4 setas)." },
      { type: "movedBy", axis: "y", min: 80, label: "Segurando a seta para cima, o Bloquinho precisa subir" },
    ],
  },
  guide: {
    objetivo: "Reaproveitar o controle em 4 direções num novo jogo.",
    minutos: 10,
    passos: ["Incentive a copiar a lógica do jogo anterior."],
    errosComuns: ["Usar só 2 direções."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["branco", "castelo"], sprites: [{ name: "Bloquinho", x: -150, code: [heroControls4()] }, { name: "Glitch", character: "glitch", x: 150 }] },
};
