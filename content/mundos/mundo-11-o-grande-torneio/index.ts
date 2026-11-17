import { mundo } from "../tipos";
import * as oQueEUmaGameJam from "./licoes/o-que-e-uma-game-jam";
import * as trabalhoEmEquipe from "./licoes/trabalho-em-equipe";
import * as doTemaAIdeia from "./licoes/do-tema-a-ideia";
import * as sonsEEfeitos from "./licoes/sons-e-efeitos";
import * as dificuldadeCrescente from "./licoes/dificuldade-crescente";
import * as testeECorrija from "./licoes/teste-e-corrija";
import * as projetoFinal from "./licoes/projeto-final";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-10-grande-torneio",
  title: "Mundo 11 · O Grande Torneio",
  description: "Prepare-se para a game jam: trabalho em equipe, do tema à ideia, capricho e o projeto final.",
  story: "Chegou a hora do Grande Torneio dos Criadores! Equipes de todo o reino vão criar jogos sobre um tema surpresa, com tempo marcado. É aqui que a aura volta de vez — e o Glitch é derrotado pela criatividade.",
  level: 3,
  order: 11,
  modules: [
    {
      title: "Preparando a equipe",
      lessons: [oQueEUmaGameJam, trabalhoEmEquipe, doTemaAIdeia],
    },
    {
      title: "Capricho de campeão",
      lessons: [sonsEEfeitos, dificuldadeCrescente, testeECorrija],
    },
    {
      title: "A jam de treino",
      lessons: [projetoFinal],
    },
  ],
});
