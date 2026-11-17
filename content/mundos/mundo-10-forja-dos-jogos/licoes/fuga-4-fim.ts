import { heroControls4, TODOS } from "../../blocos/avancado";
import { b, backdrop, broadcast, flag, forever, game, iff, join, move, n, pointTowards, r, resetTimer, roundOf, say, stopAll, t, timer, whenReceive } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-4-fim",
  title: "Fuga 4: sobreviva!",
  type: "DESAFIO",
  xp: 40,
  content: `# Etapa final: quanto tempo você aguenta?

O palco já tem os cenários **Castelo** e **Tela de fim**.

1. No Bloquinho, na bandeira: **zere o cronômetro** e **mude para o cenário Castelo**.
2. Quando o Bloquinho **receber [pegou]**: **mude para o cenário Tela de fim**, **diga (junte “Você sobreviveu ” com (arredondar (cronômetro)))** e **pare [tudo]**.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo", "fim"],
    sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4()] },
      {
        name: "Glitch", character: "glitch", x: 150, y: 100,
        code: [[flag(), forever(
          b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }),
          iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }), b("event_broadcast", {}, { BROADCAST_OPTION: "pegou" })),
        )]],
      },
    ],
  }),
  checks: {
    maxSeconds: 10,
    checks: [
      { type: "usesBlock", opcode: "sensing_resettimer" },
      { type: "usesBlock", opcode: "sensing_timer" },
      { type: "backdropIs", backdrop: "fim", message: "Quando o Glitch pegar o Bloquinho, mostre a Tela de fim." },
      { type: "stopped" },
      { type: "said", text: "sobreviveu", bonus: true, message: "Bônus: mostre por quanto tempo o jogador sobreviveu." },
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
  solucao: { backdrops: ["castelo", "fim"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4(), [flag(), resetTimer(), backdrop("castelo")], [whenReceive("pegou"), backdrop("fim"), say(r(join(t("Você sobreviveu "), r(roundOf(timer()))))), stopAll()]] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
};
