import { mundo } from "../tipos";
import * as caixinhasComNome from "./licoes/caixinhas-com-nome";
import * as placar from "./licoes/placar";
import * as contandoPassos from "./licoes/contando-passos";
import * as calculadora from "./licoes/calculadora";
import * as juntandoPalavras from "./licoes/juntando-palavras";
import * as espiral from "./licoes/espiral";
import * as tabuadaDo3 from "./licoes/tabuada-do-3";
import * as frutasPontos from "./licoes/frutas-pontos";
import * as frutasVidas from "./licoes/frutas-vidas";
import * as frutasFim from "./licoes/frutas-fim";
import * as frutasDesafio from "./licoes/frutas-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-7-cofre-dos-pontos",
  title: "Mundo 8 · Cofre dos Pontos",
  description: "Variáveis e operadores: placar, contadores, contas e textos: o coração de todo jogo. No fim, um Pega-frutas com placar e vidas.",
  story: "O Cofre dos Pontos guardava os placares de todos os jogos do reino, e o Glitch zerou tudo. Aprenda a guardar e calcular valores para reabrir o cofre.",
  level: 2,
  order: 8,
  modules: [
    {
      title: "Guardando informações",
      lessons: [caixinhasComNome, placar, contandoPassos],
    },
    {
      title: "Fazendo contas",
      lessons: [calculadora, juntandoPalavras, espiral, tabuadaDo3],
    },
    {
      title: "Jogo: Pega-frutas",
      lessons: [frutasPontos, frutasVidas, frutasFim, frutasDesafio],
    },
  ],
});
