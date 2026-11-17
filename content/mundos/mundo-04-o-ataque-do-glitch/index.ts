import { mundo } from "../tipos";
import * as oGlitchAtacou from "./licoes/o-glitch-atacou";
import * as glitchParaADireita from "./licoes/glitch-para-a-direita";
import * as glitchDoisLados from "./licoes/glitch-dois-lados";
import * as glitchDesvieDosRaios from "./licoes/glitch-desvie-dos-raios";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-ataque-do-glitch",
  title: "Mundo 4 · O Ataque do Glitch",
  description: "Um jogo quase pronto: o Glitch atira raios e você programa o Bloquinho para desviar com as setas do teclado.",
  story: "O Glitch descobriu que o Bloquinho está devolvendo a aura aos mundos e veio atacar! O jogo já está montado, só falta uma coisa: ensinar o Bloquinho a fugir.",
  level: 1,
  order: 4,
  modules: [
    {
      title: "O Glitch chegou",
      lessons: [oGlitchAtacou, glitchParaADireita, glitchDoisLados],
    },
    {
      title: "Desvie dos raios",
      lessons: [glitchDesvieDosRaios],
    },
  ],
});
