import { mundo } from "../tipos";
import * as atoresECenarios from "./licoes/atores-e-cenarios";
import * as umAmigoNoPalco from "./licoes/um-amigo-no-palco";
import * as animacaoDeCaminhada from "./licoes/animacao-de-caminhada";
import * as troqueOCenario from "./licoes/troque-o-cenario";
import * as sonsNoPalco from "./licoes/sons-no-palco";
import * as corridaAnimada from "./licoes/corrida-animada";
import * as corridaLargada from "./licoes/corrida-largada";
import * as corridaContraOGlitch from "./licoes/corrida-contra-o-glitch";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-3-personagens-com-vida",
  title: "Mundo 3 · Personagens com Vida",
  description: "Vários atores, fantasias, animação, cenários e sons: dê vida às suas histórias.",
  story: "No Mundo dos Personagens, todos ficaram parados e mudos com a Grande Pane. Dê a eles movimento, roupas, cenários e voz!",
  level: 1,
  order: 3,
  modules: [
    {
      title: "Atores e cenários",
      lessons: [atoresECenarios, umAmigoNoPalco, animacaoDeCaminhada, troqueOCenario, sonsNoPalco],
    },
    {
      title: "Jogo: corrida animada",
      lessons: [corridaAnimada, corridaLargada, corridaContraOGlitch],
    },
  ],
});
