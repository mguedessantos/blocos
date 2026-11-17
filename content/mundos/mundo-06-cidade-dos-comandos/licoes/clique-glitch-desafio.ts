import { flag, game, goTo, whenClicked } from "../../../../src/lib/blocks/build";
import { cliqueNoGlitch, cliques, PULA, SOZINHO } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "clique-glitch-desafio",
  title: "Desafio: Clique no Glitch",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: Clique no Glitch

O placar e o relógio estão prontos, mas o **Glitch não faz nada**. Monte o jogo completo:

1. **Clique** no Glitch: ganha **1 ponto** e ele **pula** para um lugar sorteado.
2. **Sozinho**: a cada segundo, o Glitch pula para outro lugar.

Faça **10 pontos** antes do **tempo** chegar a zero para ver a tela de **CONCLUÍDO**. Se o tempo acabar, aparece a Tela de fim. Depois clique em **Verificar**.`,
  allowedBlocks: [],
  starter: game(cliqueNoGlitch([[flag()]])),
  checks: {
    maxSeconds: 8,
    inputs: cliques(10, 0.5),
    checks: [
      { type: "variableAtLeast", name: "pontos", min: 10, message: "Cada clique no Glitch precisa valer 1 ponto.", goal: "Cada clique vale **1 ponto**" },
      { type: "inside", parent: ["control_forever"], child: ["control_wait"], label: "O Glitch pula sozinho: sempre com espere dentro", goal: "O Glitch **pula sozinho** a cada segundo" },
      { type: "walked", sprite: "Glitch", min: 100, message: "O Glitch precisa pular para lugares sorteados.", goal: "O Glitch pula para lugares **sorteados**" },
      { type: "backdropIs", backdrop: "concluido", message: "Com 10 pontos, o jogo mostra a tela de CONCLUÍDO. Não mude os programas do palco.", goal: "Faça **10 pontos** e veja o **CONCLUÍDO**" },
    ],
  },
  guide: {
    objetivo: "Montar sozinho um jogo de clique com dois scripts no mesmo ator.",
    minutos: 20,
    passos: ["Deixe a turma jogar e comparar quantos segundos sobraram no relógio.", "Pergunte: onde fica o relógio do jogo? (no Palco; abra e mostre o repita até)."],
    errosComuns: ["Colocar o pulo sozinho dentro do script do clique: o Glitch só pula quando é clicado.", "Mexer nos programas do Palco: o relógio e a tela de CONCLUÍDO param de funcionar."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: cliqueNoGlitch([PULA, SOZINHO]),
  erros: [
    cliqueNoGlitch([[whenClicked(), goTo("_random_")], SOZINHO]), // sem pontos
  ],
};
