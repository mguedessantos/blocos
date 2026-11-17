import { game } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { BORDA, cabeca, cobrinha, COME, CORPO, NO_CORPO, SETAS, VOLTA } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-bateu",
  title: "Cobrinha 5: cuidado com o corpo",
  type: "EXERCICIO",
  content: `## Missão: bateu no corpo, acabou

A regra da borda já funciona. Falta a segunda regra: a cabeça também não pode bater no **próprio corpo**. Ela é montada igual à primeira, só muda uma escolha no menu.

## Passo a passo

1. Clique no ator **Cabeça**.
2. Arraste um novo **se ⬡ então** (Controle) e encaixe logo **embaixo** do primeiro **se** (ainda antes do **espere**).
3. Arraste **tocando em ...?** (Sensores) para o espaço ⬡ do novo **se**. No menu dele, escolha **Gomo**.
4. Dentro do novo **se**, encaixe **mude o cenário para Tela de fim** (Aparência).
5. Embaixo dele, encaixe **pare todos** (Controle).

Os clones do Gomo também se chamam Gomo, então **tocando em Gomo?** sente o corpo inteiro.

**Teste:** clique na bandeira verde e faça a cobrinha virar para trás, em cima do corpo (por exemplo: seta para cima, depois esquerda, depois baixo). Aparece a **Tela de fim**.`,
  allowedBlocks: ["control_if"],
  starter: game(cobrinha([cabeca(BORDA), ...SETAS], CORPO, COME)),
  checks: {
    maxSeconds: 4,
    inputs: VOLTA,
    checks: [
      { type: "usesBlock", opcode: "control_if", min: 2, message: "Encaixe um segundo se embaixo do primeiro, ainda antes do espere.", goal: "2. Um segundo **se**, embaixo do primeiro" },
      {
        type: "finalPosition", sprite: "Cabeça", x: 40, y: 0, tolerance: 1,
        message: "Na verificação, a cobrinha dá uma volta curta e a cabeça entra no próprio corpo: o jogo precisa acabar ali. Confira se o novo se usa tocando em Gomo, com Tela de fim e pare todos.",
        goal: "3 a 5. **tocando em Gomo?**: bateu no corpo, o jogo acaba",
      },
    ],
  },
  guide: {
    objetivo: "Usar os clones como obstáculo com uma segunda regra de fim de jogo.",
    minutos: 10,
    passos: ["Compare as duas regras lado a lado: só muda a escolha no menu do tocando em.", "Peça para a turma testar dando uma volta curta com as setas."],
    errosComuns: ["Escolher borda de novo no menu em vez de Gomo.", "Colocar a cópia depois do espere: a cabeça só confere no passo seguinte."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(BORDA, NO_CORPO), ...SETAS], CORPO, COME),
  erros: [
    cobrinha([cabeca(BORDA, BORDA), ...SETAS], CORPO, COME), // escolheu borda de novo
  ],
};
