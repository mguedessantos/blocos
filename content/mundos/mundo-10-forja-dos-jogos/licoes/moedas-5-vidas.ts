import { FLAG, heroControls, TODOS } from "../../blocos/avancado";
import { b, backdrop, changeVar, changeY, eq, flag, forever, game, getVar, gotoXY, iff, lt, n, r, random, setVar, stopAll, ypos } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "moedas-5-vidas",
  title: "Moedas 5: vidas e fim de jogo",
  type: "DESAFIO",
  xp: 40,
  content: `# Etapa final: vidas e fim

As variáveis **pontos** e **vidas** já existem, e o palco já tem os cenários **Concluído** e **Tela de fim**. Todo jogo bom dá para **ganhar** e para **perder**:

1. Na bandeira: **mude vidas para 3**.
2. Se a moeda chegar ao chão **sem ser pega** (no “se posição y < -170”), **adicione -1 a vidas**.
3. No Bloquinho, num **sempre**:

- **se vidas = 0** → **mude o cenário para Tela de fim** e **pare todos** (perdeu).
- **se pontos = 10** → **mude o cenário para Concluído** e **pare todos** (ganhou!).

Pegue 10 moedas para ver o **CONCLUÍDO**. Parabéns: você fez um jogo completo!`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["floresta", "concluido", "fim"],
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
      { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece as vidas com 3 na bandeira", goal: "Na bandeira: **mude vidas para 3**" },
      { type: "variableEquals", name: "vidas", value: 0, message: "Cada moeda que cai no chão tira 1 vida; o jogo acaba com 0. (Na verificação o Bloquinho fica parado e deixa as moedas caírem.)", goal: "Moeda no chão: **-1 vida**" },
      { type: "backdropIs", backdrop: "fim", message: "Quando as vidas acabarem, mude o cenário para a Tela de fim.", goal: "**0 vidas**: Tela de fim (perdeu)" },
      { type: "stopped", message: "Quando as vidas acabarem, use pare todos.", goal: "O jogo para com **pare todos**" },
      { type: "usesBlock", opcode: "looks_switchbackdropto", min: 2, message: "Falta o jeito de ganhar: com 10 pontos, mude o cenário para Concluído e pare todos.", goal: "**10 pontos**: Concluído (ganhou!)" },
    ],
  },
  guide: {
    objetivo: "Fechar o ciclo do jogo com condição de derrota.",
    minutos: 25,
    passos: ["Faça uma rodada de “teste dos colegas”: cada um joga o jogo do vizinho e dá uma dica."],
    errosComuns: ["Conferir vidas = 0 só uma vez, fora do sempre.", "Tirar vida no lugar errado (quando pega a moeda).", "Esquecer o jeito de ganhar: o jogo só acaba quando o jogador perde."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta", "concluido", "fim"], variables: ["pontos", "vidas"], sprites: [
  { name: "Bloquinho", y: -140, code: [heroControls(), [flag(), setVar("vidas", n(3)), forever(
  iff(eq(r(getVar("vidas")), n(0)), backdrop("fim"), stopAll()), iff(eq(r(getVar("pontos")), n(10)), backdrop("concluido"), stopAll()),
  )]] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
  changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(changeVar("vidas", n(-1))),
  )]] },
  ] },
  erros: [
    { backdrops: ["floresta", "concluido", "fim"], variables: ["pontos", "vidas"], sprites: [
      { name: "Bloquinho", y: -140, code: [heroControls(), [flag(), setVar("vidas", n(3)), forever(iff(eq(r(getVar("vidas")), n(0)), backdrop("fim"), stopAll()))]] },
      { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
        changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(changeVar("vidas", n(-1))),
      )]] },
    ] }, // sem o jeito de ganhar
  ],
};
