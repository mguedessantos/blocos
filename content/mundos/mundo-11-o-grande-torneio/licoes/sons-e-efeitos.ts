import { coinFall, heroControls, TODOS } from "../../blocos/avancado";
import { changeY, effect, flag, forever, game, gotoXY, iff, playUntilDone, random, sound } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonContent, LessonTest } from "../../tipos";

export const licao: LessonContent = {
  slug: "sons-e-efeitos",
  title: "Sons e efeitos",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: dê vida ao jogo

Jogos ficam muito melhores quando o jogador **ouve** e **vê** o que acontece. Neste jogo de moedas, a moeda já cai e volta para o alto. Vamos dar som, cor e música a ele.

## Passo a passo: a moeda

1. Clique no ator **Moeda**.
2. Dentro do **sempre**, embaixo do **adicione -5 a y**, encaixe um **se ⬡ então** (Controle).
3. Arraste **tocando em ...?** (Sensores) para o espaço ⬡ e escolha **Bloquinho** no menu.
4. Dentro desse **se**, encaixe **toque o som Moeda** (Som, rosa).
5. Embaixo dele, encaixe **mude 25 ao efeito cor** (Aparência): a moeda muda de cor.
6. Embaixo dele, encaixe **vá para x: (número aleatório entre -200 e 200) y: 170** (o bloco verde **número aleatório** fica em Operadores): a moeda volta para o alto.
7. Agora ache o outro **se**, o de **posição y < -170** (a moeda chegou no chão). Dentro dele, encaixe **toque o som Derrota**.

## Passo a passo: a música

8. Clique em **Palco** (à direita da lista de atores).
9. Arraste **quando a bandeira verde for clicada** e, embaixo, um **sempre**.
10. Dentro do **sempre**, encaixe **toque o som Vitória até o fim**.

**Teste:** clique na bandeira verde. A música toca, a moeda pega faz som e muda de cor, e a moeda no chão faz outro som.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    variables: ["pontos"],
    sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170, code: [coinFall()] }],
  }),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "playedSound", sound: "moeda", message: "Quando a moeda tocar no Bloquinho, toque o som Moeda (a primeira moeda cai em cima dele).", goal: "2 a 4. Pegou a moeda: som **Moeda**" },
      { type: "usesAnyBlock", opcodes: ["looks_changeeffectby", "looks_seteffectto"], label: "Use mude 25 ao efeito cor quando a moeda for pega", goal: "5. A moeda **muda de cor**" },
      { type: "sounds", min: 2, message: "Toque o som Derrota quando a moeda chegar no chão.", goal: "7. Moeda no chão: som **Derrota**" },
      { type: "inside", parent: ["control_forever"], child: ["sound_playuntildone"], label: "No Palco: sempre com toque o som Vitória até o fim", goal: "8 a 10. **Música** no Palco" },
    ],
  },
  guide: {
    objetivo: "Adicionar retorno de som e imagem ao jogo.",
    minutos: 20,
    passos: ["Mostre o mesmo jogo com e sem sons e efeitos e peça para a turma comparar.", "Lembre que o Palco também tem programas: ele fica à direita da lista de atores."],
    errosComuns: ["Música com toque o som (sem até o fim) dentro do sempre: os sons se sobrepõem. Use toque o som até o fim."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], variables: ["pontos"], stage: [[flag(), forever(playUntilDone("vitoria"))]], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(
      changeY(-5), iff(touchingHero(), sound("moeda"), effect("color", 25), gotoXY(random(-200, 200), 170)), coinBottom(sound("derrota")),
    )]] },
  ] },
  erros: [
    { backdrops: ["floresta"], variables: ["pontos"], sprites: [
      { name: "Bloquinho", y: -140, code: [heroControls()] },
      { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(
        changeY(-5), iff(touchingHero(), sound("moeda"), effect("color", 25), gotoXY(random(-200, 200), 170)), coinBottom(sound("derrota")),
      )]] },
    ] }, // sem a música
  ],
};
