import { heroControls, TODOS } from "../../blocos/avancado";
import { b, changeVar, changeY, flag, forever, game, getVar, gotoXY, iff, lt, n, r, random, setVar, ypos } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonContent, LessonTest } from "../../tipos";

const moeda = (inicio: BlocklyLike[], queda: BlocklyLike, pegou: BlocklyLike[]) => ({
  name: "Moeda", character: "moeda" as const, y: 170,
  code: [[flag(), ...inicio, gotoXY(0, 170), forever(queda, iff(touchingHero(), ...pegou, gotoXY(random(-200, 200), 170)), coinBottom())]],
});
type BlocklyLike = ReturnType<typeof b>;
const cai = (v: BlocklyLike) => b("motion_changeyby", { DY: r(v) });

export const licao: LessonContent = {
  slug: "dificuldade-crescente",
  title: "Dificuldade crescente",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: cada vez mais difícil

Jogos bons começam fáceis e vão ficando difíceis. Neste jogo, a moeda cai sempre na mesma velocidade (**adicione -5 a y**). Vamos guardar a velocidade numa **variável** e deixar a moeda mais rápida a cada moeda pega.

## Passo a passo

1. Clique no ator **Moeda**.
2. Na categoria **Variáveis** (laranja), clique no botão **Criar uma Variável**. Digite **velocidade**, deixe **Para todos os atores** e clique em OK.
3. Embaixo de **quando a bandeira verde for clicada** da Moeda (antes do **sempre**), encaixe **mude [velocidade] para -3**. Escolha **velocidade** no menu e digite **-3**.
4. Dentro do **sempre**, ache o bloco **adicione -5 a y**. Arraste o bloco redondo **velocidade** e solte **em cima do -5**.
5. Dentro do **se tocando em Bloquinho?**, encaixe **adicione -1 a [velocidade]**.

A velocidade começa em **-3** (cai devagar). Cada moeda pega soma **-1**: -4, -5, -6... e a moeda cai cada vez mais rápido!

**Teste:** clique na bandeira verde e pegue algumas moedas. Elas caem cada vez mais rápido.`,
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
      { type: "variables", min: 1, message: "Crie a variável velocidade com o botão Criar uma Variável (em Variáveis).", goal: "2. Crie a variável **velocidade**" },
      { type: "inScript", hat: ["event_whenflagclicked"], opcodes: ["data_setvariableto"], label: "Na bandeira da Moeda, mude velocidade para -3", goal: "3. Na bandeira: **mude velocidade para -3**" },
      { type: "usesBlock", opcode: "data_variable", message: "Solte o bloco redondo velocidade em cima do -5 do adicione a y.", goal: "4. **adicione (velocidade) a y**" },
      { type: "variableEquals", name: "velocidade", value: -4, message: "A primeira moeda cai em cima do Bloquinho: a velocidade precisa ir de -3 para -4. Use adicione -1 a velocidade dentro do se tocando em Bloquinho.", goal: "5. Pegou a moeda: **velocidade -1**" },
    ],
  },
  guide: {
    objetivo: "Usar uma variável para controlar a dificuldade ao longo do jogo.",
    minutos: 20,
    passos: ["Discuta a curva de dificuldade de jogos conhecidos.", "Lembre do Mundo 8: o adicione com número negativo diminui a variável."],
    errosComuns: ["Usar velocidade positiva: a moeda sobe em vez de cair.", "Somar -1 fora do se tocando: a moeda acelera sem parar, mesmo sem ser pega."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], variables: ["velocidade"], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    moeda([setVar("velocidade", n(-3))], cai(getVar("velocidade")), [changeVar("velocidade", n(-1))]),
  ] },
  erros: [
    { backdrops: ["floresta"], variables: ["velocidade"], sprites: [
      { name: "Bloquinho", y: -140, code: [heroControls()] },
      moeda([setVar("velocidade", n(-3))], cai(getVar("velocidade")), [changeVar("velocidade", n(1))]),
    ] }, // +1: a moeda fica mais devagar
  ],
};
