import { heroControls4, TODOS } from "../../blocos/avancado";
import { flag, forever, game, move, pointTowards, rotationLR } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-2-perseguicao",
  title: "Fuga 2: o Glitch persegue",
  type: "EXERCICIO",
  content: `## Etapa 2: perseguição

Agora o Glitch vai correr atrás do Bloquinho.

## Passo a passo

1. Clique no ator **Glitch**.
2. Arraste **quando a bandeira verde for clicada** (Eventos).
3. Embaixo dele, encaixe **defina o estilo de rotação para esquerda-direita** (Movimento). Assim o Glitch só vira para os lados e nunca fica de cabeça para baixo.
4. Embaixo, encaixe um **sempre** (Controle).
5. Dentro do **sempre**, encaixe **aponte para ...** (Movimento) e escolha **Bloquinho** no menu.
6. Embaixo dele, ainda dentro do **sempre**, encaixe **mova 2 passos**.

**Teste:** clique na bandeira verde e fuja com as setas. O Glitch vem atrás, sempre de pé.

> Ajuste a velocidade: rápido demais fica impossível, devagar demais fica sem graça!`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo"],
    sprites: [{ name: "Bloquinho", x: -150, code: [heroControls4()] }, { name: "Glitch", character: "glitch", x: 150, y: 100 }],
  }),
  checks: {
    maxSeconds: 3,
    checks: [
      { type: "inScript", hat: ["event_whenflagclicked"], opcodes: ["motion_setrotationstyle"], label: "Na bandeira do Glitch, defina o estilo de rotação para esquerda-direita", goal: "3. **defina o estilo de rotação para esquerda-direita**" },
      { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "O Glitch aponta para o Bloquinho dentro de um “sempre”", goal: "5. O Glitch **aponta para o Bloquinho** dentro do **sempre**" },
      { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "O Glitch anda dentro do “sempre”", goal: "6. O Glitch **anda** dentro do **sempre**" },
      { type: "walked", sprite: "Glitch", min: 60, message: "O Glitch precisa andar em direção ao Bloquinho.", goal: "Teste: o Glitch **persegue** o Bloquinho" },
    ],
  },
  guide: {
    objetivo: "Criar um inimigo que persegue.",
    minutos: 10,
    passos: ["Discuta equilíbrio de dificuldade: qual velocidade deixa o jogo divertido?"],
    errosComuns: ["Escolher “ponteiro do mouse” em vez de “Bloquinho” no menu.", "Sem o estilo de rotação, o Glitch gira e fica de cabeça para baixo ao perseguir."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4()] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), rotationLR(), forever(pointTowards("Bloquinho"), move(2))]] },
  ] },
  erros: [
    { backdrops: ["castelo"], sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4()] },
      { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(2))]] },
    ] }, // sem o estilo de rotação
  ],
};
