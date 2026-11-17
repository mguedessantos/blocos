import { game } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { cabeca, cobrinha, COME, CORPO, CORPO_FIXO, SETAS } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-cresce",
  title: "Cobrinha 3: a cobrinha aumenta",
  type: "EXERCICIO",
  content: `## Missão: comeu, cresceu

Agora o corpo existe, mas tem sempre o mesmo tamanho. Na Cobrinha, cada fruta deixa ela **maior**.

O segredo está no **espere**: quanto mais tempo cada pedaço fica no palco, mais comprida fica a cobrinha. A variável **tamanho** já aumenta quando a cobrinha come uma fruta. Vamos usar ela no lugar do **1**.

## Passo a passo

1. Clique no ator **Gomo**.
2. Arraste o bloco **( ) × ( )** (Operadores, verde) e solte **dentro** do **primeiro** do **espere 1 seg**.
3. Arraste **tamanho** (Variáveis, laranja) e solte no **primeiro** espaço do **×**.
4. Clique no **segundo** espaço do **×** e digite **0.15**.

O bloco fica assim: **espere (tamanho × 0.15) seg**.

**Teste:** clique na bandeira verde e coma uma fruta. A cobrinha fica maior a cada fruta!`,
  allowedBlocks: ["operator_multiply", "data_variable"],
  starter: game(cobrinha([cabeca(), ...SETAS], CORPO_FIXO, COME)),
  checks: {
    maxSeconds: 2,
    checks: [
      { type: "inScript", hat: ["control_start_as_clone"], opcodes: ["operator_multiply"], label: "Solte o bloco × dentro do 1 do espere", goal: "2. O **×** dentro do **espere**" },
      { type: "inScript", hat: ["control_start_as_clone"], opcodes: ["data_variable"], label: "Coloque a variável tamanho dentro do ×", goal: "3 e 4. **tamanho × 0.15**" },
    ],
  },
  guide: {
    objetivo: "Usar uma variável dentro de uma conta para mudar o comportamento do jogo.",
    minutos: 10,
    passos: [
      "Mostre no projetor como soltar um bloco redondo em cima de um número.",
      "Explique a conta: a cobrinha anda um passo a cada 0.15 segundo; com tamanho 4, cada pedaço fica 4 passos no palco, então o corpo tem 4 pedaços.",
    ],
    errosComuns: ["Soltar o × fora do espere, solto na área de código.", "Escrever 15 em vez de 0.15: o corpo fica gigante."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(), ...SETAS], CORPO, COME),
};
