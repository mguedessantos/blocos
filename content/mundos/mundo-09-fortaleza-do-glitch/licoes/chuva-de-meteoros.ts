import { BROADCAST, RECEIVE, TODOS } from "../../blocos/avancado";
import { broadcast, changeVar, changeX, changeY, createClone, deleteClone, flag, forever, game, gotoXY, iff, keyPressed, n, random, repeat, say, setVar, show, stopAll, t, wait, whenClone, whenReceive } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "chuva-de-meteoros",
  title: "Crie: chuva de meteoros",
  type: "DESAFIO",
  xp: 40,
  content: `# Sobreviva à chuva

1. O **Bloquinho** anda para os lados com o **controle suave**.
2. O **Meteoro** cria **clones** que caem do alto em posições sorteadas.
3. **Se** um clone de meteoro **tocar** no Bloquinho → **transmita [fim]**.
4. O Bloquinho, **quando receber [fim]**: diz **“Fim de jogo!”** e **pare tudo**.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["espaco"],
    sprites: [{ name: "Bloquinho", y: -140 }, { name: "Meteoro", character: "meteoro", y: 170, visible: false }],
  }),
  checks: {
    maxSeconds: 15,
    checks: [
      { type: "clonesAtLeast", min: 2, message: "O Meteoro precisa criar clones que caem (vários, um de cada vez)." },
      { type: "keys", min: 2, message: "Controle o Bloquinho com as setas." },
      { type: "usesBlock", opcode: "sensing_touchingobject" },
      { type: "usesAnyBlock", opcodes: BROADCAST, label: "Transmita uma mensagem quando o meteoro acertar" },
      { type: "usesBlock", opcode: RECEIVE },
      { type: "variables", min: 1, bonus: true, message: "Bônus: conte os meteoros desviados ou o tempo em uma variável." },
    ],
  },
  guide: {
    objetivo: "Integrar clones, aleatoriedade, controle, colisão e mensagens em um jogo completo.",
    minutos: 45,
    passos: ["Divida em etapas no quadro: herói → meteoro → clones → colisão → fim.", "Peça para testarem a cada etapa antes de seguir."],
    errosComuns: ["O meteoro original (não clone) fica no palco e acerta o herói: deixe o original escondido."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["espaco"], variables: ["desvios"], sprites: [
  { name: "Bloquinho", y: -140, code: [[flag(), setVar("desvios", n(0)), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))], [whenReceive("fim"), say(t("Fim de jogo!")), stopAll()]] },
  { name: "Meteoro", character: "meteoro", y: 170, visible: false, code: [
  [flag(), forever(createClone(), wait(0.5))],
  [whenClone(), gotoXY(random(-200, 200), 170), show(), repeat(35, changeY(-10), iff(touchingHero(), broadcast("fim"))), changeVar("desvios", n(1)), deleteClone()],
  ] },
  ] },
};
