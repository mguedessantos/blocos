import { flag, game } from "../../src/lib/blocks/build";
import { editor } from "../licoes-editor";
import { modulo as bola } from "./bola-quicando";
import { modulo as corrida } from "./corrida-animada";
import { modulo as tesouro } from "./caca-ao-tesouro";
import { ABERTURA } from "./historia";
import type { TrackContent } from "./types";

const FLAG = "event_whenflagclicked";

// Blocos liberados nas lições de “personagens com vida”
const VIDA = [
  FLAG, "motion_movesteps", "motion_turnright", "motion_gotoxy", "motion_changexby", "motion_changeyby",
  "looks_say", "looks_sayforsecs", "looks_nextcostume", "looks_switchcostumeto", "looks_switchbackdropto", "looks_nextbackdrop",
  "looks_show", "looks_hide", "looks_changesizeby", "looks_setsizeto", "sound_play", "sound_playuntildone",
  "control_wait", "control_repeat", "control_forever",
];

// ═══════════════════════ NÍVEL BÁSICO ═══════════════════════

export const mundo1: TrackContent = {
  slug: "mundo-1-vila-do-palco",
  title: "Mundo 1 · Vila do Palco",
  description: "Conheça o Bloquinho e o editor: andar, girar, coordenadas, esperar e falar.",
  story: "A Vila do Palco é onde todo jogo começa — e ela está escura. Ensine o Bloquinho a dar os primeiros passos e acenda as primeiras faíscas de aura.",
  level: 1,
  order: 1,
  modules: [
    {
      title: "Bem-vindo(a), Criador(a)!",
      lessons: [
        {
          slug: "a-grande-pane",
          title: "A Grande Pane",
          type: "TEORIA",
          xp: 5,
          content: ABERTURA,
          guide: {
            objetivo: "Apresentar a jornada, o Bloquinho e como as missões funcionam.",
            minutos: 10,
            passos: [
              "Leia a história em voz alta com a turma ou peça para alguém ler.",
              "Combine com a turma: no fim da jornada, vamos fazer uma game jam em equipes.",
            ],
            errosComuns: ["Alunos ansiosos para pular a leitura: combine que a história traz pistas para as missões."],
          },
        },
        editor("conheca-o-bloquinho", {
          objetivo: "Conhecer o editor: área de blocos, palco, bandeira verde e Verificar.",
          minutos: 10,
          passos: [
            "Projete o editor e mostre cada parte: categorias de blocos, área de montagem, palco e botões.",
            "Mostre que os blocos precisam ficar ENCAIXADOS embaixo do bloco amarelo para funcionar.",
          ],
          errosComuns: ["Achar que “Verificar” só mostra o resultado: ele confere a missão e dá as estrelas."],
        }),
      ],
    },
    {
      title: "Movendo o Bloquinho",
      lessons: [
        editor("primeiros-passos", {
          objetivo: "Usar evento + movimento e entender que a ordem dos blocos importa.",
          minutos: 10,
          passos: ["Mostre que o bloco precisa ficar encaixado embaixo da bandeira.", "Deixe errar: “e se colocar 10?”. Depois peça 100.", "Mostre que o objetivo fica marcado sozinho quando o programa está certo."],
          errosComuns: ["Bloco solto ao lado da bandeira.", "Digitar 100 no bloco errado (girar)."],
        }),
        editor("virando-a-esquina", {
          objetivo: "Combinar andar e girar; entender 90 graus como uma esquina.",
          minutos: 10,
          passos: ["Peça para um aluno “ser o robô” na sala enquanto a turma dá os comandos.", "Pergunte: girar para a direita ou para a esquerda?"],
          errosComuns: ["Girar para o lado errado (↻ em vez de ↺)."],
        }),
        editor("pule-para-cima", {
          objetivo: "Entender o palco como um mapa e o y positivo (para cima).",
          minutos: 10,
          passos: ["Desenhe o plano cartesiano no quadro com o centro (0,0) e mostre o topo (y: 180)."],
          errosComuns: ["Mudar o x em vez do y."],
        }),
        editor("pule-para-baixo", {
          objetivo: "Entender o y negativo (para baixo).",
          minutos: 10,
          passos: ["Pergunte: se o topo é 180, o que é o chão?"],
          errosComuns: ["Esquecer o sinal de menos."],
        }),
        editor("pule-para-a-esquerda", {
          objetivo: "Entender o x negativo (para a esquerda).",
          minutos: 10,
          passos: ["Peça para a turma apontar no quadro onde fica x: -240."],
          errosComuns: ["Colocar o -240 no y."],
        }),
        editor("pule-para-a-direita", {
          objetivo: "Entender o x positivo (para a direita).",
          minutos: 10,
          passos: ["Compare com a lição anterior: o que muda é só o sinal."],
          errosComuns: ["Colocar 240 no y."],
        }),
        editor("pule-para-o-canto", {
          objetivo: "Combinar x e y num mesmo pulo.",
          minutos: 10,
          passos: ["Peça para a turma “adivinhar” onde fica x: 150, y: 100 antes de testar."],
          errosComuns: ["Trocar x por y."],
        }),
        editor("passeio-com-pausa", {
          objetivo: "Usar espera para controlar o tempo de uma animação.",
          minutos: 10,
          passos: ["Rode sem a espera e pergunte: deu para ver o que aconteceu?", "Adicione a espera e compare."],
          errosComuns: ["Colocar a espera no final, onde ela não muda nada visível."],
        }),
        editor("diga-ola", {
          objetivo: "Usar blocos de fala e combinar fala com movimento.",
          minutos: 10,
          passos: ["Compare “diga” e “diga por 2 segundos”: qual espera antes de continuar?"],
          errosComuns: ["Usar “diga” (sem segundos) e o movimento acontecer junto com a fala."],
        }),
      ],
    },
    tesouro,
  ],
};

export const mundo2: TrackContent = {
  slug: "mundo-2-torre-das-repeticoes",
  title: "Mundo 2 · Torre das Repetições",
  description: "Repita, sempre e repetições dentro de repetições: figuras, padrões e movimento sem fim.",
  story: "A Torre das Repetições só abre para quem sabe fazer muito com pouco. Cada andar guarda um padrão — descubra-os e a torre volta a brilhar.",
  level: 1,
  order: 2,
  modules: [
    {
      title: "Repetir é poder",
      lessons: [
        editor("por-que-repetir", {
          objetivo: "Entender por que laços evitam blocos repetidos.",
          minutos: 5,
          passos: ["Pergunte: como você explicaria a um amigo “pule 20 vezes”? Você fala 20 vezes “pule”?"],
          errosComuns: ["Achar que o repita “repete o programa todo”: só repete o que está DENTRO."],
        }),
        editor("dez-passinhos", {
          objetivo: "Usar o bloco repita com um bloco dentro.",
          minutos: 10,
          passos: ["Compare 10 blocos “mover” com 1 repita: qual é mais fácil de mudar para 20 passinhos?"],
          errosComuns: ["Colocar o mover embaixo do repita, e não dentro."],
        }),
        editor("quadrado-magico", {
          objetivo: "Descobrir o padrão de um quadrado (4 × andar + girar 90).",
          minutos: 15,
          passos: ["Peça para desenharem o caminho no caderno e contarem quantas vezes repetem os mesmos movimentos."],
          errosComuns: ["Colocar o giro fora do repita.", "Girar 45 em vez de 90."],
        }),
        editor("triangulo", {
          objetivo: "Generalizar: em um polígono, a soma dos giros é 360.",
          minutos: 10,
          passos: ["Pergunte: se o quadrado gira 4 × 90 = 360, quanto o triângulo gira em cada canto?"],
          errosComuns: ["Girar 60 (ângulo interno) em vez de 120 (ângulo externo)."],
        }),
        editor("escada", {
          objetivo: "Repetir uma sequência de vários blocos.",
          minutos: 10,
          passos: ["Desenhe um degrau no quadro e peça para a turma ditar os 4 movimentos."],
          errosComuns: ["Esquecer de girar de volta para a direita no fim de cada degrau."],
        }),
      ],
    },
    bola,
  ],
};

export const mundo3: TrackContent = {
  slug: "mundo-3-personagens-com-vida",
  title: "Mundo 3 · Personagens com Vida",
  description: "Vários atores, fantasias, animação, cenários e sons: dê vida às suas histórias.",
  story: "No Mundo dos Personagens, todos ficaram parados e mudos com a Grande Pane. Dê a eles movimento, roupas, cenários e voz!",
  level: 1,
  order: 3,
  modules: [
    {
      title: "Atores e cenários",
      lessons: [
        {
          slug: "atores-e-cenarios",
          title: "Atores e cenários",
          type: "TEORIA",
          xp: 5,
          content: `# Seu palco, seus personagens

Até agora, só o Bloquinho estava no palco. A partir de agora você pode ter **vários atores**!

## No painel “Atores e palco”

- **+ Ator**: escolhe um personagem novo (moeda, estrela, Glitch, nave...).
- Clique em um ator para ver e montar **os blocos dele**. Cada ator tem o **seu próprio código**!
- Arraste os atores no palco para escolher **onde eles começam**.
- **Palco**: escolha os **cenários** (fundos) com o botão **Cenário**.

## Fantasias e sons

- Cada ator tem **fantasias** (imagens diferentes). Trocando rápido, parece que ele se mexe!
- Os blocos **rosa** tocam **sons**.`,
          guide: {
            objetivo: "Entender que cada ator tem seu próprio código, fantasias e posição.",
            minutos: 10,
            passos: ["Mostre o painel de atores: adicionar, selecionar, renomear e arrastar no palco.", "Mostre que, ao trocar de ator, a área de blocos muda."],
            errosComuns: ["Montar os blocos no ator errado: confira o nome em “Blocos de:” acima da área."],
          },
        },
        {
          slug: "um-amigo-no-palco",
          title: "Um amigo no palco",
          type: "EXERCICIO",
          content: `## Missão: um diálogo entre dois atores

1. Clique em **+ Ator** e escolha um amigo para o Bloquinho (a **Estrela**, por exemplo).
2. No **Bloquinho**: quando a bandeira for clicada → **diga “Oi, tudo bem?” por 2 segundos**.
3. No **amigo**: quando a bandeira for clicada → **espere 2 segundos** → **diga “Tudo ótimo!” por 2 segundos**.

> A espera faz o amigo responder **depois** que o Bloquinho fala.`,
          allowedBlocks: VIDA,
          starter: game({ sprites: [{ name: "Bloquinho", x: -100, code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "sprites", min: 2, message: "Adicione um amigo com o botão “+ Ator”.", goal: "Adicione um **amigo** no palco" },
              { type: "usesAnyBlock", opcodes: ["looks_sayforsecs", "looks_say"], min: 2, label: "Os dois atores precisam falar (um bloco “diga” em cada)", goal: "Os **dois atores** falam (um **diga** em cada)" },
              { type: "usesBlock", opcode: "control_wait", message: "Use uma espera para o amigo responder depois.", goal: "Use **espere** para o amigo responder depois" },
            ],
          },
          guide: {
            objetivo: "Programar dois atores e sincronizar falas com espera.",
            minutos: 15,
            passos: ["Mostre como selecionar cada ator para montar o código dele.", "Pergunte: por que o amigo precisa esperar?"],
            errosComuns: ["Colocar os dois “diga” no mesmo ator.", "Falas sobrepostas por falta da espera."],
          },
        },
        {
          slug: "animacao-de-caminhada",
          title: "Animação de caminhada",
          type: "EXERCICIO",
          xp: 15,
          content: `## Missão: ande de verdade!

Personagens de jogo parecem andar porque **trocam de fantasia** enquanto se movem. O Bloquinho tem duas fantasias: **parado** e **andando**.

Quando a bandeira for clicada, **repita 10 vezes**:
- **mova 10 passos**
- **próxima fantasia**
- **espere 0.2 segundos**`,
          allowedBlocks: VIDA,
          starter: game({ sprites: [{ name: "Bloquinho", x: -180, code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_nextcostume"], label: "Coloque “próxima fantasia” dentro do repita", goal: "Use **próxima fantasia** dentro do **repita**" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["motion_movesteps", "motion_changexby"], label: "Coloque um bloco de movimento dentro do repita", goal: "Coloque um bloco de **movimento** dentro do **repita**" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["control_wait"], label: "Use uma espera dentro do repita para a animação não ficar rápida demais", goal: "Use **espere** dentro do **repita**" },
              { type: "walked", min: 80, message: "O Bloquinho precisa andar enquanto troca de fantasia.", goal: "O Bloquinho **anda** enquanto troca de fantasia" },
            ],
          },
          guide: {
            objetivo: "Criar animação trocando fantasias em um laço — técnica básica de todo jogo.",
            minutos: 15,
            passos: ["Mostre um desenho animado quadro a quadro (flipbook) para explicar a ideia.", "Testem diferentes tempos de espera: 0.5, 0.2, 0.05."],
            errosComuns: ["Sem espera, a animação fica rápida demais para ver.", "Blocos fora do repita."],
          },
        },
        {
          slug: "troque-o-cenario",
          title: "Troque o cenário",
          type: "EXERCICIO",
          content: `## Missão: uma viagem

O palco deste projeto tem dois cenários: **Branco** e **Floresta**.

Quando a bandeira for clicada: o Bloquinho diz **“Vamos passear!”** por 2 segundos e depois **mude para o cenário Floresta**.

> Para ver os cenários, clique em **Palco** no painel de atores.`,
          allowedBlocks: VIDA,
          starter: game({ backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "usesBlock", opcode: "looks_switchbackdropto", goal: "Use **mude para o cenário**" },
              { type: "backdropIs", backdrop: "floresta", goal: "Termine no cenário **Floresta**" },
              { type: "said", text: "passear", goal: "Diga **Vamos passear!**" },
            ],
          },
          guide: {
            objetivo: "Trocar cenários pelo código (base para fases e telas de jogo).",
            minutos: 10,
            passos: ["Mostre o botão “Cenário” e o palco no painel."],
            errosComuns: ["Trocar o cenário antes de o Bloquinho falar (a ordem dos blocos importa)."],
          },
        },
        {
          slug: "sons-no-palco",
          title: "Som na caixa!",
          type: "EXERCICIO",
          content: `## Missão: faça barulho

Os blocos **rosa** tocam sons. Quando a bandeira for clicada:

1. **toque o som Pulo**
2. **mova 50 passos**
3. **toque o som Vitória até o fim**

> Ligue o som do computador (ou use fones de ouvido).`,
          allowedBlocks: VIDA,
          starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "usesAnyBlock", opcodes: ["sound_play", "sound_playuntildone"], min: 2, label: "Toque pelo menos 2 sons", goal: "Use pelo menos **2 sons**" },
              { type: "playedSound", sound: "pulo", goal: "Toque o som **Pulo**" },
              { type: "playedSound", sound: "vitoria", goal: "Toque o som **Vitória**" },
            ],
          },
          guide: {
            objetivo: "Usar sons como retorno para o jogador.",
            minutos: 10,
            passos: ["Compare “toque o som” e “toque o som até o fim”: qual espera?", "Fones de ouvido ajudam muito nesta aula!"],
            errosComuns: ["Achar que o som não tocou porque o computador está no mudo."],
          },
        },
      ],
    },
    corrida,
  ],
};
