import { mundo } from "../tipos";
import * as seEntao from "./licoes/se-entao";
import * as bateEVolta from "./licoes/bate-e-volta";
import * as direitaOuEsquerda from "./licoes/direita-ou-esquerda";
import * as voltaAoMundo from "./licoes/volta-ao-mundo";
import * as eOuNao from "./licoes/e-ou-nao";
import * as ateABorda from "./licoes/ate-a-borda";
import * as pongRaquete from "./licoes/pong-raquete";
import * as pongPerdeu from "./licoes/pong-perdeu";
import * as pongRebate from "./licoes/pong-rebate";
import * as pongDesafio from "./licoes/pong-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-4-ponte-das-decisoes",
  title: "Mundo 5 · Ponte das Decisões",
  description: "Se… então, senão, e/ou/não e repetir até: ensine o Bloquinho a tomar decisões e monte um Pong.",
  story: "A Ponte das Decisões desmoronou: o Glitch apagou a capacidade dos blocos de escolher. Reconstrua cada tábua ensinando o Bloquinho a pensar “se isso, então aquilo”.",
  level: 2,
  order: 5,
  modules: [
    {
      title: "Tomando decisões",
      lessons: [seEntao, bateEVolta, direitaOuEsquerda, voltaAoMundo],
    },
    {
      title: "Condições combinadas",
      lessons: [eOuNao, ateABorda],
    },
    {
      title: "Jogo: Pong",
      lessons: [pongRaquete, pongPerdeu, pongRebate, pongDesafio],
    },
  ],
});
