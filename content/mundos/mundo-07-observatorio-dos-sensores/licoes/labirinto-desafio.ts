import { flag, game } from "../../../../src/lib/blocks/build";
import { bloquinho, COM_BATIDA, labirinto, PAREDE, SAIDA } from "../jogo";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "labirinto-desafio",
  title: "Desafio: Labirinto completo",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: Labirinto completo

As paredes e a saída estão no palco, mas o **Bloquinho não tem programa**. Monte o jogo inteiro:

1. Começa em **x: -192, y: -120**.
2. Anda com as **4 setas** (5 passos por vez).
3. Encostou no **Muro**: volta para o começo.
4. Chegou na **Saída**: tela de **CONCLUÍDO** e o jogo para.

Chegue na saída para ver o **CONCLUÍDO**. Depois clique em **Verificar**.`,
  allowedBlocks: [],
  starter: game(labirinto([flag()], false)),
  checks: {
    maxSeconds: 12,
    inputs: COM_BATIDA,
    checks: [
      { type: "usesBlock", opcode: "sensing_keypressed", min: 4, message: "Use as 4 setas com tecla … pressionada?.", goal: "Ande com as **4 setas**" },
      { type: "usesBlock", opcode: "sensing_touchingobject", min: 2, message: "Use tocando em Muro e tocando em Saída.", goal: "Use **tocando em Muro?** e **tocando em Saída?**" },
      { type: "backdropIs", backdrop: "concluido", message: "Chegando na Saída, o jogo mostra o Concluído. Confira: 5 passos por vez e volta para x: -192, y: -120 no muro.", goal: "Chegue na **Saída** e veja o **CONCLUÍDO**" },
      { type: "stopped", message: "Use pare todos na Saída.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Montar sozinho um jogo de labirinto com controle, regra e vitória.",
    minutos: 25,
    passos: ["Deixe a turma jogar o labirinto do colega.", "Pergunte: quais são as três partes do jogo? (controle, regra da parede, vitória)."],
    errosComuns: ["Esquecer o vá para do começo: depois de ganhar, o jogo recomeça já na saída."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: labirinto(bloquinho(PAREDE, SAIDA), false),
  erros: [
    labirinto(bloquinho(SAIDA), false), // sem a regra da parede
  ],
};
