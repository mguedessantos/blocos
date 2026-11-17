import { BROADCAST, heroControls4, IFS, RECEIVE, TODOS } from "../../blocos/avancado";
import { b, broadcast, flag, forever, game, gotoXY, iff, move, n, pointTowards, sayFor, whenReceive } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-3-perigo",
  title: "Fuga 3: perigo!",
  type: "EXERCICIO",
  content: `## Etapa 3: pegou!

1. No **Glitch**, dentro do sempre: **se tocando em [Bloquinho]** → **transmita [pegou]**.
2. No **Bloquinho**: **quando eu receber [pegou]** → **diga “Ai!” por 1 segundo** e **vá para x: -150 y: 0**.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo"],
    sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4()] },
      { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }))]] },
    ],
  }),
  checks: {
    maxSeconds: 8,
    checks: [
      { type: "inside", parent: IFS, child: BROADCAST, label: "Transmita uma mensagem dentro do “se” (quando o Glitch pegar o Bloquinho)" },
      { type: "usesBlock", opcode: RECEIVE },
      { type: "said", text: "Ai" },
    ],
  },
  guide: {
    objetivo: "Usar mensagens para comunicar eventos do jogo.",
    minutos: 10,
    passos: ["Compare: o Glitch poderia fazer tudo sozinho, mas a mensagem deixa o código organizado."],
    errosComuns: ["Nome da mensagem diferente entre transmitir e receber."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4(), [whenReceive("pegou"), sayFor("Ai!", 1), gotoXY(-150, 0)]] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
};
