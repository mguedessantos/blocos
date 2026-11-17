import { FLAG, IFS, SENSORES } from "../../blocos/intermediario";
import { b, changeVar, changeX, flag, forever, game, goTo, ifEdgeBounce, iff, n, setVar, sound } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "placar-do-jogo",
  title: "Placar do jogo",
  type: "EXERCICIO",
  xp: 25,
  content: `## Missão: conte as moedas

O Bloquinho já está andando pelo palco. Agora programe a **Moeda**:

1. Quando a bandeira for clicada: **mude pontos para 0**.
2. **sempre** → **se tocando em [Bloquinho]? então** → **adicione 1 a pontos**, **toque o som Moeda** e **vá para [posição aleatória]**.

O placar aparece no canto do palco!`,
  allowedBlocks: [...SENSORES, "data_setvariableto", "data_changevariableby", "data_variable"],
  starter: game({
    variables: ["pontos"],
    sprites: [
      { name: "Bloquinho", x: -150, code: [[flag(), forever(changeX(4), ifEdgeBounce())]] },
      { name: "Moeda", character: "moeda", x: 40 },
    ],
  }),
  checks: {
    maxSeconds: 6,
    checks: [
      { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece com “mude pontos para 0” quando a bandeira for clicada" },
      { type: "inside", parent: IFS, child: ["data_changevariableby"], label: "Some pontos dentro de um “se” (quando tocar no Bloquinho)" },
      { type: "variableAtLeast", name: "pontos", min: 1, message: "Quando o Bloquinho passar pela moeda, os pontos precisam subir." },
      { type: "playedSound", sound: "moeda", bonus: true, message: "Bônus: toque o som Moeda ao pegar." },
    ],
  },
  guide: {
    objetivo: "Criar um placar real: inicializar, somar com colisão e exibir.",
    minutos: 20,
    passos: ["Discuta: por que a moeda precisa mudar de lugar depois de pega? (senão soma várias vezes)"],
    errosComuns: ["Pontos subindo sem parar: a moeda não sai do lugar depois de tocada."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { variables: ["pontos"], sprites: [
  { name: "Bloquinho", x: -150, code: [[flag(), forever(changeX(4), b("motion_ifonedgebounce"))]] },
  { name: "Moeda", character: "moeda", x: 40, code: [[flag(), setVar("pontos", n(0)), forever(iff(touchingHero(), changeVar("pontos", n(1)), sound("moeda"), goTo("_random_")))]] },
  ] },
};
