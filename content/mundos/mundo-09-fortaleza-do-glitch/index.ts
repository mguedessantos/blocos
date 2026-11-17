import { mundo } from "../tipos";
import * as invisibilidade from "./licoes/invisibilidade";
import * as teleporte from "./licoes/teleporte";
import * as mensagens from "./licoes/mensagens";
import * as exercitoDeClones from "./licoes/exercito-de-clones";
import * as telasDoJogo from "./licoes/telas-do-jogo";
import * as cobrinhaDirecao from "./licoes/cobrinha-direcao";
import * as cobrinhaCorpo from "./licoes/cobrinha-corpo";
import * as cobrinhaCresce from "./licoes/cobrinha-cresce";
import * as cobrinhaBorda from "./licoes/cobrinha-borda";
import * as cobrinhaBateu from "./licoes/cobrinha-bateu";
import * as cobrinhaDesafio from "./licoes/cobrinha-desafio";

// A ordem das lições é a ordem desta lista.
export default mundo({
  slug: "mundo-8-fortaleza-do-glitch",
  title: "Mundo 9 · Fortaleza do Glitch",
  description: "Aparecer e sumir, sorteios, mensagens entre atores, clones e telas de jogo. No fim, uma Cobrinha feita de clones.",
  story: "A Fortaleza do Glitch é cheia de truques: atores que somem, que se multiplicam, que trocam recados em segredo. Domine esses poderes e use-os contra o próprio Glitch.",
  level: 3,
  order: 9,
  modules: [
    {
      title: "Truques da fortaleza",
      lessons: [invisibilidade, teleporte, mensagens, exercitoDeClones],
    },
    {
      title: "Telas de jogo",
      lessons: [telasDoJogo],
    },
    {
      title: "Jogo: Cobrinha",
      lessons: [cobrinhaDirecao, cobrinhaCorpo, cobrinhaCresce, cobrinhaBorda, cobrinhaBateu, cobrinhaDesafio],
    },
  ],
});
