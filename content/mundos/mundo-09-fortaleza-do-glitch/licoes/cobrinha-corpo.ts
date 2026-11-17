import { deleteClone, game, wait, whenClone } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { cabeca, cobrinha, COME, CORPO_FIXO, SETAS } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-corpo",
  title: "Cobrinha 2: o corpo aparece",
  type: "EXERCICIO",
  content: `## Missão: dê um corpo para a cobrinha

O corpo é feito de **clones** do ator **Gomo**. O Gomo já cria um clone a cada passo da cabeça. Falta cada clone **aparecer** e depois **sumir**.

## Passo a passo

1. Clique no ator **Gomo** (embaixo do palco).
2. Ache o bloco **quando eu começar como clone**: ele já está na área de código.
3. Arraste **mostre** (Aparência) e encaixe embaixo dele.
4. Arraste **espere 1 seg** (Controle) e encaixe embaixo do **mostre**.
5. Arraste **apague este clone** (Controle) e encaixe embaixo do **espere**.

**Teste:** clique na bandeira verde. Agora a cabeça deixa um rastro de quadradinhos verdes que somem depois de 1 segundo: é o corpo!`,
  allowedBlocks: ["control_start_as_clone", "control_delete_this_clone", "looks_show"],
  starter: game(cobrinha([cabeca(), ...SETAS], [whenClone()], COME)),
  checks: {
    maxSeconds: 2,
    checks: [
      { type: "inScript", hat: ["control_start_as_clone"], opcodes: ["looks_show"], label: "Encaixe mostre embaixo de quando eu começar como clone (no Gomo)", goal: "3. **mostre**" },
      { type: "inScript", hat: ["control_start_as_clone"], opcodes: ["control_wait"], label: "Encaixe espere 1 seg embaixo do mostre", goal: "4. **espere 1 seg**" },
      { type: "inScript", hat: ["control_start_as_clone"], opcodes: ["control_delete_this_clone"], label: "Encaixe apague este clone no fim", goal: "5. **apague este clone**" },
      { type: "clonesAtLeast", min: 5, message: "Clique na bandeira verde: o corpo aparece enquanto a cabeça anda.", goal: "Teste: o corpo aparece atrás da cabeça" },
    ],
  },
  guide: {
    objetivo: "Usar o evento quando eu começar como clone: cada clone aparece, espera e some.",
    minutos: 15,
    passos: [
      "Abra o Gomo junto com a turma e leia o programa pronto: segue a Cabeça, cria um clone, espera um passo.",
      "Pergunte: o que acontece se o clone nunca for apagado? (a cobrinha fica infinita).",
    ],
    errosComuns: ["Montar no ator Cabeça em vez do Gomo.", "Esquecer o mostre: o Gomo original está escondido, então os clones nascem escondidos.", "Colocar o apague este clone antes do espere: o corpo some na hora."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(), ...SETAS], CORPO_FIXO, COME),
  erros: [
    cobrinha([cabeca(), ...SETAS], [whenClone(), wait(1), deleteClone()], COME), // sem o mostre
  ],
};
