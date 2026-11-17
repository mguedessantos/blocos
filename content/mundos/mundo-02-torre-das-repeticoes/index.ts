import { mundo } from "../tipos";
import * as porQueRepetir from "./licoes/por-que-repetir";
import * as dezPassinhos from "./licoes/dez-passinhos";
import * as quadradoMagico from "./licoes/quadrado-magico";
import * as triangulo from "./licoes/triangulo";
import * as escada from "./licoes/escada";
import * as bolaRepita from "./licoes/bola-repita";
import * as bolaParaSempre from "./licoes/bola-para-sempre";
import * as bolaQuicandoDesafio from "./licoes/bola-quicando-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-2-torre-das-repeticoes",
  title: "Mundo 2 · Torre das Repetições",
  description: "Repita, sempre e repetições dentro de repetições: figuras, padrões e movimento sem fim.",
  story: "A Torre das Repetições só abre para quem sabe fazer muito com pouco. Cada andar guarda um padrão — descubra-os e a torre volta a brilhar.",
  level: 1,
  order: 2,
  modules: [
    {
      title: "Repetir é poder",
      lessons: [porQueRepetir, dezPassinhos, quadradoMagico, triangulo, escada],
    },
    {
      title: "Jogo: bola quicando",
      lessons: [bolaRepita, bolaParaSempre, bolaQuicandoDesafio],
    },
  ],
});
