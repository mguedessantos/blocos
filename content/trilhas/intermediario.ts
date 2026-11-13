import { changeX, flag, forever, game, ifEdgeBounce } from "../../src/lib/blocks/build";
import { editor } from "../licoes-editor";
import { pictoblox } from "./basico";
import type { TrackContent } from "./types";

const FLAG = "event_whenflagclicked";
const IFS = ["control_if", "control_if_else"];

const CONTROLE = [
  FLAG, "event_whenkeypressed", "event_whenthisspriteclicked", "motion_movesteps", "motion_ifonedgebounce", "motion_changexby", "motion_changeyby", "motion_gotoxy",
  "motion_pointindirection", "motion_setrotationstyle", "looks_say", "looks_sayforsecs", "looks_nextcostume", "sound_play",
  "control_wait", "control_repeat", "control_forever", "control_if", "control_if_else", "sensing_keypressed", "sensing_touchingobject",
];
const SENSORES = [
  ...CONTROLE, "motion_pointtowards", "motion_goto", "control_stop", "sensing_distanceto", "sensing_mousex", "sensing_mousey",
  "sensing_mousedown", "sensing_timer", "sensing_resettimer", "operator_lt", "operator_gt", "operator_equals", "operator_round", "operator_join",
];

// ═══════════════════════ NÍVEL INTERMEDIÁRIO ═══════════════════════

export const mundo4: TrackContent = {
  slug: "mundo-4-ponte-das-decisoes",
  title: "Mundo 4 · Ponte das Decisões",
  description: "Se… então, senão, e/ou/não e repetir até: ensine o Bloquinho a tomar decisões.",
  story: "A Ponte das Decisões desmoronou: o Glitch apagou a capacidade dos blocos de escolher. Reconstrua cada tábua ensinando o Bloquinho a pensar “se isso, então aquilo”.",
  level: 2,
  order: 4,
  modules: [
    {
      title: "Tomando decisões",
      lessons: [
        editor("se-entao", {
          objetivo: "Entender condições (verdadeiro/falso) e o bloco se… então.",
          minutos: 10,
          passos: ["Brinque de “se… então” com a turma: “SE você estiver de tênis, ENTÃO levante a mão”.", "Mostre o formato hexagonal das condições."],
          errosComuns: ["Tentar encaixar uma condição num espaço redondo (não cabe)."],
        }),
        editor("bate-e-volta", {
          objetivo: "Usar um sensor dentro de um se, dentro de um laço.",
          minutos: 15,
          passos: ["Mostre que o “se” é verificado a cada volta do repita."],
          errosComuns: ["Colocar o “se” fora do repita: ele só é testado uma vez."],
        }),
        editor("direita-ou-esquerda", {
          objetivo: "Usar se… senão e comparar números.",
          minutos: 10,
          passos: ["Teste com x = 150 e x = -150 para ver os dois caminhos."],
          errosComuns: ["Inverter > e <."],
        }, "Adicione um terceiro caso: se x = 0, diga **Bem no meio!** (dica: um se dentro do senão)."),
        editor("volta-ao-mundo", {
          objetivo: "Usar condição para “dar a volta” no palco, como em jogos clássicos.",
          minutos: 15,
          passos: ["Relacione com jogos em que o personagem sai por um lado da tela e entra pelo outro."],
          errosComuns: ["Usar = 150 em vez de > 150: com passos de 15, o x pode nunca ser exatamente igual."],
        }),
      ],
    },
    {
      title: "Condições combinadas",
      lessons: [
        editor("e-ou-nao", {
          objetivo: "Combinar condições com e/ou/não.",
          minutos: 10,
          passos: ["Tabela no quadro: “está sol E é sábado?” / “está sol OU é sábado?”."],
          errosComuns: ["Usar “ou” quando precisa das duas condições."],
        }, "Faça o Bloquinho dizer em qual dos **4 quadrantes** do palco ele está."),
        editor("ate-a-borda", {
          objetivo: "Usar o laço repita até que.",
          minutos: 10,
          passos: ["Compare: “repita 10 vezes” (sabemos quantas) × “repita até” (não sabemos quantas)."],
          errosComuns: ["Colocar o “diga” dentro do laço."],
        }),
        editor("robo-aspirador", {
          objetivo: "Resolver um problema aberto com laço infinito + condição.",
          minutos: 20,
          passos: ["Deixe a turma testar ângulos diferentes e comparar qual aspirador “limpa” mais o palco.", "Peça para observarem o caminho do Bloquinho no palco."],
          errosComuns: ["Girar 180 sempre: o aspirador fica preso indo e voltando na mesma linha."],
        }, "Use **número aleatório entre 90 e 180** no giro e compare o caminho."),
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "a-porta-que-decide",
          title: "A porta que decide",
          type: "EXERCICIO",
          xp: 20,
          content: `## Missão: o portão mágico no PictoBlox

1. Tenha pelo menos **2 atores**: um herói e um portão (ou qualquer objeto).
2. No herói: **sempre** → **se tocando em [portão]? então** → **diga “Abriu!”**.
3. Arraste o herói até o portão com o mouse para testar.`,
          checks: {
            checks: [
              { type: "sprites", min: 2 },
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Coloque um “se … então” dentro do “sempre”" },
              { type: "usesAnyBlock", opcodes: ["sensing_touchingobject"], label: "Use o sensor “tocando em …?”" },
              { type: "inside", parent: IFS, child: ["*"], label: "Algo precisa acontecer dentro do “se”" },
            ],
          },
          guide: {
            objetivo: "Transferir a estrutura sempre + se + sensor para o PictoBlox.",
            minutos: 15,
            passos: ["No PictoBlox dá para arrastar atores no palco enquanto o código roda."],
            errosComuns: ["“se” fora do “sempre”: só confere uma vez, no início."],
          },
        }),
      ],
    },
  ],
};

export const mundo5: TrackContent = {
  slug: "mundo-5-cidade-dos-comandos",
  title: "Mundo 5 · Cidade dos Comandos",
  description: "Teclado e cliques: dê o controle do jogo para o jogador.",
  story: "Na Cidade dos Comandos, tudo obedece ao teclado e ao clique — mas o Glitch embaralhou os controles. Mostre quem manda e devolva o controle aos jogadores!",
  level: 2,
  order: 5,
  modules: [
    {
      title: "O jogador no controle",
      lessons: [
        {
          slug: "eventos",
          title: "Quem começa o código?",
          type: "TEORIA",
          xp: 5,
          content: `# Eventos: o “gatilho” de cada script ⚡

Até agora, todo código começou com a **bandeira verde**. Mas um jogo precisa reagir ao **jogador**!

Os blocos amarelos de **Eventos** começam scripts:

- **quando 🏁 for clicado**: quando o jogo começa.
- **quando a tecla [espaço] for pressionada**: quando o jogador aperta uma tecla.
- **quando este ator for clicado**: quando o jogador clica no ator.

> Um mesmo ator pode ter **vários scripts**, cada um com o seu evento. Eles funcionam ao mesmo tempo!

## Testando

Clique na **bandeira verde** e depois use o **teclado** e o **mouse** no palco. O jogo fica esperando você até clicar no **botão vermelho** (parar).`,
          guide: {
            objetivo: "Entender que eventos diferentes disparam scripts diferentes, ao mesmo tempo.",
            minutos: 10,
            passos: ["Mostre um ator com 3 scripts (bandeira, tecla, clique) e teste cada um."],
            errosComuns: ["Achar que só pode existir um script por ator."],
          },
        },
        {
          slug: "setas-do-teclado",
          title: "Setas do teclado",
          type: "EXERCICIO",
          content: `## Missão: ande para os lados

1. Use **quando a tecla [seta para a direita] for pressionada** → **adicione 10 a x**.
2. Faça outro script com a **seta para a esquerda** → **adicione -10 a x**.
3. Clique na **bandeira verde** e teste com o teclado!

> Na verificação, o site aperta a seta para a direita **3 vezes** e a esquerda **1 vez**. O Bloquinho precisa terminar em **x: 20**.`,
          allowedBlocks: CONTROLE,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 2,
            inputs: [
              { key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.3, to: 0.4 },
              { key: "right arrow", from: 0.5, to: 0.6 }, { key: "left arrow", from: 0.7, to: 0.8 },
            ],
            checks: [
              { type: "keys", min: 2 },
              { type: "usesBlock", opcode: "motion_changexby" },
              { type: "finalPosition", x: 20, y: 0, tolerance: 1, message: "Com 3 toques na seta da direita e 1 na da esquerda, o Bloquinho deveria terminar em x: 20. Confira os valores (10 e -10)." },
            ],
          },
          guide: {
            objetivo: "Controlar um ator com eventos de tecla.",
            minutos: 10,
            passos: ["Explique que a verificação “aperta as teclas” sozinha, como um jogador-robô."],
            errosComuns: ["Usar a mesma tecla nos dois scripts.", "Usar “mova 10 passos”: o ator anda para onde está olhando, não para o lado da seta."],
          },
        },
        {
          slug: "voo-em-4-direcoes",
          title: "Voo em 4 direções",
          type: "EXERCICIO",
          content: `## Missão: controle completo

Complete o controle: além dos lados, faça a **seta para cima** **adicione 10 a y** e a **seta para baixo** **adicione -10 a y**.

> Na verificação: cima 2×, baixo 1×, direita 1×, esquerda 2×. O Bloquinho precisa terminar em **x: -10, y: 10**.`,
          allowedBlocks: CONTROLE,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 2,
            inputs: [
              { key: "up arrow", from: 0.1, to: 0.2 }, { key: "up arrow", from: 0.3, to: 0.4 }, { key: "down arrow", from: 0.5, to: 0.6 },
              { key: "right arrow", from: 0.7, to: 0.8 }, { key: "left arrow", from: 0.9, to: 1.0 }, { key: "left arrow", from: 1.1, to: 1.2 },
            ],
            checks: [
              { type: "keys", min: 4, message: "Use as 4 setas: direita, esquerda, cima e baixo." },
              { type: "finalPosition", x: -10, y: 10, tolerance: 1, message: "Confira as 4 setas: cada toque anda 10 para o lado certo." },
            ],
          },
          guide: {
            objetivo: "Controle em 4 direções com x e y.",
            minutos: 10,
            passos: ["Lembre: y positivo é para cima."],
            errosComuns: ["Trocar x por y."],
          },
          extra: "Use **aponte para a direção** em cada tecla para o Bloquinho olhar para onde anda (use “defina o estilo de rotação” para ele não ficar de cabeça para baixo).",
        },
        {
          slug: "clique-em-mim",
          title: "Clique em mim!",
          type: "EXERCICIO",
          content: `## Missão: cócegas!

Use **quando este ator for clicado** → **diga “Ai, que cócegas!” por 1 segundo**.

Execute e clique no Bloquinho no palco!`,
          allowedBlocks: CONTROLE,
          starter: game({ sprites: [{ name: "Bloquinho" }] }),
          checks: {
            maxSeconds: 2,
            inputs: [{ click: "Bloquinho", at: 0.3 }],
            checks: [
              { type: "usesBlock", opcode: "event_whenthisspriteclicked" },
              { type: "said", text: "cócegas" },
            ],
          },
          guide: {
            objetivo: "Usar o evento de clique — base de botões e menus.",
            minutos: 10,
            passos: ["Conte que botões de “Jogar” em menus funcionam assim."],
            errosComuns: ["Esquecer de clicar na bandeira verde antes de clicar no ator."],
          },
          extra: "A cada clique, faça o Bloquinho **trocar de fantasia** e **tocar um som**.",
        },
        {
          slug: "controle-suave",
          title: "Controle suave",
          type: "EXERCICIO",
          xp: 20,
          content: `## Missão: movimento de videogame

Com “quando a tecla for pressionada”, o movimento dá uma **travadinha** no começo. Os jogos usam outro jeito:

1. Quando a bandeira for clicada → **sempre**.
2. Dentro do sempre: **se tecla [seta para a direita] pressionada? então** → **adicione 5 a x**.
3. Faça o mesmo para a esquerda, com **-5**.

Compare com a missão das setas: ficou bem mais suave!`,
          allowedBlocks: CONTROLE,
          starter: game({ sprites: [{ name: "Bloquinho", x: -150 }] }),
          checks: {
            maxSeconds: 2,
            inputs: [{ key: "right arrow", from: 0.1, to: 1.1 }],
            checks: [
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Coloque os “se” dentro de um “sempre”" },
              { type: "usesBlock", opcode: "sensing_keypressed", min: 2, message: "Use o sensor “tecla … pressionada?” para as duas setas." },
              { type: "movedBy", axis: "x", min: 100, label: "Segurando a seta para a direita, o Bloquinho precisa andar sem parar" },
            ],
          },
          guide: {
            objetivo: "Usar o padrão de controle dos jogos: laço + sensor de tecla.",
            minutos: 15,
            passos: ["Rode lado a lado as duas versões (evento × sensor) e peça para a turma sentir a diferença."],
            errosComuns: ["Colocar o “se tecla pressionada” fora do sempre."],
          },
          extra: "Adicione uma tecla de **corrida**: se a tecla espaço estiver pressionada, o Bloquinho anda o dobro.",
        },
        {
          slug: "pegue-a-estrela",
          title: "Crie: pegue a estrela",
          type: "DESAFIO",
          xp: 35,
          content: `# 🏆 Seu primeiro mini-jogo

1. Faça o **Bloquinho** andar com o **controle suave** (setas).
2. **Se** o Bloquinho estiver **tocando em Estrela** → ele diz **“Peguei!”** e toca um som.
3. Teste: leve o Bloquinho até a estrela com as setas.

> Na verificação, o site segura a seta para a direita até o Bloquinho chegar na estrela.`,
          allowedBlocks: CONTROLE,
          starter: game({ sprites: [{ name: "Bloquinho", x: -150 }, { name: "Estrela", character: "estrela", x: 150 }] }),
          checks: {
            maxSeconds: 4,
            inputs: [{ key: "right arrow", from: 0.1, to: 3 }],
            checks: [
              { type: "usesBlock", opcode: "sensing_keypressed", min: 2, message: "Controle o Bloquinho com o sensor “tecla … pressionada?” (duas setas)." },
              { type: "usesBlock", opcode: "sensing_touchingobject" },
              { type: "said", text: "Peguei" },
              { type: "playedSound", bonus: true, message: "Bônus: toque um som ao pegar a estrela." },
            ],
          },
          guide: {
            objetivo: "Integrar controle e colisão em um mini-jogo.",
            minutos: 25,
            passos: ["Deixe a turma jogar o jogo do colega ao lado.", "Pergunte: o que falta para virar um jogo de verdade? (pontos, tempo...)"],
            errosComuns: ["Colocar o “se tocando em Estrela” fora do “sempre”."],
          },
          extra: "Quando pegar, mande a estrela para uma **posição aleatória** (bloco **vá para posição aleatória** na Estrela, usando “tocando em Bloquinho”).",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "comandos-no-pictoblox",
          title: "Controle suave no PictoBlox",
          type: "EXERCICIO",
          xp: 20,
          content: `## Missão: o mesmo controle no PictoBlox

Refaça no PictoBlox o **controle suave**: **sempre** → **se tecla [seta] pressionada? então** → **mude x por …** (para as duas setas).`,
          checks: {
            checks: [
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Coloque os “se” dentro de um “sempre”" },
              { type: "usesAnyBlock", opcodes: ["sensing_keypressed"], min: 2, label: "Use “tecla … pressionada?” para pelo menos 2 teclas" },
              { type: "inside", parent: IFS, child: ["motion_changexby", "motion_changeyby"], label: "Mova o ator dentro do “se”" },
            ],
          },
          guide: {
            objetivo: "Transferir o padrão de controle para o PictoBlox.",
            minutos: 15,
            passos: ["Peça para comparar os nomes dos blocos: “adicione 10 a x” no site × “mude x por 10” no PictoBlox."],
            errosComuns: ["Colocar o “se tecla pressionada” fora do sempre."],
          },
        }),
      ],
    },
  ],
};

export const mundo6: TrackContent = {
  slug: "mundo-6-observatorio-dos-sensores",
  title: "Mundo 6 · Observatório dos Sensores",
  description: "Colisões, distância, mouse e cronômetro: faça o jogo perceber o mundo.",
  story: "No Observatório dos Sensores, cada instrumento sente uma parte do mundo do jogo. O Glitch cobriu as lentes de poeira — limpe uma a uma e seus jogos vão enxergar tudo.",
  level: 2,
  order: 6,
  modules: [
    {
      title: "Os olhos do código",
      lessons: [
        {
          slug: "os-olhos-do-codigo",
          title: "Os olhos do código",
          type: "TEORIA",
          xp: 5,
          content: `# Sensores: o jogo percebendo o mundo 👀

Os blocos **azul-claros** de **Sensores** fazem perguntas ao jogo:

- **tocando em [ator]?** — encostou em alguém (ou na borda)?
- **distância até [ator]** — quão perto algo está.
- **tecla [ ] pressionada?** / **mouse pressionado?** — o que o jogador está fazendo.
- **posição x do mouse** / **posição y do mouse** — onde está o cursor.
- **cronômetro** — quanto tempo passou.

> Quase sempre os sensores ficam dentro de um **se**, dentro de um **sempre**: o jogo fica perguntando o tempo todo.`,
          guide: {
            objetivo: "Conhecer os principais sensores e o padrão sempre + se + sensor.",
            minutos: 10,
            passos: ["Pergunte: em que jogos você já viu algo “perceber” o jogador?"],
            errosComuns: ["Achar que o sensor “avisa” sozinho: ele só responde quando o código pergunta."],
          },
        },
        {
          slug: "bati",
          title: "Bati!",
          type: "EXERCICIO",
          content: `## Missão: cuidado com a parede

O Bloquinho vai andar até a **Parede**. No **Bloquinho**:

**sempre** → **mova 5 passos** → **se tocando em [Parede]? então** → **diga “Bati!”** e **pare [tudo]**.`,
          allowedBlocks: SENSORES,
          starter: game({ sprites: [{ name: "Bloquinho", x: -150 }, { name: "Parede", character: "parede", x: 120 }] }),
          checks: {
            maxSeconds: 5,
            checks: [
              { type: "usesBlock", opcode: "sensing_touchingobject" },
              { type: "said", text: "Bati" },
              { type: "stopped" },
              { type: "finalPosition", x: 75, y: 0, tolerance: 8, message: "O Bloquinho precisa parar quando encostar na Parede (escolha “Parede” no menu do sensor, não “borda”)." },
            ],
          },
          guide: {
            objetivo: "Detectar colisão entre atores e parar o jogo.",
            minutos: 10,
            passos: ["Mostre o menu do sensor: borda, ponteiro do mouse e cada ator do projeto."],
            errosComuns: ["Escolher “borda” em vez de “Parede” no menu."],
          },
        },
        {
          slug: "radar",
          title: "Radar do Glitch",
          type: "EXERCICIO",
          content: `## Missão: o Glitch percebe você

No **Glitch**: **sempre** → **se distância até [Bloquinho] < 120 então** → **diga “Te vi!”**, **senão** → **diga ""** (nada).

Teste: antes de executar, arraste o Bloquinho para **perto** e depois para **longe** do Glitch.`,
          allowedBlocks: SENSORES,
          starter: game({ sprites: [{ name: "Bloquinho", x: -50 }, { name: "Glitch", character: "glitch", x: 50 }] }),
          checks: {
            maxSeconds: 1,
            checks: [
              { type: "usesBlock", opcode: "sensing_distanceto" },
              { type: "usesAnyBlock", opcodes: ["operator_lt", "operator_gt"], label: "Compare a distância com um número (< ou >)" },
              { type: "said", text: "Te vi" },
            ],
          },
          guide: {
            objetivo: "Usar distância + comparação para criar inimigos que “enxergam”.",
            minutos: 15,
            passos: ["Teste com o Bloquinho perto e longe (arrastando antes de executar)."],
            errosComuns: ["Usar = 120: a distância quase nunca é exatamente igual."],
          },
          extra: "Quando te vir, faça o Glitch **apontar para** o Bloquinho e andar na direção dele.",
        },
        {
          slug: "siga-o-mouse",
          title: "Siga o mouse",
          type: "EXERCICIO",
          content: `## Missão: o Bloquinho e o mouse

**sempre** → **aponte para [ponteiro do mouse]** → **mova 3 passos**.

Execute e passeie com o mouse pelo palco!

> Na verificação, o mouse fica parado no centro: o Bloquinho precisa ir até lá.`,
          allowedBlocks: SENSORES,
          starter: game({ sprites: [{ name: "Bloquinho", x: 150, y: 100 }] }),
          checks: {
            maxSeconds: 3,
            checks: [
              { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "Dentro do “sempre”, aponte para o mouse" },
              { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "Dentro do “sempre”, mova o Bloquinho" },
              { type: "finalPosition", x: 0, y: 0, tolerance: 12, message: "O Bloquinho precisa chegar até o mouse (no centro do palco, na verificação)." },
            ],
          },
          guide: {
            objetivo: "Usar o mouse como controle.",
            minutos: 10,
            passos: ["Compare “aponte + mova” (persegue) com “vá para o ponteiro do mouse” (teletransporta)."],
            errosComuns: ["Bloquinho tremendo em cima do mouse: só ande se a distância até o mouse for > 10."],
          },
          extra: "Faça o Bloquinho só andar **se distância até o ponteiro do mouse > 10** — ele para de tremer.",
        },
        {
          slug: "cronometro",
          title: "Cronômetro",
          type: "EXERCICIO",
          content: `## Missão: quanto tempo passou?

1. **zere o cronômetro**
2. **espere 2 segundos**
3. **diga (arredondar (cronômetro))**

O Bloquinho vai dizer **2**!`,
          allowedBlocks: [...SENSORES],
          starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
          checks: {
            maxSeconds: 4,
            checks: [
              { type: "usesBlock", opcode: "sensing_resettimer" },
              { type: "usesBlock", opcode: "sensing_timer" },
              { type: "said", text: "2" },
            ],
          },
          guide: {
            objetivo: "Medir tempo — base de corridas e de jogos de sobrevivência.",
            minutos: 10,
            passos: ["Mostre o que acontece sem o “arredondar”: aparecem casas decimais."],
            errosComuns: ["Não zerar o cronômetro no início."],
          },
        },
        {
          slug: "fuja-do-glitch",
          title: "Crie: fuja do Glitch",
          type: "DESAFIO",
          xp: 35,
          content: `# 🏆 Fuja do Glitch!

1. No **Glitch**: **sempre** → **aponte para [Bloquinho]** → **mova 3 passos** → **se tocando em [Bloquinho]? então** → **diga “Peguei você!”** e **pare [tudo]**.
2. No **Bloquinho**: o **controle suave** com as 4 setas para fugir.

Quanto tempo você consegue escapar?`,
          allowedBlocks: SENSORES,
          starter: game({ backdrops: ["castelo"], sprites: [{ name: "Bloquinho", x: -150 }, { name: "Glitch", character: "glitch", x: 150 }] }),
          checks: {
            maxSeconds: 10,
            checks: [
              { type: "inside", parent: ["control_forever"], child: ["motion_pointtowards"], label: "O Glitch aponta para o Bloquinho dentro do “sempre”" },
              { type: "said", text: "Peguei" },
              { type: "stopped" },
              { type: "keys", min: 4, bonus: true, message: "Bônus: controle o Bloquinho com as 4 setas." },
            ],
          },
          guide: {
            objetivo: "Criar um inimigo que persegue e uma condição de derrota.",
            minutos: 25,
            passos: ["Discuta equilíbrio: qual velocidade do Glitch deixa o jogo divertido?"],
            errosComuns: ["Glitch rápido demais: o jogo acaba antes de começar."],
          },
          extra: "Mostre por quanto tempo o jogador sobreviveu usando o **cronômetro**.",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "cor-perigosa",
          title: "Cor perigosa no PictoBlox",
          type: "EXERCICIO",
          content: `## Missão: lava! (só no PictoBlox)

O PictoBlox tem um sensor a mais: **tocando na cor [ ]?**. Pinte uma área **vermelha** no cenário (lava 🌋). **Se** o ator **tocar na cor vermelha**, ele diz **Ai!** e volta para o início.

Use: **sempre** → **se tocando na cor [vermelho]? então** → reação.`,
          checks: {
            checks: [
              { type: "usesAnyBlock", opcodes: ["sensing_touchingcolor"], label: "Use o sensor “tocando na cor …?”" },
              { type: "inside", parent: ["control_forever"], child: IFS, label: "Coloque o “se” dentro de um “sempre”" },
              { type: "inside", parent: IFS, child: ["*"], label: "Algo acontece quando toca na cor" },
            ],
          },
          guide: {
            objetivo: "Conhecer um sensor que só existe no PictoBlox, aplicando o mesmo padrão sempre + se.",
            minutos: 15,
            passos: ["Mostre o conta-gotas para escolher exatamente a cor do cenário no bloco."],
            errosComuns: ["Cor do bloco ligeiramente diferente da cor pintada: use o conta-gotas."],
          },
        }),
      ],
    },
  ],
};

export const mundo7: TrackContent = {
  slug: "mundo-7-cofre-dos-pontos",
  title: "Mundo 7 · Cofre dos Pontos",
  description: "Variáveis e operadores: placar, contadores, contas e textos — o coração de todo jogo.",
  story: "O Cofre dos Pontos guardava os placares de todos os jogos do reino, e o Glitch zerou tudo. Aprenda a guardar e calcular valores para reabrir o cofre.",
  level: 2,
  order: 7,
  modules: [
    {
      title: "Guardando informações",
      lessons: [
        editor("caixinhas-com-nome", {
          objetivo: "Entender variável como um valor com nome que pode mudar.",
          minutos: 10,
          passos: ["Use caixas de papel com etiquetas (pontos, vidas) e mude os valores na frente da turma."],
          errosComuns: ["Confundir “mude para” (troca) com “adicione” (soma)."],
        }),
        editor("placar", {
          objetivo: "Inicializar e alterar uma variável.",
          minutos: 10,
          passos: ["Pergunte: o que acontece se não começarmos com “mude pontos para 0”?"],
          errosComuns: ["Esquecer a inicialização."],
        }),
        editor("contando-passos", {
          objetivo: "Usar uma variável como contador dentro de um laço.",
          minutos: 10,
          passos: ["Mostre o bloco redondo “pontos” encaixado no “diga”."],
          errosComuns: ["Digitar a palavra “pontos” no diga, em vez de encaixar o bloco."],
        }),
      ],
    },
    {
      title: "Fazendo contas",
      lessons: [
        editor("calculadora", {
          objetivo: "Usar operadores matemáticos.",
          minutos: 5,
          passos: ["Peça para a turma calcular de cabeça antes de rodar."],
          errosComuns: ["Digitar o resultado em vez de usar o operador."],
        }, "Faça o Bloquinho dizer quantos segundos há em um dia (60 × 60 × 24)."),
        editor("juntando-palavras", {
          objetivo: "Juntar textos (concatenação).",
          minutos: 5,
          passos: ["Mostre o que acontece sem o espaço: “Olá,mundo!”."],
          errosComuns: ["Esquecer o espaço."],
        }),
        editor("espiral", {
          objetivo: "Usar variável para controlar o movimento.",
          minutos: 15,
          passos: ["Antes de rodar, peça para a turma prever o caminho."],
          errosComuns: ["Mudar a variável antes de mover: a primeira caminhada fica com 20."],
        }, "Troque o giro de 90 por 120. Que forma o caminho faz? 🌀"),
        editor("tabuada-do-3", {
          objetivo: "Combinar variável, laço e operação.",
          minutos: 15,
          passos: ["Deixe a turma tentar a tabuada do 7 depois."],
          errosComuns: ["Somar 3 depois de falar: a sequência começa em 0."],
        }),
        {
          slug: "placar-do-jogo",
          title: "Placar do jogo",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: conte as moedas

O Bloquinho já está andando pelo palco. Agora programe a **Moeda**:

1. Quando a bandeira for clicada: **mude pontos para 0**.
2. **sempre** → **se tocando em [Bloquinho]? então** → **adicione 1 a pontos**, **toque o som Moeda** e **vá para [posição aleatória]**.

O placar aparece no canto do palco!`,
          allowedBlocks: [...SENSORES, "data_setvariableto", "data_changevariableby", "data_variable"],
          starter: game({
            variables: ["pontos"],
            sprites: [
              { name: "Bloquinho", x: -150, code: [[flag(), forever(changeX(4), ifEdgeBounce())]] },
              { name: "Moeda", character: "moeda", x: 40 },
            ],
          }),
          checks: {
            maxSeconds: 6,
            checks: [
              { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece com “mude pontos para 0” quando a bandeira for clicada" },
              { type: "inside", parent: IFS, child: ["data_changevariableby"], label: "Some pontos dentro de um “se” (quando tocar no Bloquinho)" },
              { type: "variableAtLeast", name: "pontos", min: 1, message: "Quando o Bloquinho passar pela moeda, os pontos precisam subir." },
              { type: "playedSound", sound: "moeda", bonus: true, message: "Bônus: toque o som Moeda ao pegar." },
            ],
          },
          guide: {
            objetivo: "Criar um placar real: inicializar, somar com colisão e exibir.",
            minutos: 20,
            passos: ["Discuta: por que a moeda precisa mudar de lugar depois de pega? (senão soma várias vezes)"],
            errosComuns: ["Pontos subindo sem parar: a moeda não sai do lugar depois de tocada."],
          },
          extra: "Crie uma variável **recorde** que guarda a maior pontuação (botão **Criar uma variável**).",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "placar-no-jogo",
          title: "Placar no PictoBlox",
          type: "EXERCICIO",
          xp: 25,
          content: `## Missão: o cofre de pontos no PictoBlox

1. Em **Variáveis**, clique em **Criar uma variável** e chame de **pontos**.
2. Na bandeira: **mude pontos para 0**.
3. Quando o herói **tocar** em uma estrela, **adicione 1 a pontos** e mande a estrela para outro lugar.`,
          checks: {
            checks: [
              { type: "variables", min: 1 },
              { type: "inScript", hat: [FLAG], opcodes: ["data_setvariableto"], label: "Comece o jogo com “mude pontos para 0”" },
              { type: "inside", parent: IFS, child: ["data_changevariableby"], label: "Some pontos dentro de um “se”" },
              { type: "usesAnyBlock", opcodes: ["sensing_touchingobject"], label: "Use “tocando em …?” para pegar a estrela" },
            ],
          },
          guide: {
            objetivo: "Transferir variáveis e placar para o PictoBlox.",
            minutos: 20,
            passos: ["Mostre a caixinha que exibe a variável no palco do PictoBlox."],
            errosComuns: ["Não zerar os pontos no início."],
          },
        }),
      ],
    },
  ],
};
