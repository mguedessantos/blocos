import { coinFall, heroControls, TODOS } from "../../blocos/avancado";
import { changeY, effect, flag, forever, game, gotoXY, iff, playUntilDone, random, sound } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "sons-e-efeitos",
  title: "Sons e efeitos",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: dê vida ao jogo

Jogos parecem muito melhores com **retorno** para o jogador. Neste mini-jogo de moedas:

1. Toque um som quando o Bloquinho **pega** a moeda (**Moeda**) e outro quando ela **cai no chão** (**Derrota**).
2. Use um **efeito gráfico** (**mude o efeito cor** ou **fantasma**) quando algo acontecer.
3. Bônus: uma **música** de fundo — no **Palco**, **sempre** → **toque o som … até o fim**.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    variables: ["pontos"],
    sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170, code: [coinFall()] }],
  }),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "sounds", min: 2, message: "Use pelo menos 2 sons diferentes." },
      { type: "usesAnyBlock", opcodes: ["looks_changeeffectby", "looks_seteffectto"], label: "Use um efeito gráfico (cor ou fantasma)" },
      { type: "playedSound", message: "Os sons precisam tocar durante o jogo (a primeira moeda cai em cima do Bloquinho)." },
      { type: "inside", parent: ["control_forever"], child: ["sound_playuntildone"], label: "Bônus: música de fundo em um “sempre”", bonus: true },
    ],
  },
  guide: {
    objetivo: "Adicionar retorno audiovisual (“juice”) ao jogo.",
    minutos: 20,
    passos: ["Mostre o mesmo jogo com e sem sons/efeitos e peça para a turma comparar."],
    errosComuns: ["Música com “toque o som” (sem esperar) dentro de sempre: sons se sobrepõem. Use “toque até o fim”."],
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
};
