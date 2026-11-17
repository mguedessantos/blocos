import { FLAG, heroControls, TODOS } from "../../blocos/avancado";
import { b, changeVar, changeY, eq, flag, forever, game, getVar, gotoXY, iff, lt, n, r, random, say, setVar, stopAll, t, ypos } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "moedas-5-vidas",
  title: "Moedas 5: vidas e fim de jogo",
  type: "DESAFIO",
  xp: 40,
  content: `# Etapa final: vidas e fim

As variáveis **pontos** e **vidas** já existem.

1. Na bandeira: **mude vidas para 3**.
2. Se a moeda chegar ao chão **sem ser pega** (no “se posição y < -170”), **adicione -1 a vidas**.
3. No Bloquinho: **sempre** → **se vidas = 0** → **diga “Fim de jogo!”** e **pare [tudo]**.

Parabéns: você fez um jogo completo!`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta"],
    variables: ["pontos", "vidas"],
    sprites: [
      { name: "Bloquinho", y: -140, code: [heroControls()] },
      {
        name: "Moeda", character: "moeda", y: 170,
        code: [[
          flag(), b("data_setvariableto", { VALUE: n(0) }, { VARIABLE: { id: "v_pontos" } }), gotoXY(0, 170),
          forever(
            changeY(-5),
            iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }),
              b("data_changevariableby", { VALUE: n(1) }, { VARIABLE: { id: "v_pontos" } }), gotoXY(random(-200, 200), 170)),
            iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170)),
          ),
        ]],
      },
    ],
  }),
  checks: {
    maxSeconds: 40,
    checks: [
      { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece as vidas com 3 na bandeira" },
      { type: "usesAnyBlock", opcodes: ["operator_equals", "operator_lt"], label: "Compare as vidas com 0" },
      { type: "said", text: "Fim" },
      { type: "stopped", message: "Quando as vidas acabarem, use “pare tudo”. (Na verificação o Bloquinho fica parado e deixa as moedas caírem.)" },
    ],
  },
  guide: {
    objetivo: "Fechar o ciclo do jogo com condição de derrota.",
    minutos: 25,
    passos: ["Faça uma rodada de “teste dos colegas”: cada um joga o jogo do vizinho e dá uma dica."],
    errosComuns: ["Conferir vidas = 0 só uma vez, fora do sempre.", "Tirar vida no lugar errado (quando pega a moeda)."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], variables: ["pontos", "vidas"], sprites: [
  { name: "Bloquinho", y: -140, code: [heroControls(), [flag(), setVar("vidas", n(3)), forever(iff(eq(r(getVar("vidas")), n(0)), say(t("Fim de jogo!")), stopAll()))]] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
  changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(changeVar("vidas", n(-1))),
  )]] },
  ] },
};
