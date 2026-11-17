import { backdrop, game, iff, touching } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { BORDA, cabeca, cobrinha, COME, CORPO, SETAS } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-borda",
  title: "Cobrinha 4: cuidado com a borda",
  type: "EXERCICIO",
  content: `## Missão: bateu na borda, acabou

Até agora a cobrinha pode bater na borda do palco e nada acontece. Vamos criar a primeira regra de **fim de jogo**.

## Passo a passo

1. Clique no ator **Cabeça**.
2. Procure o **sempre** dela. Dentro dele há dois blocos: **mova 20 passos** e **espere 0.15 seg**.
3. Arraste um **se ⬡ então** (Controle) e encaixe **entre** o **mova** e o **espere**.
4. Arraste **tocando em ...?** (Sensores) e solte no espaço ⬡ do **se**. No menu dele, escolha **borda**.
5. Dentro do **se**, encaixe **mude o cenário para ...** (Aparência) e escolha **Tela de fim**.
6. Embaixo dele, encaixe **pare todos** (Controle).

**Teste:** clique na bandeira verde e deixe a cobrinha ir reto até a borda. Aparece a **Tela de fim** e tudo para.`,
  allowedBlocks: ["sensing_touchingobject", "looks_switchbackdropto", "control_stop"],
  starter: game(cobrinha([cabeca(), ...SETAS], CORPO, COME)),
  checks: {
    maxSeconds: 3,
    checks: [
      { type: "inside", parent: ["control_forever"], child: ["control_if"], label: "Encaixe o se dentro do sempre da Cabeça, entre o mova e o espere", goal: "3 e 4. **se tocando em borda? então**, dentro do **sempre**" },
      { type: "backdropIs", backdrop: "fim", message: "Quando a cabeça tocar na borda, mude o cenário para a Tela de fim.", goal: "5. **mude o cenário para Tela de fim**" },
      { type: "stopped", message: "Depois da Tela de fim, use pare todos.", goal: "6. **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Criar uma regra de fim de jogo com se e um sensor.",
    minutos: 10,
    passos: ["Mostre no projetor onde fica o espaço entre o mova e o espere, dentro do sempre da Cabeça."],
    errosComuns: ["Colocar o se fora do sempre: ele só confere uma vez, no começo.", "Esquecer o pare todos: a Tela de fim aparece, mas a cobrinha continua andando."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(BORDA), ...SETAS], CORPO, COME),
  erros: [
    cobrinha([cabeca(iff(touching("_edge_"), backdrop("fim"))), ...SETAS], CORPO, COME), // sem pare todos
  ],
};
