import { mundo } from "../tipos";
import * as aGrandePane from "./licoes/a-grande-pane";
import * as conhecaOBloquinho from "./licoes/conheca-o-bloquinho";
import * as primeirosPassos from "./licoes/primeiros-passos";
import * as virandoAEsquina from "./licoes/virando-a-esquina";
import * as puleParaCima from "./licoes/pule-para-cima";
import * as puleParaBaixo from "./licoes/pule-para-baixo";
import * as puleParaAEsquerda from "./licoes/pule-para-a-esquerda";
import * as puleParaADireita from "./licoes/pule-para-a-direita";
import * as puleParaOCanto from "./licoes/pule-para-o-canto";
import * as passeioComPausa from "./licoes/passeio-com-pausa";
import * as digaOla from "./licoes/diga-ola";
import * as tesouroPrimeiraMoeda from "./licoes/tesouro-primeira-moeda";
import * as tesouroDobrandoAEsquina from "./licoes/tesouro-dobrando-a-esquina";
import * as tesouroCacaCompleta from "./licoes/tesouro-caca-completa";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-1-vila-do-palco",
  title: "Mundo 1 · Vila do Palco",
  description: "Conheça o Bloquinho e o editor: andar, girar, coordenadas, esperar e falar.",
  story: "A Vila do Palco é onde todo jogo começa — e ela está escura. Ensine o Bloquinho a dar os primeiros passos e acenda as primeiras faíscas de aura.",
  level: 1,
  order: 1,
  modules: [
    {
      title: "Bem-vindo(a), Criador(a)!",
      lessons: [aGrandePane, conhecaOBloquinho],
    },
    {
      title: "Movendo o Bloquinho",
      lessons: [primeirosPassos, virandoAEsquina, puleParaCima, puleParaBaixo, puleParaAEsquerda, puleParaADireita, puleParaOCanto, passeioComPausa, digaOla],
    },
    {
      title: "Jogo: caça ao tesouro",
      lessons: [tesouroPrimeiraMoeda, tesouroDobrandoAEsquina, tesouroCacaCompleta],
    },
  ],
});
