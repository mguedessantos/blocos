import {
  b, changeX, changeY, flag, forever, game, gotoXY, iff, keyPressed, lt, n, r, random, ypos,
} from "../../src/lib/blocks/build";
import { pictoblox } from "./basico";
import type { TrackContent } from "./types";

const FLAG = "event_whenflagclicked";
const KEY = "event_whenkeypressed";
const IFS = ["control_if", "control_if_else"];
const BROADCAST = ["event_broadcast", "event_broadcastandwait"];
const RECEIVE = "event_whenbroadcastreceived";
const CONTROLS = ["sensing_keypressed", KEY];
/** Nas lições avançadas, todos os blocos ficam liberados (lista vazia). */
const TODOS: string[] = [];

// ───────────── projetos iniciais do Caça-Moedas e da Fuga ─────────────
const heroControls = () => [flag(), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))];
const coinFall = () => [
  flag(), gotoXY(0, 170),
  forever(changeY(-5), iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170))),
];
const heroControls4 = () => [flag(), forever(
  iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)),
  iff(keyPressed("up arrow"), changeY(5)), iff(keyPressed("down arrow"), changeY(-5)),
)];

// ═══════════════════════ NÍVEL AVANÇADO ═══════════════════════

export const mundo8: TrackContent = {
  slug: "mundo-8-fortaleza-do-glitch",
  title: "Mundo 8 · Fortaleza do Glitch",
  description: "Aparecer e sumir, sorteios, mensagens entre atores, clones e telas de jogo.",
  story: "A Fortaleza do Glitch é cheia de truques: atores que somem, que se multiplicam, que trocam recados em segredo. Domine esses poderes e use-os contra o próprio Glitch.",
  level: 3,
  order: 8,
  modules: [
    {
      title: "Truques da fortaleza",
      lessons: [
        {
          slug: "invisibilidade",
          title: "Invisibilidade",
          type: "EXERCICIO",
          content: `## Missão: agora você me vê...

Faça o Bloquinho **piscar**: quando a bandeira for clicada, **repita 5 vezes**: **esconda**, **espere 0.3 segundos**, **mostre**, **espere 0.3 segundos**.`,
          allowedBlocks: TODOS,
          starter: game({ backdrops: ["castelo"], sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_hide"], label: "Use “esconda” dentro de um repita" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_show"], label: "Use “mostre” dentro de um repita" },
              { type: "visible", value: true, message: "No fim, o Bloquinho precisa estar visível." },
            ],
          },
          guide: {
            objetivo: "Controlar a visibilidade de atores (itens coletados, inimigos derrotados).",
            minutos: 10,
            passos: ["Pergunte: em que jogos as coisas somem? (moedas pegas, inimigos derrotados, fantasmas)."],
            errosComuns: ["Terminar com o ator escondido e não conseguir mais vê-lo: comece com “mostre” na bandeira."],
          },
          extra: "Use o efeito **fantasma** em vez de esconder: o Bloquinho some devagar (repita 10: mude o efeito fantasma em 10).",
        },
        {
          slug: "teleporte",
          title: "Teleporte",
          type: "EXERCICIO",
          content: `## Missão: me pega se puder!

Quando o Bloquinho for **clicado**, ele **vai para [posição aleatória]** e toca o som **Pop**.

Agora é um jogo de reflexo: tente clicar nele!`,
          allowedBlocks: TODOS,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 2,
            inputs: [{ click: "Bloquinho", at: 0.3 }],
            checks: [
              { type: "usesBlock", opcode: "event_whenthisspriteclicked" },
              { type: "usesAnyBlock", opcodes: ["motion_goto", "motion_gotoxy"], label: "Mande o Bloquinho para outro lugar quando for clicado" },
              { type: "walked", min: 5, message: "Quando clicado, o Bloquinho precisa mudar de lugar." },
              { type: "playedSound", sound: "pop", bonus: true, message: "Bônus: toque o som Pop no clique." },
            ],
          },
          guide: {
            objetivo: "Usar aleatoriedade para deixar o jogo imprevisível.",
            minutos: 10,
            passos: ["Mostre a diferença entre “vá para posição aleatória” e “vá para x: (número aleatório) y: (número aleatório)”."],
            errosComuns: ["Sortear valores que saem do palco (ex.: x até 500)."],
          },
          extra: "Some 1 ponto a cada clique e faça o Bloquinho ficar **menor** a cada acerto.",
        },
        {
          slug: "mensagens",
          title: "Recados entre atores",
          type: "EXERCICIO",
          xp: 20,
          content: `## Missão: o botão de começar

Atores conversam com **mensagens**:

1. No **Botão**: **quando este ator for clicado** → **transmita [começar]**.
2. No **Bloquinho**: **quando eu receber [começar]** → **diga “Vamos!” por 2 segundos**.

> O nome da mensagem precisa ser **igual** nos dois blocos.`,
          allowedBlocks: TODOS,
          starter: game({ sprites: [{ name: "Botão", character: "botao", y: -110 }, { name: "Bloquinho", y: 40 }] }),
          checks: {
            maxSeconds: 3,
            inputs: [{ click: "Botão", at: 0.3 }],
            checks: [
              { type: "usesAnyBlock", opcodes: BROADCAST, label: "Use “transmita …” no Botão" },
              { type: "usesBlock", opcode: RECEIVE },
              { type: "said", text: "Vamos", message: "Quando o Botão for clicado, o Bloquinho precisa dizer “Vamos!”. Os nomes das mensagens são iguais?" },
            ],
          },
          guide: {
            objetivo: "Coordenar atores com mensagens (transmitir/receber).",
            minutos: 15,
            passos: ["Dinâmica: um aluno “transmite” uma palavra e só quem tem aquela palavra no papel reage."],
            errosComuns: ["Nomes diferentes nos dois blocos (ex.: “começar” e “comecar”)."],
          },
        },
        {
          slug: "exercito-de-clones",
          title: "Exército de clones",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: chuva de meteoros (sem perigo... ainda)

**Clones** são cópias de um ator criadas durante o jogo — perfeitos para tiros, inimigos e moedas. No **Meteoro**:

1. Quando a bandeira for clicada → **esconda** → **repita 5 vezes**: **crie clone de [este ator]** e **espere 0.5 segundos**.
2. **quando eu começar como um clone** → **mostre** → **vá para x: (número aleatório entre -200 e 200) y: 170** → **repita 35 vezes: adicione -10 a y** → **apague este clone**.`,
          allowedBlocks: TODOS,
          starter: game({ backdrops: ["espaco"], sprites: [{ name: "Meteoro", character: "meteoro", y: 170 }] }),
          checks: {
            maxSeconds: 8,
            checks: [
              { type: "usesBlock", opcode: "control_start_as_clone" },
              { type: "usesBlock", opcode: "control_delete_this_clone", message: "Apague os clones quando eles chegarem embaixo (o jogo fica leve)." },
              { type: "clonesAtLeast", min: 3 },
            ],
          },
          guide: {
            objetivo: "Criar e controlar clones.",
            minutos: 20,
            passos: ["Explique: o ator original fica escondido e serve só como “fábrica”.", "Mostre por que apagar os clones que saem da tela."],
            errosComuns: ["Clones que nunca são apagados deixam o jogo lento.", "Criar clones dentro de “sempre” sem espera: centenas de clones de uma vez."],
          },
          extra: "Faça cada clone ter um **tamanho** sorteado (mude o tamanho para número aleatório entre 50 e 150).",
        },
      ],
    },
    {
      title: "Telas de jogo",
      lessons: [
        {
          slug: "telas-do-jogo",
          title: "Início, jogo e fim",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: as telas do jogo

Todo jogo tem telas: **início**, **jogo** e **fim**. Este projeto já tem os cenários **Tela de início**, **Floresta** e **Tela de fim**.

1. No **Botão**: quando a bandeira for clicada → **mude para o cenário Tela de início** e **mostre**.
2. No **Botão**: quando for clicado → **mude para o cenário Floresta**, **transmita [começar]** e **esconda**.
3. No **Bloquinho**: **quando eu receber [começar]** → **diga “O jogo começou!”**.`,
          allowedBlocks: TODOS,
          starter: game({ backdrops: ["inicio", "floresta", "fim"], sprites: [{ name: "Botão", character: "botao", y: -60 }, { name: "Bloquinho", x: -150, y: -120 }] }),
          checks: {
            maxSeconds: 3,
            inputs: [{ click: "Botão", at: 0.5 }],
            checks: [
              { type: "usesBlock", opcode: "looks_switchbackdropto", min: 2 },
              { type: "usesAnyBlock", opcodes: BROADCAST, label: "Avise os atores com uma mensagem quando o jogo começar" },
              { type: "backdropIs", backdrop: "floresta", message: "Depois do clique no Botão, o palco precisa mostrar a Floresta." },
              { type: "said", text: "começou" },
            ],
          },
          guide: {
            objetivo: "Estruturar um jogo em estados (início → jogo → fim).",
            minutos: 25,
            passos: ["Mostre um jogo conhecido e identifique as telas com a turma."],
            errosComuns: ["Atores do jogo aparecendo na tela de início: use esconda/mostre com as mensagens."],
          },
          extra: "Crie uma tela de **instruções** entre o início e o jogo.",
        },
        {
          slug: "chuva-de-meteoros",
          title: "Crie: chuva de meteoros",
          type: "DESAFIO",
          xp: 40,
          content: `# 🏆 Sobreviva à chuva

1. O **Bloquinho** anda para os lados com o **controle suave**.
2. O **Meteoro** cria **clones** que caem do alto em posições sorteadas.
3. **Se** um clone de meteoro **tocar** no Bloquinho → **transmita [fim]**.
4. O Bloquinho, **quando receber [fim]**: diz **“Fim de jogo!”** e **pare tudo**.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["espaco"],
            sprites: [{ name: "Bloquinho", y: -140 }, { name: "Meteoro", character: "meteoro", y: 170, visible: false }],
          }),
          checks: {
            maxSeconds: 15,
            checks: [
              { type: "clonesAtLeast", min: 2, message: "O Meteoro precisa criar clones que caem (vários, um de cada vez)." },
              { type: "keys", min: 2, message: "Controle o Bloquinho com as setas." },
              { type: "usesBlock", opcode: "sensing_touchingobject" },
              { type: "usesAnyBlock", opcodes: BROADCAST, label: "Transmita uma mensagem quando o meteoro acertar" },
              { type: "usesBlock", opcode: RECEIVE },
              { type: "variables", min: 1, bonus: true, message: "Bônus: conte os meteoros desviados ou o tempo em uma variável." },
            ],
          },
          guide: {
            objetivo: "Integrar clones, aleatoriedade, controle, colisão e mensagens em um jogo completo.",
            minutos: 45,
            passos: ["Divida em etapas no quadro: herói → meteoro → clones → colisão → fim.", "Peça para testarem a cada etapa antes de seguir."],
            errosComuns: ["O meteoro original (não clone) fica no palco e acerta o herói: deixe o original escondido."],
          },
          extra: "Faça os meteoros caírem **cada vez mais rápido** com o passar do tempo.",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "clones-no-pictoblox",
          title: "Clones no PictoBlox",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: clones no PictoBlox

Refaça o **exército de clones** no PictoBlox: **crie clone de [este ator]**, **quando eu começar como um clone** e **apague este clone**.`,
          checks: {
            checks: [
              { type: "usesAnyBlock", opcodes: ["control_create_clone_of"], label: "Use “crie clone de …”" },
              { type: "usesAnyBlock", opcodes: ["control_start_as_clone"], label: "Use “quando eu começar como um clone”" },
              { type: "usesAnyBlock", opcodes: ["control_delete_this_clone"], label: "Apague o clone quando ele não for mais necessário" },
            ],
          },
          guide: {
            objetivo: "Transferir clones para o PictoBlox.",
            minutos: 20,
            passos: ["Os blocos têm os mesmos nomes no site e no PictoBlox."],
            errosComuns: ["Esquecer de esconder o ator original."],
          },
        }),
      ],
    },
  ],
};

export const mundo9: TrackContent = {
  slug: "mundo-9-forja-dos-jogos",
  title: "Mundo 9 · Forja dos Jogos",
  description: "Planeje e construa dois jogos completos, etapa por etapa: Caça-Moedas e Fuga do Glitch.",
  story: "Na Forja dos Jogos, os Criadores transformam blocos em jogos de verdade. Cada etapa concluída devolve aura ao reino — e prepara você para o Grande Torneio.",
  level: 3,
  order: 9,
  modules: [
    {
      title: "Jogo 1: Caça-Moedas",
      lessons: [
        {
          slug: "planeje-seu-jogo",
          title: "Planeje seu jogo",
          type: "TEORIA",
          xp: 10,
          content: `# Todo jogo bom começa com um plano 📝

Antes de programar, responda no caderno:

1. **Objetivo**: o que o jogador precisa fazer? (pegar moedas, fugir do monstro...)
2. **Controles**: como o jogador joga? (setas, mouse, espaço)
3. **Regras**: o que dá pontos? O que tira vidas?
4. **Fim**: quando o jogo acaba? Dá para ganhar e perder?
5. **Atores e cenários**: quem aparece no jogo?

## O ciclo do jogo

Todo jogo repete o mesmo ciclo, muitas vezes por segundo, dentro de um **sempre**:

> **ler os controles → mover as coisas → conferir colisões → atualizar placar → repetir**

> Comece **pequeno**: um jogo simples e terminado é melhor que um jogo gigante pela metade!`,
          guide: {
            objetivo: "Planejar um jogo antes de programar (ficha de design).",
            minutos: 15,
            passos: ["Distribua uma ficha com as 5 perguntas.", "Analise juntos um jogo simples conhecido usando a ficha."],
            errosComuns: ["Planos grandes demais. Pergunte: “dá para fazer em 2 aulas?”"],
          },
        },
        {
          slug: "moedas-1-cenario",
          title: "Moedas 1: monte o cenário",
          type: "EXERCICIO",
          content: `## Etapa 1: os personagens

1. Adicione uma **Moeda** (botão **+ Ator**) e arraste para o alto do palco.
2. Arraste o **Bloquinho** para baixo: ele é o herói.
3. Adicione o cenário **Floresta** e, quando a bandeira for clicada, **mude para o cenário Floresta**.`,
          allowedBlocks: TODOS,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 1,
            checks: [
              { type: "sprites", min: 2, message: "Adicione a Moeda com o botão “+ Ator”." },
              { type: "backdrops", min: 2, message: "Adicione o cenário Floresta com o botão “Cenário”." },
              { type: "backdropIs", backdrop: "floresta" },
            ],
          },
          guide: {
            objetivo: "Preparar os recursos do jogo.",
            minutos: 10,
            passos: ["Cada etapa seguinte já começa com a etapa anterior pronta: ninguém fica para trás."],
            errosComuns: ["Esquecer de adicionar o cenário antes de usar o bloco “mude para o cenário”."],
          },
        },
        {
          slug: "moedas-2-heroi",
          title: "Moedas 2: mova o herói",
          type: "EXERCICIO",
          content: `## Etapa 2: o controle

Faça o Bloquinho andar para a **direita** e para a **esquerda** com as setas, usando o **controle suave** (sempre + se tecla pressionada).`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            sprites: [{ name: "Bloquinho", y: -140 }, { name: "Moeda", character: "moeda", y: 170 }],
          }),
          checks: {
            maxSeconds: 2,
            inputs: [{ key: "left arrow", from: 0.1, to: 1.1 }],
            checks: [
              { type: "usesBlock", opcode: "sensing_keypressed", min: 2, message: "Use “tecla … pressionada?” para as duas setas." },
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Os controles ficam dentro de um “sempre”" },
              { type: "movedBy", axis: "x", min: -80, label: "Segurando a seta para a esquerda, o Bloquinho precisa andar para a esquerda" },
            ],
          },
          guide: {
            objetivo: "Aplicar o padrão de controle em um projeto real.",
            minutos: 10,
            passos: ["Retome a missão “Controle suave” do Mundo 5."],
            errosComuns: ["Herói saindo da tela: o desafio extra resolve."],
          },
          extra: "Impeça o herói de sair do palco: **se** posição x > 220, **mude x para** 220 (e o mesmo do lado esquerdo).",
        },
        {
          slug: "moedas-3-queda",
          title: "Moedas 3: a moeda cai",
          type: "EXERCICIO",
          content: `## Etapa 3: a moeda cai do céu

Na **Moeda**: quando a bandeira for clicada → **vá para x: 0 y: 170** → **sempre**:
- **adicione -5 a y**
- **se** posição y < -170 **então** → **vá para x: (número aleatório entre -200 e 200) y: 170**`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170 }],
          }),
          checks: {
            maxSeconds: 6,
            checks: [
              { type: "inside", parent: ["control_forever"], child: ["motion_changeyby"], label: "A moeda cai (adicione … a y) dentro de um “sempre”" },
              { type: "inside", parent: IFS, child: ["motion_gotoxy", "motion_sety", "motion_goto"], label: "Quando chegar embaixo, a moeda volta para o alto" },
              { type: "walked", sprite: "Moeda", min: 500, message: "A moeda precisa cair e voltar para o alto várias vezes." },
            ],
          },
          guide: {
            objetivo: "Criar um objeto que se move sozinho e reinicia.",
            minutos: 15,
            passos: ["Desenhe o caminho da moeda no quadro: cai → chega embaixo → volta para cima."],
            errosComuns: ["Usar = -170 em vez de < -170: com passos de 5 pode nunca ser igual."],
          },
        },
        {
          slug: "moedas-4-pontos",
          title: "Moedas 4: pegou! +1",
          type: "EXERCICIO",
          content: `## Etapa 4: o placar

A variável **pontos** já existe. Na **Moeda**:

1. Na bandeira: **mude pontos para 0** (antes do sempre).
2. Dentro do sempre: **se tocando em [Bloquinho]** → **adicione 1 a pontos**, **toque o som Moeda** e volte para o alto em um x sorteado.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            variables: ["pontos"],
            sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170, code: [coinFall()] }],
          }),
          checks: {
            maxSeconds: 4,
            checks: [
              { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Zere os pontos quando a bandeira for clicada" },
              { type: "inside", parent: IFS, child: ["data_changevariableby"], label: "Some pontos quando a moeda tocar no herói" },
              { type: "variableAtLeast", name: "pontos", min: 1, message: "A primeira moeda cai em cima do Bloquinho: os pontos precisam subir." },
              { type: "playedSound", sound: "moeda", bonus: true, message: "Bônus: toque o som Moeda ao pegar." },
            ],
          },
          guide: {
            objetivo: "Integrar colisão e placar.",
            minutos: 15,
            passos: ["Lembre do problema dos pontos “infinitos”: a moeda precisa sair do herói depois de contar."],
            errosComuns: ["A moeda soma vários pontos de uma vez porque continua tocando no herói."],
          },
        },
        {
          slug: "moedas-5-vidas",
          title: "Moedas 5: vidas e fim de jogo",
          type: "DESAFIO",
          xp: 40,
          content: `# 🏆 Etapa final: vidas e fim

As variáveis **pontos** e **vidas** já existem.

1. Na bandeira: **mude vidas para 3**.
2. Se a moeda chegar ao chão **sem ser pega** (no “se posição y < -170”), **adicione -1 a vidas**.
3. No Bloquinho: **sempre** → **se vidas = 0** → **diga “Fim de jogo!”** e **pare [tudo]**.

Parabéns: você fez um jogo completo! 🎉`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            variables: ["pontos", "vidas"],
            sprites: [
              { name: "Bloquinho", y: -140, code: [heroControls()] },
              {
                name: "Moeda", character: "moeda", y: 170,
                code: [[
                  flag(), b("data_setvariableto", { VALUE: n(0) }, { VARIABLE: { id: "v_pontos" } }), gotoXY(0, 170),
                  forever(
                    changeY(-5),
                    iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }),
                      b("data_changevariableby", { VALUE: n(1) }, { VARIABLE: { id: "v_pontos" } }), gotoXY(random(-200, 200), 170)),
                    iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170)),
                  ),
                ]],
              },
            ],
          }),
          checks: {
            maxSeconds: 40,
            checks: [
              { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece as vidas com 3 na bandeira" },
              { type: "usesAnyBlock", opcodes: ["operator_equals", "operator_lt"], label: "Compare as vidas com 0" },
              { type: "said", text: "Fim" },
              { type: "stopped", message: "Quando as vidas acabarem, use “pare tudo”. (Na verificação o Bloquinho fica parado e deixa as moedas caírem.)" },
            ],
          },
          guide: {
            objetivo: "Fechar o ciclo do jogo com condição de derrota.",
            minutos: 25,
            passos: ["Faça uma rodada de “teste dos colegas”: cada um joga o jogo do vizinho e dá uma dica."],
            errosComuns: ["Conferir vidas = 0 só uma vez, fora do sempre.", "Tirar vida no lugar errado (quando pega a moeda)."],
          },
          extra: "Deixe a moeda **mais rápida** a cada 5 pontos (use uma variável **velocidade**).",
        },
      ],
    },
    {
      title: "Jogo 2: Fuga do Glitch",
      lessons: [
        {
          slug: "fuga-1-arena",
          title: "Fuga 1: monte a arena",
          type: "EXERCICIO",
          content: `## Etapa 1: a arena

1. Adicione o **Glitch** (botão **+ Ator**) e coloque-o longe do Bloquinho.
2. Adicione o cenário **Castelo**.
3. O Bloquinho anda nas **4 direções** com o **controle suave**.`,
          allowedBlocks: TODOS,
          starter: game({ sprites: [{ name: "Bloquinho", x: -150 }] }),
          checks: {
            maxSeconds: 2,
            inputs: [{ key: "up arrow", from: 0.1, to: 1.1 }],
            checks: [
              { type: "sprites", min: 2 },
              { type: "backdrops", min: 2 },
              { type: "keys", min: 4, message: "O Bloquinho precisa andar nas 4 direções (4 setas)." },
              { type: "movedBy", axis: "y", min: 80, label: "Segurando a seta para cima, o Bloquinho precisa subir" },
            ],
          },
          guide: {
            objetivo: "Reaproveitar o controle em 4 direções num novo jogo.",
            minutos: 10,
            passos: ["Incentive a copiar a lógica do jogo anterior."],
            errosComuns: ["Usar só 2 direções."],
          },
        },
        {
          slug: "fuga-2-perseguicao",
          title: "Fuga 2: o Glitch persegue",
          type: "EXERCICIO",
          content: `## Etapa 2: perseguição

No **Glitch**: **sempre** → **aponte para [Bloquinho]** → **mova 2 passos**.

> Ajuste a velocidade: rápido demais fica impossível, devagar demais fica sem graça!`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["castelo"],
            sprites: [{ name: "Bloquinho", x: -150, code: [heroControls4()] }, { name: "Glitch", character: "glitch", x: 150, y: 100 }],
          }),
          checks: {
            maxSeconds: 3,
            checks: [
              { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "O Glitch aponta para o Bloquinho dentro de um “sempre”" },
              { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "O Glitch anda dentro do “sempre”" },
              { type: "walked", sprite: "Glitch", min: 60, message: "O Glitch precisa andar em direção ao Bloquinho." },
            ],
          },
          guide: {
            objetivo: "Criar um inimigo que persegue.",
            minutos: 10,
            passos: ["Discuta equilíbrio de dificuldade: qual velocidade deixa o jogo divertido?"],
            errosComuns: ["Escolher “ponteiro do mouse” em vez de “Bloquinho” no menu."],
          },
        },
        {
          slug: "fuga-3-perigo",
          title: "Fuga 3: perigo!",
          type: "EXERCICIO",
          content: `## Etapa 3: pegou!

1. No **Glitch**, dentro do sempre: **se tocando em [Bloquinho]** → **transmita [pegou]**.
2. No **Bloquinho**: **quando eu receber [pegou]** → **diga “Ai!” por 1 segundo** e **vá para x: -150 y: 0**.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["castelo"],
            sprites: [
              { name: "Bloquinho", x: -150, code: [heroControls4()] },
              { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }))]] },
            ],
          }),
          checks: {
            maxSeconds: 8,
            checks: [
              { type: "inside", parent: IFS, child: BROADCAST, label: "Transmita uma mensagem dentro do “se” (quando o Glitch pegar o Bloquinho)" },
              { type: "usesBlock", opcode: RECEIVE },
              { type: "said", text: "Ai" },
            ],
          },
          guide: {
            objetivo: "Usar mensagens para comunicar eventos do jogo.",
            minutos: 10,
            passos: ["Compare: o Glitch poderia fazer tudo sozinho, mas a mensagem deixa o código organizado."],
            errosComuns: ["Nome da mensagem diferente entre transmitir e receber."],
          },
        },
        {
          slug: "fuga-4-fim",
          title: "Fuga 4: sobreviva!",
          type: "DESAFIO",
          xp: 40,
          content: `# 🏆 Etapa final: quanto tempo você aguenta?

O palco já tem os cenários **Castelo** e **Tela de fim**.

1. No Bloquinho, na bandeira: **zere o cronômetro** e **mude para o cenário Castelo**.
2. Quando o Bloquinho **receber [pegou]**: **mude para o cenário Tela de fim**, **diga (junte “Você sobreviveu ” com (arredondar (cronômetro)))** e **pare [tudo]**.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["castelo", "fim"],
            sprites: [
              { name: "Bloquinho", x: -150, code: [heroControls4()] },
              {
                name: "Glitch", character: "glitch", x: 150, y: 100,
                code: [[flag(), forever(
                  b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }),
                  iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }), b("event_broadcast", {}, { BROADCAST_OPTION: "pegou" })),
                )]],
              },
            ],
          }),
          checks: {
            maxSeconds: 10,
            checks: [
              { type: "usesBlock", opcode: "sensing_resettimer" },
              { type: "usesBlock", opcode: "sensing_timer" },
              { type: "backdropIs", backdrop: "fim", message: "Quando o Glitch pegar o Bloquinho, mostre a Tela de fim." },
              { type: "stopped" },
              { type: "said", text: "sobreviveu", bonus: true, message: "Bônus: mostre por quanto tempo o jogador sobreviveu." },
            ],
          },
          guide: {
            objetivo: "Completar um segundo jogo com telas e pontuação por tempo.",
            minutos: 30,
            passos: ["Organize um “mini-torneio”: quem sobrevive mais tempo nos jogos dos colegas?"],
            errosComuns: ["Esquecer de voltar ao cenário Castelo quando o jogo recomeça."],
          },
          extra: "A cada 10 segundos, crie **mais um Glitch** (clone).",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "caca-moedas-no-pictoblox",
          title: "Caça-Moedas no PictoBlox",
          type: "DESAFIO",
          xp: 40,
          content: `## Missão: refaça o Caça-Moedas no PictoBlox

Recrie no PictoBlox o jogo que você fez aqui: herói com controle suave, moeda que cai, **pontos**, **vidas** e **fim de jogo**.`,
          checks: {
            checks: [
              { type: "variables", min: 2, message: "Use duas variáveis: pontos e vidas." },
              { type: "usesAnyBlock", opcodes: ["sensing_keypressed", KEY], label: "Controle o herói pelo teclado" },
              { type: "inside", parent: ["control_forever"], child: ["motion_changeyby"], label: "A moeda cai dentro de um “sempre”" },
              { type: "usesAnyBlock", opcodes: ["control_stop"], label: "Pare o jogo quando as vidas acabarem" },
            ],
          },
          guide: {
            objetivo: "Transferir um jogo completo para o PictoBlox.",
            minutos: 60,
            passos: ["Peça para os alunos deixarem o site aberto ao lado como “receita”."],
            errosComuns: ["Nomes de blocos diferentes: “adicione -5 a y” no site = “mude y por -5” no PictoBlox."],
          },
        }),
      ],
    },
  ],
};

export const mundo10: TrackContent = {
  slug: "mundo-10-grande-torneio",
  title: "Mundo 10 · O Grande Torneio",
  description: "Prepare-se para a game jam: trabalho em equipe, do tema à ideia, capricho e o projeto final.",
  story: "Chegou a hora do Grande Torneio dos Criadores! Equipes de todo o reino vão criar jogos sobre um tema surpresa, com tempo marcado. É aqui que a aura volta de vez — e o Glitch é derrotado pela criatividade.",
  level: 3,
  order: 10,
  modules: [
    {
      title: "Preparando a equipe",
      lessons: [
        {
          slug: "o-que-e-uma-game-jam",
          title: "O que é uma game jam?",
          type: "TEORIA",
          xp: 10,
          content: `# Game jam: criar um jogo contra o relógio ⏱️

Uma **game jam** é um evento em que equipes criam um jogo do zero, sobre um **tema** revelado no início, em um **tempo limitado**.

## Como funciona

- O **tema** é anunciado no começo (ex.: “tudo ao contrário”, “um só botão”).
- As equipes têm um tempo fixo para criar.
- No fim, cada equipe **envia** o jogo e os **jurados** jogam e avaliam.

## O que os jurados avaliam

- **Diversão**: dá vontade de jogar de novo?
- **Tema**: o jogo combina com o tema?
- **Criatividade**: tem uma ideia diferente?
- **Capricho**: funciona sem erros? Tem sons, telas de início e fim?

> Na jam, **terminar** é mais importante que fazer um jogo enorme!`,
          guide: {
            objetivo: "Entender o formato da game jam e os critérios de avaliação.",
            minutos: 15,
            passos: ["Joguem juntos um jogo feito por outra turma e avaliem com os 4 critérios."],
            errosComuns: ["Achar que vence quem faz o jogo maior: reforce diversão e capricho."],
          },
        },
        {
          slug: "trabalho-em-equipe",
          title: "Trabalho em equipe",
          type: "TEORIA",
          xp: 10,
          content: `# Ninguém cria um jogo sozinho 🤝

Em uma jam, cada pessoa da equipe tem um **papel** (e todo mundo ajuda em tudo!):

- **Programação**: monta os scripts principais.
- **Arte e cenários**: escolhe atores, fantasias e cenários e cuida da aparência.
- **Som**: escolhe os sons e quando eles tocam.
- **Design e testes**: cuida das regras, da dificuldade e testa tudo.

## Piloto e copiloto

A equipe trabalha em **um projeto só**. Quem está no teclado é o **piloto**; quem está ao lado é o **copiloto**, que lê a ficha do jogo, confere os blocos e dá ideias. **Troquem de lugar a cada 10 minutos!**

## Combinados da equipe

- Combinem os **nomes das mensagens e variáveis** antes de começar (ex.: “começar”, “fim”, “pontos”).
- Cada ator pode ter um “dono”, mas todos revisam o código de todos.`,
          guide: {
            objetivo: "Organizar papéis, rodízio no teclado e combinados de nomes.",
            minutos: 20,
            passos: ["Forme as equipes (3–4 alunos) e peça que escolham papéis.", "Use um cronômetro visível para o rodízio piloto/copiloto."],
            errosComuns: ["Um aluno dominando o teclado o tempo todo: reforce o rodízio.", "Mensagens com nomes diferentes em atores feitos por pessoas diferentes."],
          },
        },
        {
          slug: "do-tema-a-ideia",
          title: "Do tema à ideia",
          type: "TEORIA",
          xp: 10,
          content: `# Tempestade de ideias 💡

Quando o tema sair:

1. **5 minutos de ideias malucas**: cada um fala o que vier à cabeça. Nada é errado!
2. **Escolham uma ideia** que combine com o tema e que seja **simples**.
3. **Descubram o “coração” do jogo**: qual é a única coisa que o jogador faz o tempo todo? (pular, desviar, pegar...)
4. **Façam a lista do mínimo**: o que o jogo PRECISA ter para funcionar? Façam isso primeiro.
5. **Lista dos extras**: só se sobrar tempo (mais fases, chefão, efeitos...).

> Treino: tema **“pequeno contra grande”**. Que jogo vocês fariam?`,
          guide: {
            objetivo: "Transformar um tema em uma ideia de jogo com escopo realista.",
            minutos: 20,
            passos: ["Treino com tema surpresa e 10 minutos para a equipe apresentar a ideia em 1 frase.", "Peça a “lista do mínimo” de cada equipe e ajude a cortar o excesso."],
            errosComuns: ["Lista do mínimo com 10 itens: o mínimo deve caber em 3–4 itens."],
          },
        },
      ],
    },
    {
      title: "Capricho de campeão",
      lessons: [
        {
          slug: "sons-e-efeitos",
          title: "Sons e efeitos",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: dê vida ao jogo

Jogos parecem muito melhores com **retorno** para o jogador. Neste mini-jogo de moedas:

1. Toque um som quando o Bloquinho **pega** a moeda (**Moeda**) e outro quando ela **cai no chão** (**Derrota**).
2. Use um **efeito gráfico** (**mude o efeito cor** ou **fantasma**) quando algo acontecer.
3. Bônus: uma **música** de fundo — no **Palco**, **sempre** → **toque o som … até o fim**.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            variables: ["pontos"],
            sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170, code: [coinFall()] }],
          }),
          checks: {
            maxSeconds: 6,
            checks: [
              { type: "sounds", min: 2, message: "Use pelo menos 2 sons diferentes." },
              { type: "usesAnyBlock", opcodes: ["looks_changeeffectby", "looks_seteffectto"], label: "Use um efeito gráfico (cor ou fantasma)" },
              { type: "playedSound", message: "Os sons precisam tocar durante o jogo (a primeira moeda cai em cima do Bloquinho)." },
              { type: "inside", parent: ["control_forever"], child: ["sound_playuntildone"], label: "Bônus: música de fundo em um “sempre”", bonus: true },
            ],
          },
          guide: {
            objetivo: "Adicionar retorno audiovisual (“juice”) ao jogo.",
            minutos: 20,
            passos: ["Mostre o mesmo jogo com e sem sons/efeitos e peça para a turma comparar."],
            errosComuns: ["Música com “toque o som” (sem esperar) dentro de sempre: sons se sobrepõem. Use “toque até o fim”."],
          },
        },
        {
          slug: "dificuldade-crescente",
          title: "Dificuldade crescente",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: cada vez mais difícil

Jogos bons começam fáceis e vão ficando difíceis. Neste jogo, a moeda cai sempre na mesma velocidade. Vamos mudar isso:

1. Crie a variável **velocidade** (botão **Criar uma variável**).
2. Na bandeira da Moeda: **mude velocidade para 3**.
3. Troque **adicione -5 a y** por **adicione (0 - velocidade) a y** (bloco verde **_ - _**).
4. Quando a moeda tocar no Bloquinho: **adicione 1 a velocidade**.`,
          allowedBlocks: TODOS,
          starter: game({
            backdrops: ["floresta"],
            sprites: [
              { name: "Bloquinho", y: -140, code: [heroControls()] },
              {
                name: "Moeda", character: "moeda", y: 170,
                code: [[
                  flag(), gotoXY(0, 170),
                  forever(
                    changeY(-5),
                    iff(b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: "Bloquinho" }), gotoXY(random(-200, 200), 170)),
                    iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170)),
                  ),
                ]],
              },
            ],
          }),
          checks: {
            maxSeconds: 4,
            checks: [
              { type: "variables", min: 1 },
              { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece a velocidade com um valor na bandeira" },
              { type: "usesBlock", opcode: "data_variable", message: "Use a variável no movimento (encaixe o bloco redondo da variável)." },
              { type: "variableAtLeast", name: "velocidade", min: 4, message: "Quando a moeda tocar no Bloquinho, a velocidade precisa aumentar (a primeira moeda cai em cima dele)." },
            ],
          },
          guide: {
            objetivo: "Usar variável para controlar a dificuldade ao longo do jogo.",
            minutos: 20,
            passos: ["Discuta a “curva de dificuldade” de jogos conhecidos."],
            errosComuns: ["Velocidade que cresce rápido demais e deixa o jogo impossível em segundos."],
          },
        },
        {
          slug: "teste-e-corrija",
          title: "Teste e corrija",
          type: "TEORIA",
          xp: 10,
          content: `# Caçando bugs 🐛

O Glitch adora jogos que não foram testados! Antes de entregar, confira:

- O jogo **começa certo** toda vez que clico na bandeira? (pontos zerados, atores no lugar)
- Dá para **ganhar** e dá para **perder**?
- Os atores **não saem do palco** sem querer?
- Os **sons** tocam na hora certa?
- Alguém de **fora da equipe** conseguiu jogar sem ajuda?

## Quando algo dá errado

1. **Descubra quando** o bug acontece (sempre? só às vezes?).
2. **Olhe o script** do ator envolvido, bloco por bloco.
3. Mostre os valores no palco: as **variáveis** aparecem no canto do palco enquanto o jogo roda.
4. **Mude uma coisa de cada vez** e teste de novo.`,
          guide: {
            objetivo: "Desenvolver o hábito de testar e depurar de forma organizada.",
            minutos: 15,
            passos: ["Faça “playtests cruzados”: equipes trocam de computador e anotam problemas no jogo da outra."],
            errosComuns: ["Mudar várias coisas ao mesmo tempo e não saber o que resolveu (ou piorou)."],
          },
        },
      ],
    },
    {
      title: "A jam de treino",
      lessons: [
        {
          slug: "projeto-final",
          title: "Projeto final: o jogo da equipe",
          type: "DESAFIO",
          xp: 60,
          content: `# 🏆 O Grande Torneio de treino

Com a sua equipe, crie aqui no site um jogo completo sobre o tema que o professor anunciar. O jogo precisa ter:

- **Pelo menos 3 atores** e **2 cenários** (início e jogo, ou jogo e fim).
- **Controles** pelo teclado ou mouse.
- Um **placar**, **vidas** ou **tempo** (variável).
- **Mensagens** entre atores.
- Um **ciclo de jogo** (sempre + se).
- **Sons**.

Quando terminar, clique em **Verificar**. Na game jam de verdade, vocês vão enviar pela área de **Jams**!`,
          allowedBlocks: TODOS,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 5,
            checks: [
              { type: "sprites", min: 3 },
              { type: "backdrops", min: 2 },
              { type: "usesAnyBlock", opcodes: [...CONTROLS, "sensing_mousedown", "event_whenthisspriteclicked", "motion_pointtowards"], label: "O jogador controla o jogo (teclado ou mouse)" },
              { type: "variables", min: 1 },
              { type: "usesAnyBlock", opcodes: BROADCAST, label: "Use mensagens entre atores" },
              { type: "usesBlock", opcode: RECEIVE },
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Tenha um ciclo de jogo (“se” dentro de “sempre”)" },
              { type: "sounds", min: 1 },
              { type: "usesAnyBlock", opcodes: ["control_create_clone_of"], label: "Bônus: use clones", bonus: true },
              { type: "backdrops", min: 3, bonus: true, message: "Bônus: tenha telas de início, jogo e fim." },
            ],
          },
          guide: {
            objetivo: "Aplicar tudo em uma jam de treino, em equipe, com tema e tempo.",
            minutos: 120,
            passos: [
              "Anuncie o tema e o tempo total (sugestão: 2–3 aulas).",
              "Marque checkpoints: fim da 1ª aula = ideia + lista do mínimo + atores; fim da 2ª = jogo jogável; 3ª = capricho e testes.",
              "No fim, faça uma mostra: cada equipe apresenta em 2 minutos e as outras jogam.",
              "Use os critérios da jam (diversão, tema, criatividade, capricho) para dar feedback.",
            ],
            errosComuns: [
              "Equipes que passam a aula toda escolhendo atores: lembre do checkpoint “jogo jogável”.",
              "Só uma pessoa no teclado: reforce o rodízio piloto/copiloto.",
            ],
          },
          extra: "Escreva um **texto de 3 linhas** apresentando o jogo e as instruções — os jurados da jam vão adorar.",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "projeto-final-pictoblox",
          title: "O jogo da equipe no PictoBlox",
          type: "DESAFIO",
          xp: 60,
          content: `## Missão: a jam no PictoBlox

Se a sua escola usa o PictoBlox na jam, refaça (ou continue) o jogo da equipe lá, com os mesmos requisitos: 3 atores, 2 cenários, controles, variável, mensagens, ciclo de jogo e sons.

> No PictoBlox, cada pessoa pode criar um ator no próprio computador, **exportar** (botão direito no ator → exportar, arquivo .sprite3) e o responsável **importa** no projeto principal.`,
          checks: {
            checks: [
              { type: "sprites", min: 3 },
              { type: "backdrops", min: 2 },
              { type: "usesAnyBlock", opcodes: [...CONTROLS, "sensing_mousedown", "event_whenthisspriteclicked", "motion_pointtowards"], label: "O jogador controla o jogo (teclado ou mouse)" },
              { type: "variables", min: 1 },
              { type: "usesAnyBlock", opcodes: BROADCAST, label: "Use mensagens entre atores" },
              { type: "usesAnyBlock", opcodes: [RECEIVE], label: "Algum ator reage a uma mensagem" },
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Tenha um ciclo de jogo (“se” dentro de “sempre”)" },
              { type: "sounds", min: 1 },
            ],
          },
          guide: {
            objetivo: "Transferir o projeto final para o PictoBlox, quando a escola usar o PictoBlox na jam.",
            minutos: 120,
            passos: ["Pratique antes o exportar/importar atores (.sprite3) para juntar o trabalho da equipe."],
            errosComuns: ["Dois alunos editando o “mesmo” projeto em computadores diferentes e perdendo trabalho."],
          },
        }),
      ],
    },
  ],
};

