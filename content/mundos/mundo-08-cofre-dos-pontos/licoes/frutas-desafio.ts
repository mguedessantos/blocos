import { changeY, flag, forever, game, gotoXY } from "../../../../src/lib/blocks/build";
import type { LessonContent, LessonTest } from "../../tipos";
import { FIM, fruta, pegaFrutas, PONTO, SETAS, VIDA } from "../jogo";

export const licao: LessonContent = {
  slug: "frutas-desafio",
  title: "Desafio: Pega-frutas completo",
  type: "DESAFIO",
  xp: 30,
  content: `# Desafio: Pega-frutas completo

O placar começa sozinho (pontos 0, vidas 3) e a Fruta cai, mas ela **não volta para cima** e **o Bloquinho não anda**. Monte o jogo:

1. **Bloquinho**: anda para os lados com as setas (**8** passos por vez).
2. **Fruta**, dentro do **sempre**:

- **se tocando em Bloquinho**: **+1 ponto** e volta para o alto (**vá para x: (número aleatório entre -200 e 200) y: 170**).
- **se posição y < -170** (chão): **-1 vida**, volta para o alto e, **se vidas = 0**, Tela de fim e **pare todos**.

Pegue **5 frutas** para ver o **CONCLUÍDO**. Depois clique em **Verificar**.`,
  allowedBlocks: [],
  starter: game(pegaFrutas([flag()], [flag(), gotoXY(0, 170), forever(changeY(-5))])),
  checks: {
    maxSeconds: 25,
    inputs: [{ key: "right arrow", from: 2.2, to: 2.7 }],
    checks: [
      { type: "variableAtLeast", name: "pontos", min: 1, message: "A primeira fruta cai bem no Bloquinho: ela precisa valer 1 ponto e voltar para o alto.", goal: "Fruta pega: **+1 ponto**" },
      { type: "movedBy", axis: "x", min: 30, sprite: "Bloquinho", label: "Segurando a seta para a direita, o Bloquinho deveria andar para a direita", goal: "O Bloquinho anda com as **setas**" },
      { type: "variableEquals", name: "vidas", value: 0, message: "Cada fruta no chão tira 1 vida e volta para o alto; com 0 vidas o jogo acaba.", goal: "Fruta no chão: **-1 vida**" },
      { type: "backdropIs", backdrop: "fim", message: "Com 0 vidas, mostre a Tela de fim.", goal: "Com **0 vidas**, Tela de fim" },
      { type: "stopped", message: "Use pare todos no fim de jogo.", goal: "O jogo para com **pare todos**" },
    ],
  },
  guide: {
    objetivo: "Montar sozinho um jogo com placar, vidas e fim de jogo.",
    minutos: 25,
    passos: ["Deixe a turma jogar até o CONCLUÍDO.", "Pergunte: o que mudaria para o jogo ficar mais difícil? (fruta mais rápida: adicione -8 a y)."],
    errosComuns: ["Esquecer de mandar a fruta de volta para o alto: ela cai uma vez só.", "Colocar o se vidas = 0 fora do se do chão: confira que as vidas não ficam negativas."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: pegaFrutas(SETAS, fruta([PONTO], [VIDA, FIM])),
  erros: [
    pegaFrutas([flag()], fruta([PONTO], [VIDA, FIM])), // Bloquinho parado
    pegaFrutas(SETAS, fruta([PONTO], [VIDA])), // sem fim de jogo
  ],
};
