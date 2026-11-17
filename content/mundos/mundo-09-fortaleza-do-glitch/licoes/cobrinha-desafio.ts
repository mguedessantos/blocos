import { changeVar, flag, forever, game, goTo, gotoXY, n, touching, waitUntil, whenClone } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { BATEU, cabeca, cobrinha, COME, CORPO, SETAS, VOLTA } from "../jogo";

export const licao: LessonContent = {
  slug: "cobrinha-desafio",
  title: "Desafio: Cobrinha completa",
  type: "DESAFIO",
  xp: 40,
  content: `# Desafio: Cobrinha completa

Agora você monta a Cobrinha inteira. Já está pronto: o placar (**pontos** 0 e **tamanho** 4), a Tela de fim e o programa do **Gomo** que segue a Cabeça e cria um clone a cada passo. Monte o resto, um ator de cada vez, e teste a cada etapa.

## 1. Cabeça: andar

Embaixo de **quando a bandeira verde for clicada**:

- **vá para x: 0 y: 0**
- **aponte para a direção 90**
- **sempre**

Dentro do **sempre**, nesta ordem:

1. **mova 20 passos**
2. **se tocando em borda? então**: Tela de fim e **pare todos**
3. **se tocando em Gomo? então**: Tela de fim e **pare todos**
4. **espere 0.15 seg** (o tempo de cada passo)

## 2. Cabeça: virar

4 programas, cada um com **quando a tecla ... for pressionada** e **aponte para a direção**:

- seta para cima: **0**
- seta para baixo: **180**
- seta para a direita: **90**
- seta para a esquerda: **-90**

## 3. Gomo: o corpo

Embaixo de **quando eu começar como clone** (já está no Gomo):

1. **mostre**
2. **espere (tamanho × 0.15) seg**
3. **apague este clone**

## 4. Fruta: comer

Embaixo de **quando a bandeira verde for clicada**:

- **vá para x: 60 y: 0**
- **sempre**

Dentro do **sempre**, nesta ordem:

1. **espere até que (tocando em Cabeça?)**: a fruta fica parada esperando a cabeça chegar
2. **adicione 1 a pontos**
3. **adicione 1 a tamanho**
4. **vá para posição aleatória**
5. **repita até que < não < tocando em Gomo? > >** com **vá para posição aleatória** dentro: se a fruta cair em cima do corpo, ela sorteia outro lugar

Jogue até bater: quantas frutas você consegue comer? Depois clique em **Verificar**.`,
  allowedBlocks: [],
  starter: game(cobrinha([[flag()]], [whenClone()], [flag()])),
  checks: {
    maxSeconds: 4,
    inputs: VOLTA,
    checks: [
      { type: "keys", min: 3, message: "Mude a direção da cabeça com as setas.", goal: "1 e 2. A Cabeça **anda** e **vira** com as setas" },
      { type: "variableAtLeast", name: "tamanho", min: 5, message: "A primeira fruta fica em x: 60, y: 0, no caminho da cobrinha: ela precisa somar 1 no tamanho.", goal: "4. Fruta comida: **+1 tamanho**" },
      { type: "inside", parent: ["control_repeat_until"], child: ["motion_goto"], label: "Se a fruta cair em cima do corpo, sorteie de novo: repita até que não tocando em Gomo, vá para posição aleatória", goal: "4. A fruta **nunca aparece em cima do corpo**" },
      { type: "variableAtLeast", name: "pontos", min: 1, message: "A fruta comida também vale 1 ponto.", goal: "4. Fruta comida: **+1 ponto**" },
      { type: "finalPosition", sprite: "Cabeça", x: 40, y: 0, tolerance: 1, message: "Na verificação, a cobrinha dá uma volta curta e bate no próprio corpo: o jogo precisa acabar ali (confira o corpo do Gomo e o tocando em Gomo).", goal: "3. O corpo existe e, se a cabeça **bate nele**, acaba o jogo" },
      { type: "backdropIs", backdrop: "fim", message: "Ao bater, mostre a Tela de fim.", goal: "Ao bater: **Tela de fim** e **pare todos**" },
      { type: "stopped", message: "Use pare todos quando a cobrinha bater.", goal: "Ao bater: **Tela de fim** e **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Montar sozinho um jogo com clones, variáveis, eventos de tecla e condições combinadas.",
    minutos: 40,
    passos: ["Siga as 4 etapas do texto no quadro e peça para testarem ao fim de cada uma.", "Deixe a turma jogar até bater e comparar quem comeu mais frutas."],
    errosComuns: ["Esquecer o espere 0.15 no sempre da Cabeça: ela atravessa o palco num instante.", "Colocar o se do bater fora do sempre."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cobrinha([cabeca(...BATEU), ...SETAS], CORPO, COME),
  erros: [
    cobrinha([cabeca(...BATEU), ...SETAS], CORPO, [flag()]), // sem a fruta
    cobrinha([cabeca(...BATEU), ...SETAS], [whenClone()], COME), // sem corpo: não bate em nada na volta
    cobrinha([cabeca(...BATEU), ...SETAS], CORPO, [flag(), gotoXY(60, 0), forever(waitUntil(touching("Cabeça")), changeVar("pontos", n(1)), changeVar("tamanho", n(1)), goTo("_random_"))]), // fruta pode cair no corpo
  ],
};
