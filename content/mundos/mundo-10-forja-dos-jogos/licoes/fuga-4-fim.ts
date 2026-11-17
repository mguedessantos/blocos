import { heroControls4, TODOS } from "../../blocos/avancado";
import { b, backdrop, broadcast, flag, forever, game, gt, iff, join, move, n, pointTowards, r, resetTimer, rotationLR, roundOf, say, stopAll, t, timer, whenReceive } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-4-fim",
  title: "Fuga 4: sobreviva!",
  type: "DESAFIO",
  xp: 40,
  content: `# Etapa final: quanto tempo você aguenta?

O palco já tem os cenários **Castelo**, **Concluído** e **Tela de fim**. Quem aguentar **20 segundos** sem ser pego, ganha!

1. No Bloquinho, na bandeira: **zere o cronômetro**, **mude para o cenário Castelo** e, num **sempre**: **se cronômetro > 20** → **mude o cenário para Concluído** e **pare todos** (ganhou!).
2. Quando o Bloquinho **receber [pegou]**: **mude para o cenário Tela de fim**, **diga (junte “Você sobreviveu ” com (arredondar (cronômetro)))** e **pare todos** (perdeu).`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo", "concluido", "fim"],
    sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4()] },
      {
        name: "Glitch", character: "glitch", x: 150, y: 100,
        code: [[flag(), rotationLR(), forever(
          b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }),
          iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }), b("event_broadcast", {}, { BROADCAST_OPTION: "pegou" })),
        )]],
      },
    ],
  }),
  checks: {
    maxSeconds: 10,
    checks: [
      { type: "usesBlock", opcode: "sensing_resettimer", message: "Na bandeira, zere o cronômetro.", goal: "Na bandeira: **zere o cronômetro**" },
      { type: "backdropIs", backdrop: "fim", message: "Quando o Glitch pegar o Bloquinho, mostre a Tela de fim.", goal: "Pego pelo Glitch: **Tela de fim** (perdeu)" },
      { type: "stopped", message: "Quando o Glitch pegar o Bloquinho, use pare todos.", goal: "O jogo para com **pare todos**" },
      { type: "said", text: "sobreviveu", message: "Mostre por quanto tempo o jogador sobreviveu: diga (junte “Você sobreviveu ” com arredondar cronômetro).", goal: "Diga **Você sobreviveu** e o tempo" },
      { type: "usesBlock", opcode: "sensing_timer", min: 2, message: "Falta o jeito de ganhar: num sempre, se cronômetro > 20, mude o cenário para Concluído e pare todos.", goal: "**20 segundos**: Concluído (ganhou!)" },
    ],
  },
  guide: {
    objetivo: "Completar um segundo jogo com telas e pontuação por tempo.",
    minutos: 30,
    passos: ["Organize um “mini-torneio”: quem sobrevive mais tempo nos jogos dos colegas?"],
    errosComuns: ["Esquecer de voltar ao cenário Castelo quando o jogo recomeça."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo", "concluido", "fim"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4(), [flag(), resetTimer(), backdrop("castelo"), forever(iff(gt(r(timer()), n(20)), backdrop("concluido"), stopAll()))], [whenReceive("pegou"), backdrop("fim"), say(r(join(t("Você sobreviveu "), r(roundOf(timer()))))), stopAll()]] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), rotationLR(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
  erros: [
    { backdrops: ["castelo", "concluido", "fim"], sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4(), [flag(), resetTimer(), backdrop("castelo")], [whenReceive("pegou"), backdrop("fim"), say(r(join(t("Você sobreviveu "), r(roundOf(timer()))))), stopAll()]] },
      { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), rotationLR(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
    ] }, // sem o jeito de ganhar
  ],
};
