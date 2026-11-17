import { mundo } from "../tipos";
import * as eventos from "./licoes/eventos";
import * as vooEm4Direcoes from "./licoes/voo-em-4-direcoes";
import * as cliqueEmMim from "./licoes/clique-em-mim";
import * as cliqueGlitchPonto from "./licoes/clique-glitch-ponto";
import * as cliqueGlitchPula from "./licoes/clique-glitch-pula";
import * as cliqueGlitchSozinho from "./licoes/clique-glitch-sozinho";
import * as cliqueGlitchDesafio from "./licoes/clique-glitch-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-5-cidade-dos-comandos",
  title: "Mundo 6 · Cidade dos Comandos",
  description: "Teclado e cliques: dê o controle do jogo para o jogador e monte o Clique no Glitch.",
  story: "Na Cidade dos Comandos, tudo obedece ao teclado e ao clique, mas o Glitch embaralhou os controles. Mostre quem manda e devolva o controle aos jogadores!",
  level: 2,
  order: 6,
  modules: [
    {
      title: "O jogador no controle",
      lessons: [eventos, vooEm4Direcoes, cliqueEmMim],
    },
    {
      title: "Jogo: Clique no Glitch",
      lessons: [cliqueGlitchPonto, cliqueGlitchPula, cliqueGlitchSozinho, cliqueGlitchDesafio],
    },
  ],
});
