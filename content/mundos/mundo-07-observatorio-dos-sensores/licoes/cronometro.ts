import { SENSORES } from "../../blocos/intermediario";
import { flag, game, r, resetTimer, roundOf, say, timer, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "cronometro",
  title: "Cronômetro",
  type: "EXERCICIO",
  content: `## Missão: quanto tempo passou?

1. **zere o cronômetro**
2. **espere 2 segundos**
3. **diga (arredondar (cronômetro))**

O Bloquinho vai dizer **2**!`,
  allowedBlocks: [...SENSORES],
  starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
  checks: {
    maxSeconds: 4,
    checks: [
      { type: "usesBlock", opcode: "sensing_resettimer" },
      { type: "usesBlock", opcode: "sensing_timer" },
      { type: "said", text: "2" },
    ],
  },
  guide: {
    objetivo: "Medir tempo, base de corridas e de jogos de sobrevivência.",
    minutos: 10,
    passos: ["Mostre o que acontece sem o “arredondar”: aparecem casas decimais."],
    errosComuns: ["Não zerar o cronômetro no início."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [{ name: "Bloquinho", code: [[flag(), resetTimer(), wait(2), say(r(roundOf(timer())))]] }] },
};
