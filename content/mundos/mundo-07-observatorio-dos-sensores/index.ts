import { mundo } from "../tipos";
import * as osOlhosDoCodigo from "./licoes/os-olhos-do-codigo";
import * as bati from "./licoes/bati";
import * as radar from "./licoes/radar";
import * as sigaOMouse from "./licoes/siga-o-mouse";
import * as cronometro from "./licoes/cronometro";
import * as labirintoSetas from "./licoes/labirinto-setas";
import * as labirintoParedes from "./licoes/labirinto-paredes";
import * as labirintoSaida from "./licoes/labirinto-saida";
import * as labirintoDesafio from "./licoes/labirinto-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-6-observatorio-dos-sensores",
  title: "Mundo 7 · Observatório dos Sensores",
  description: "Colisões, distância, mouse e cronômetro: faça o jogo perceber o mundo e monte um labirinto.",
  story: "No Observatório dos Sensores, cada instrumento sente uma parte do mundo do jogo. O Glitch cobriu as lentes de poeira: limpe uma a uma e seus jogos vão enxergar tudo.",
  level: 2,
  order: 7,
  modules: [
    {
      title: "Os olhos do código",
      lessons: [osOlhosDoCodigo, bati, radar, sigaOMouse, cronometro],
    },
    {
      title: "Jogo: Labirinto",
      lessons: [labirintoSetas, labirintoParedes, labirintoSaida, labirintoDesafio],
    },
  ],
});
