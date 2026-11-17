import { game, whenKey } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { aponte, cabeca, cobrinha, COME, CORPO, SETAS } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-direcao",
  title: "Cobrinha 1: mude de direção",
  type: "EXERCICIO",
  content: `## Jogo: Cobrinha

Na **Cobrinha**, a cabeça anda **sozinha** para a frente. O jogador só escolhe para onde ela vira. Cada fruta comida deixa a cobrinha maior!

Já está pronto: a **Cabeça** anda (de 20 em 20 passos), o **corpo** aparece atrás dela e a **Fruta** espera para ser comida. Falta só **virar** com as setas.

**Selecione o ator Cabeça** e monte 4 programas pequenos, um para cada seta. Cada programa tem só 2 blocos: **quando a tecla ... for pressionada** (Eventos, amarelo) e, embaixo dele, **aponte para a direção** (Movimento, azul).

- **seta para cima** → aponte para a direção **0**
- **seta para baixo** → aponte para a direção **180**
- **seta para a direita** → aponte para a direção **90**
- **seta para a esquerda** → aponte para a direção **-90**

Clique na bandeira verde, clique no palco e guie a cobrinha até a fruta.`,
  allowedBlocks: ["event_whenkeypressed", "motion_pointindirection"],
  starter: game(cobrinha([cabeca()], CORPO, COME)),
  checks: {
    maxSeconds: 1.6,
    inputs: [
      { key: "up arrow", from: 0.5, to: 0.53 }, { key: "left arrow", from: 0.68, to: 0.71 },
      { key: "down arrow", from: 0.86, to: 0.89 }, { key: "right arrow", from: 1.22, to: 1.25 },
    ],
    checks: [
      { type: "keys", min: 4, message: "Use as 4 setas, cada uma com o seu programa.", goal: "Use as **4 setas**" },
      {
        type: "visits", sprite: "Cabeça", tolerance: 1,
        points: [
          { y: 20, goal: "Seta para **cima**: direção **0**" },
          { x: 40, y: 20, goal: "Seta para a **esquerda**: direção **-90**" },
          { y: -20, goal: "Seta para **baixo**: direção **180**" },
          { x: 60, y: -20, goal: "Seta para a **direita**: direção **90**" },
        ],
      },
    ],
  },
  guide: {
    objetivo: "Usar eventos de tecla e direções (0, 90, 180, -90) para controlar um ator que anda sozinho.",
    minutos: 15,
    passos: ["Desenhe a bússola do palco no quadro: 0 para cima, 90 para a direita, 180 para baixo, -90 para a esquerda.", "Compare com o Mundo 4: lá a seta mudava o x; aqui ela só muda a direção."],
    errosComuns: ["Montar os programas no ator errado: tudo vai na Cabeça.", "Trocar 90 e -90.", "Usar adicione a x: a cobrinha anda torto, porque ela já anda sozinha para a frente."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(), ...SETAS], CORPO, COME),
  erros: [
    cobrinha([cabeca(), [whenKey("up arrow"), aponte(0)], [whenKey("down arrow"), aponte(180)], [whenKey("right arrow"), aponte(-90)], [whenKey("left arrow"), aponte(90)]], CORPO, COME), // trocou 90 e -90
  ],
};
