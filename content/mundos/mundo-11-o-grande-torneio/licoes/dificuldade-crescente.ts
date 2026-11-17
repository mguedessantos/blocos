import { FLAG, heroControls, TODOS } from "../../blocos/avancado";
import { b, changeVar, changeY, flag, forever, game, getVar, gotoXY, iff, lt, n, r, random, setVar, ypos } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "dificuldade-crescente",
  title: "Dificuldade crescente",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: cada vez mais difícil

Jogos bons começam fáceis e vão ficando difíceis. Neste jogo, a moeda cai sempre na mesma velocidade. Vamos mudar isso:

1. Crie a variável **velocidade** (botão **Criar uma variável**).
2. Na bandeira da Moeda: **mude velocidade para 3**.
3. Troque **adicione -5 a y** por **adicione (0 - velocidade) a y** (bloco verde **_ - _**).
4. Quando a moeda tocar no Bloquinho: **adicione 1 a velocidade**.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    sprites: [
      { name: "Bloquinho", y: -140, code: [heroControls()] },
      {
        name: "Moeda", character: "moeda", y: 170,
        code: [[
          flag(), gotoXY(0, 170),
          forever(
            changeY(-5),
            iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }), gotoXY(random(-200, 200), 170)),
            iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170)),
          ),
        ]],
      },
    ],
  }),
  checks: {
    maxSeconds: 4,
    checks: [
      { type: "variables", min: 1 },
      { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece a velocidade com um valor na bandeira" },
      { type: "usesBlock", opcode: "data_variable", message: "Use a variável no movimento (encaixe o bloco redondo da variável)." },
      { type: "variableAtLeast", name: "velocidade", min: 4, message: "Quando a moeda tocar no Bloquinho, a velocidade precisa aumentar (a primeira moeda cai em cima dele)." },
    ],
  },
  guide: {
    objetivo: "Usar variável para controlar a dificuldade ao longo do jogo.",
    minutos: 20,
    passos: ["Discuta a “curva de dificuldade” de jogos conhecidos."],
    errosComuns: ["Velocidade que cresce rápido demais e deixa o jogo impossível em segundos."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], variables: ["velocidade"], sprites: [
  { name: "Bloquinho", y: -140, code: [heroControls()] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("velocidade", n(3)), gotoXY(0, 170), forever(
  b("motion_changeyby", { DY: r(b("operator_subtract", { NUM1: n(0), NUM2: r(getVar("velocidade")) })) }),
  iff(touchingHero(), changeVar("velocidade", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(),
  )]] },
  ] },
};
