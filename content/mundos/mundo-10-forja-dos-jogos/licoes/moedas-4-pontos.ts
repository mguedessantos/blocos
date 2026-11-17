import { coinFall, FLAG, heroControls, IFS, TODOS } from "../../blocos/avancado";
import { changeVar, changeY, flag, forever, game, gotoXY, iff, n, random, setVar, sound } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "moedas-4-pontos",
  title: "Moedas 4: pegou! +1",
  type: "EXERCICIO",
  content: `## Etapa 4: o placar

A variável **pontos** já existe. Na **Moeda**:

1. Na bandeira: **mude pontos para 0** (antes do sempre).
2. Dentro do sempre: **se tocando em [Bloquinho]** → **adicione 1 a pontos**, **toque o som Moeda** e volte para o alto em um x sorteado.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    variables: ["pontos"],
    sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170, code: [coinFall()] }],
  }),
  checks: {
    maxSeconds: 4,
    checks: [
      { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Zere os pontos quando a bandeira for clicada", goal: "Na bandeira: **mude pontos para 0**" },
      { type: "inside", parent: IFS, child: ["data_changevariableby"], label: "Some pontos quando a moeda tocar no herói", goal: "Tocou no Bloquinho: **+1 ponto**" },
      { type: "variableAtLeast", name: "pontos", min: 1, message: "A primeira moeda cai em cima do Bloquinho: os pontos precisam subir.", goal: "A primeira moeda vale **1 ponto**" },
      { type: "playedSound", sound: "moeda", message: "Toque o som Moeda quando pegar a moeda.", goal: "Toque o som **Moeda** ao pegar" },
    ],
  },
  guide: {
    objetivo: "Integrar colisão e placar.",
    minutos: 15,
    passos: ["Lembre do problema dos pontos “infinitos”: a moeda precisa sair do herói depois de contar."],
    errosComuns: ["A moeda soma vários pontos de uma vez porque continua tocando no herói."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], variables: ["pontos"], sprites: [
  { name: "Bloquinho", y: -140, code: [heroControls()] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
  changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), sound("moeda"), gotoXY(random(-200, 200), 170)), coinBottom(),
  )]] },
  ] },
};
