import { mundo } from "../tipos";
import * as planejeSeuJogo from "./licoes/planeje-seu-jogo";
import * as moedas1Cenario from "./licoes/moedas-1-cenario";
import * as moedas2Heroi from "./licoes/moedas-2-heroi";
import * as moedas3Queda from "./licoes/moedas-3-queda";
import * as moedas4Pontos from "./licoes/moedas-4-pontos";
import * as moedas5Vidas from "./licoes/moedas-5-vidas";
import * as fuga1Arena from "./licoes/fuga-1-arena";
import * as fuga2Perseguicao from "./licoes/fuga-2-perseguicao";
import * as fuga3Perigo from "./licoes/fuga-3-perigo";
import * as fuga4Fim from "./licoes/fuga-4-fim";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-9-forja-dos-jogos",
  title: "Mundo 10 · Forja dos Jogos",
  description: "Planeje e construa dois jogos completos, etapa por etapa: Caça-Moedas e Fuga do Glitch.",
  story: "Na Forja dos Jogos, os Criadores transformam blocos em jogos de verdade. Cada etapa concluída devolve aura ao reino e prepara você para o Grande Torneio.",
  level: 3,
  order: 10,
  modules: [
    {
      title: "Jogo 1: Caça-Moedas",
      lessons: [planejeSeuJogo, moedas1Cenario, moedas2Heroi, moedas3Queda, moedas4Pontos, moedas5Vidas],
    },
    {
      title: "Jogo 2: Fuga do Glitch",
      lessons: [fuga1Arena, fuga2Perseguicao, fuga3Perigo, fuga4Fim],
    },
  ],
});
