import { BROADCAST, CONTROLS, IFS, RECEIVE, TODOS } from "../../blocos/avancado";
import { backdrop, broadcast, changeVar, changeX, changeY, createClone, flag, forever, game, gotoXY, hide, iff, keyPressed, n, random, show, sound, whenClone, whenReceive } from "../../../../src/lib/blocks/build";
import { coinBottom, touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "projeto-final",
  title: "Projeto final: o jogo da equipe",
  type: "DESAFIO",
  xp: 60,
  content: `# O Grande Torneio de treino

Com a sua equipe, crie aqui no site um jogo completo sobre o tema que o professor anunciar. O jogo precisa ter:

- **Pelo menos 3 atores** e **2 cenários** (início e jogo, ou jogo e fim).
- **Controles** pelo teclado ou mouse.
- Um **placar**, **vidas** ou **tempo** (variável).
- **Mensagens** entre atores.
- Um **ciclo de jogo** (sempre + se).
- **Sons**.

Quando terminar, clique em **Verificar**. Na game jam de verdade, vocês vão enviar pela área de **Jams**!`,
  allowedBlocks: TODOS,
  starter: game({ sprites: [{ name: "Bloquinho" }] }),
  checks: {
    maxSeconds: 5,
    checks: [
      { type: "sprites", min: 3 },
      { type: "backdrops", min: 2 },
      { type: "usesAnyBlock", opcodes: [...CONTROLS, "sensing_mousedown", "event_whenthisspriteclicked", "motion_pointtowards"], label: "O jogador controla o jogo (teclado ou mouse)" },
      { type: "variables", min: 1 },
      { type: "usesAnyBlock", opcodes: BROADCAST, label: "Use mensagens entre atores" },
      { type: "usesBlock", opcode: RECEIVE },
      { type: "inside", parent: ["control_forever"], child: IFS, label: "Tenha um ciclo de jogo (“se” dentro de “sempre”)" },
      { type: "sounds", min: 1 },
      { type: "usesAnyBlock", opcodes: ["control_create_clone_of"], label: "Bônus: use clones", bonus: true },
      { type: "backdrops", min: 3, bonus: true, message: "Bônus: tenha telas de início, jogo e fim." },
    ],
  },
  guide: {
    objetivo: "Aplicar tudo em uma jam de treino, em equipe, com tema e tempo.",
    minutos: 120,
    passos: [
      "Anuncie o tema e o tempo total (sugestão: 2–3 aulas).",
      "Marque checkpoints: fim da 1ª aula = ideia + lista do mínimo + atores; fim da 2ª = jogo jogável; 3ª = capricho e testes.",
      "No fim, faça uma mostra: cada equipe apresenta em 2 minutos e as outras jogam.",
      "Use os critérios da jam (diversão, tema, criatividade, capricho) para dar feedback.",
    ],
    errosComuns: [
      "Equipes que passam a aula toda escolhendo atores: lembre do checkpoint “jogo jogável”.",
      "Só uma pessoa no teclado: reforce o rodízio piloto/copiloto.",
    ],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["inicio", "floresta", "fim"], variables: ["pontos"], sprites: [
  { name: "Bloquinho", y: -140, code: [[flag(), backdrop("floresta"), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))], [whenReceive("pegou"), sound("moeda"), changeVar("pontos", n(1))]] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(changeY(-5), iff(touchingHero(), broadcast("pegou"), gotoXY(random(-200, 200), 170)), coinBottom())]] },
  { name: "Glitch", character: "glitch", x: 150, code: [[flag(), hide(), createClone()], [whenClone(), show()]] },
  ] },
};
