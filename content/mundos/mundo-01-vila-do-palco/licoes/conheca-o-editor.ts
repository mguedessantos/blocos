import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "conheca-o-editor",
  title: "Conheça o editor",
  type: "TEORIA",
  xp: 5,
  content: `# Onde fica cada coisa

Antes de programar, vamos conhecer a tela onde você vai criar seus jogos. Ela tem três partes, da esquerda para a direita.

## 1. Os blocos (à esquerda)

- No alto, três abas: **Código** (os blocos), **Fantasias** (os desenhos do ator) e **Sons**.
- A coluna de **bolinhas coloridas** mostra as categorias: **Movimento** (azul), **Eventos** (amarelo) e outras que você vai conhecer.
- Ao lado ficam os **blocos** da categoria escolhida. Arraste um bloco para a área do meio para usar.

## 2. A área de código (no meio)

- É aqui que você **encaixa os blocos**, um embaixo do outro.
- Os botões **+**, **-** e **=** no canto de baixo aumentam, diminuem e arrumam o tamanho dos blocos.
- Para apagar um bloco, arraste ele de volta para a coluna de blocos.

## 3. O palco e os atores (à direita)

- **Bandeira verde**: começa o programa. **Sinal vermelho**: para tudo.
- O **palco** é onde o jogo acontece.
- Embaixo do palco ficam as informações do ator escolhido: **nome**, posição (**x** e **y**), **tamanho** e **direção**.
- Mais embaixo fica a **lista de atores**. O ator com a borda roxa é o que está escolhido: os blocos do meio são **dele**.
- O botão redondo com uma **carinha**, no canto da lista, abre **Selecione um Ator**: a biblioteca com novos personagens.
- Na coluna **Palco**, à direita, o botão redondo com uma **imagem** abre **Selecionar Cenário**: os fundos do palco.

## Os botões do site

- **Objetivos** (à direita): a lista do que a missão pede. Cada item fica marcado quando você consegue.
- **Verificar**: confere a missão e dá as estrelas. Ele libera depois que você clica na bandeira verde.
- **Trazer personagem de volta**: põe os atores no lugar do começo, se eles saírem do palco.
- **Recomeçar**: apaga os seus blocos e volta a missão do começo.
- **Como funciona cada bloco**: explica todos os blocos.

Nas próximas duas missões, você vai colocar um **ator novo** e trocar o **cenário** do palco.`,
  guide: {
    objetivo: "Conhecer as áreas do editor e os botões do site antes de programar.",
    minutos: 10,
    passos: [
      "Abra uma missão no projetor e aponte cada área enquanto a turma acompanha na própria tela.",
      "Peça para todos acharem: a bandeira verde, a aba Código, a lista de atores e o botão Selecione um Ator.",
    ],
    errosComuns: ["Procurar os blocos de um ator com outro ator escolhido: confira qual está com a borda roxa."],
  },
};
