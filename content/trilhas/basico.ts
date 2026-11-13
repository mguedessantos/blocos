import { flag, game } from "../../src/lib/blocks/build";
import { editor } from "../licoes-editor";
import { ABERTURA, PICTOBLOX_INTRO } from "./historia";
import type { LessonContent, TrackContent } from "./types";

const FLAG = "event_whenflagclicked";

/** Missão opcional de transferência para o PictoBlox (.sb3). */
export function pictoblox(l: Omit<LessonContent, "mode" | "optional">): LessonContent {
  return { ...l, mode: "SB3", optional: true, content: `${PICTOBLOX_INTRO}\n\n${l.content}` };
}

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
              "Se a escola tiver o PictoBlox, conte que haverá missões opcionais 🚀 para levar o que aprenderam para lá.",
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
        }, "Faça o Bloquinho andar **200 passos** e depois mais **40**. Onde ele parou?"),
        editor("virando-a-esquina", {
          objetivo: "Combinar andar e girar; entender 90 graus como uma esquina.",
          minutos: 10,
          passos: ["Peça para um aluno “ser o robô” na sala enquanto a turma dá os comandos.", "Pergunte: girar para a direita ou para a esquerda?"],
          errosComuns: ["Girar para o lado errado (↻ em vez de ↺)."],
        }, "Continue virando e andando até o Bloquinho dar a volta e chegar de novo no centro."),
        editor("pule-para-cima", {
          objetivo: "Entender o palco como um mapa e o y positivo (para cima).",
          minutos: 10,
          passos: ["Desenhe o plano cartesiano no quadro com o centro (0,0) e mostre o topo (y: 180)."],
          errosComuns: ["Mudar o x em vez do y."],
        }, "Pule para **y: 90**. Onde o Bloquinho parou?"),
        editor("pule-para-baixo", {
          objetivo: "Entender o y negativo (para baixo).",
          minutos: 10,
          passos: ["Pergunte: se o topo é 180, o que é o chão?"],
          errosComuns: ["Esquecer o sinal de menos."],
        }, "Pule para **y: -90**, no meio do caminho até o chão."),
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
        }, "Faça o Bloquinho visitar os **4 cantos** do palco usando só blocos “vá para x: y:”."),
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
        }, "Crie um pequeno diálogo: o Bloquinho se apresenta em 3 falas diferentes."),
        {
          slug: "apresentacao",
          title: "Crie: a apresentação do Bloquinho",
          type: "DESAFIO",
          xp: 25,
          content: `# 🏆 Crie: o Bloquinho se apresenta

Agora é com você! Monte uma pequena apresentação do Bloquinho para a turma:

- Ele precisa **falar pelo menos 2 frases** (use **diga … por … segundos**).
- Ele precisa **andar** pelo palco.
- Use uma **espera** em algum momento.

Não existe resposta única: invente a sua!`,
          allowedBlocks: [FLAG, "motion_movesteps", "motion_turnright", "motion_turnleft", "motion_gotoxy", "looks_sayforsecs", "looks_say", "control_wait"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "looks_sayforsecs", min: 2, message: "O Bloquinho precisa falar pelo menos 2 frases com “diga … por … segundos”.", goal: "Fale pelo menos **2 frases** com **diga … por … segundos**" },
              { type: "usesAnyBlock", opcodes: ["motion_movesteps", "motion_gotoxy"], label: "Faça o Bloquinho andar pelo palco", goal: "Faça o Bloquinho **andar** pelo palco" },
              { type: "walked", min: 30, message: "O Bloquinho precisa sair do lugar.", goal: "Faça o Bloquinho **andar** pelo palco" },
              { type: "usesBlock", opcode: "control_wait", goal: "Use uma **espera** em algum momento" },
            ],
          },
          guide: {
            objetivo: "Criar livremente combinando fala, movimento e espera.",
            minutos: 15,
            passos: ["Deixe 10 minutos de criação livre.", "Peça para 2 ou 3 alunos mostrarem a apresentação no projetor."],
            errosComuns: ["Querer escrever textos enormes: o balão mostra até 40 letras."],
          },
          extra: "Use **vá para x: y:** para o Bloquinho aparecer em 3 lugares diferentes do palco enquanto fala.",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        {
          slug: "conhecendo-o-pictoblox",
          title: "Conhecendo o PictoBlox",
          type: "TEORIA",
          optional: true,
          xp: 5,
          content: `${PICTOBLOX_INTRO}

# A mesma ideia, outro programa 🛠️

O **PictoBlox** é um programa de computador que usa os **mesmos tipos de blocos** que você já conhece. Abra o PictoBlox no **modo Blocos** e encontre:

- **Palco**: onde o jogo acontece.
- **Atores** (sprites): os personagens, listados embaixo do palco.
- **Paleta de blocos**: à esquerda, separados pelas **mesmas cores** do site.
- **Área de código**: onde você encaixa os blocos.
- **Bandeira verde** 🏁: começa. O **botão vermelho** para tudo.

## Salvando

No menu **Arquivo → Salvar no seu computador**, o PictoBlox cria um arquivo **.sb3**. É esse arquivo que você envia nas missões 🚀.`,
          guide: {
            objetivo: "Reconhecer no PictoBlox as mesmas partes do editor do site (transferência).",
            minutos: 15,
            passos: [
              "Coloque o site e o PictoBlox lado a lado e peça para a turma achar as partes iguais.",
              "Todos salvam um projeto vazio no computador para treinar o caminho Arquivo → Salvar.",
            ],
            errosComuns: ["Salvar no modo Python em vez do modo Blocos.", "Não achar o arquivo salvo: combine uma pasta da turma."],
          },
        },
        pictoblox({
          slug: "primeiro-projeto",
          title: "Olá, mundo! no PictoBlox",
          type: "EXERCICIO",
          xp: 15,
          content: `## Missão: o mesmo programa no PictoBlox

Faça no PictoBlox o que você já fez aqui: o ator **anda** e diz **Olá, mundo!** quando a bandeira verde for clicada.

1. Em **Eventos**, arraste **quando ⚑ for clicado**.
2. Em **Movimento**, encaixe **mova 10 passos**.
3. Em **Aparência**, encaixe **diga Olá! por 2 segundos** e troque o texto para **Olá, mundo!**.
4. Teste, salve e envie o arquivo .sb3.`,
          checks: {
            checks: [
              { type: "inScript", hat: [FLAG], opcodes: ["motion_movesteps"], label: "Use “mova … passos” embaixo da bandeira verde", goal: "Use **mova … passos** embaixo da bandeira verde" },
              { type: "inScript", hat: [FLAG], opcodes: ["looks_say", "looks_sayforsecs"], label: "Use um bloco “diga” embaixo da bandeira verde", goal: "Use um bloco **diga** embaixo da bandeira verde" },
              { type: "textContains", opcodes: ["looks_say", "looks_sayforsecs"], text: "mundo", label: "A frase precisa ter a palavra “mundo”", goal: "A frase precisa ter a palavra **mundo**" },
            ],
          },
          guide: {
            objetivo: "Transferir o primeiro programa do site para o PictoBlox.",
            minutos: 15,
            passos: ["Peça para a turma comparar: quais blocos têm nomes um pouco diferentes? (“mover” × “mova”)."],
            errosComuns: ["Blocos soltos, sem encaixar no “quando ⚑ for clicado”."],
          },
        }),
      ],
    },
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
        }, "Faça um quadrado **maior**, de 150 passos. O que muda no programa?"),
        editor("triangulo", {
          objetivo: "Generalizar: em um polígono, a soma dos giros é 360.",
          minutos: 10,
          passos: ["Pergunte: se o quadrado gira 4 × 90 = 360, quanto o triângulo gira em cada canto?"],
          errosComuns: ["Girar 60 (ângulo interno) em vez de 120 (ângulo externo)."],
        }, "Ande em um **hexágono** (6 lados). Qual é o giro?"),
        editor("escada", {
          objetivo: "Repetir uma sequência de vários blocos.",
          minutos: 10,
          passos: ["Desenhe um degrau no quadro e peça para a turma ditar os 4 movimentos."],
          errosComuns: ["Esquecer de girar de volta para a direita no fim de cada degrau."],
        }),
      ],
    },
    {
      title: "Repetir para sempre",
      lessons: [
        editor("para-sempre", {
          objetivo: "Usar o laço infinito e o bloco de quicar.",
          minutos: 10,
          passos: ["Explique que jogos rodam dentro de um “sempre”: o jogo nunca para sozinho."],
          errosComuns: ["Apontar para 90: o Bloquinho fica só indo e voltando na horizontal."],
        }),
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "patrulha",
          title: "O guarda que patrulha",
          type: "EXERCICIO",
          xp: 20,
          content: `## Missão: um guarda no PictoBlox

Use no PictoBlox o **sempre** que você aprendeu:

1. Quando a bandeira for clicada, use **sempre**.
2. Dentro do sempre: **mova 5 passos** e **se tocar na borda, volte**.
3. Para o guarda não ficar de cabeça para baixo: **defina o estilo de rotação para esquerda-direita**.`,
          checks: {
            checks: [
              { type: "inside", parent: ["control_forever"], child: ["motion_movesteps"], label: "O guarda anda dentro de um “sempre”" },
              { type: "inside", parent: ["control_forever"], child: ["motion_ifonedgebounce"], label: "Use “se tocar na borda, volte” dentro do “sempre”" },
              { type: "usesAnyBlock", opcodes: ["motion_setrotationstyle"], label: "Use “defina o estilo de rotação”", bonus: true },
            ],
          },
          guide: {
            objetivo: "Transferir o laço infinito para o PictoBlox.",
            minutos: 15,
            passos: ["Lembre a missão “Para sempre!” do site e peça para a turma refazer no PictoBlox."],
            errosComuns: ["Ator de cabeça para baixo ao quicar: falta o estilo de rotação."],
          },
        }),
      ],
    },
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
          content: `# Seu palco, seus personagens 🎭

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
              { type: "sprites", min: 2, message: "Adicione um amigo com o botão “+ Ator”." },
              { type: "usesAnyBlock", opcodes: ["looks_sayforsecs", "looks_say"], min: 2, label: "Os dois atores precisam falar (um bloco “diga” em cada)" },
              { type: "usesBlock", opcode: "control_wait", message: "Use uma espera para o amigo responder depois." },
            ],
          },
          guide: {
            objetivo: "Programar dois atores e sincronizar falas com espera.",
            minutos: 15,
            passos: ["Mostre como selecionar cada ator para montar o código dele.", "Pergunte: por que o amigo precisa esperar?"],
            errosComuns: ["Colocar os dois “diga” no mesmo ator.", "Falas sobrepostas por falta da espera."],
          },
          extra: "Faça uma conversa com **3 falas** de cada ator.",
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
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_nextcostume"], label: "Coloque “próxima fantasia” dentro do repita" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["motion_movesteps", "motion_changexby"], label: "Coloque um bloco de movimento dentro do repita" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["control_wait"], label: "Use uma espera dentro do repita para a animação não ficar rápida demais" },
              { type: "walked", min: 80, message: "O Bloquinho precisa andar enquanto troca de fantasia." },
            ],
          },
          guide: {
            objetivo: "Criar animação trocando fantasias em um laço — técnica básica de todo jogo.",
            minutos: 15,
            passos: ["Mostre um desenho animado quadro a quadro (flipbook) para explicar a ideia.", "Testem diferentes tempos de espera: 0.5, 0.2, 0.05."],
            errosComuns: ["Sem espera, a animação fica rápida demais para ver.", "Blocos fora do repita."],
          },
          extra: "Troque o repita por **sempre** e use **se tocar na borda, volte**: o Bloquinho vai passear pelo palco.",
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
              { type: "usesBlock", opcode: "looks_switchbackdropto" },
              { type: "backdropIs", backdrop: "floresta" },
              { type: "said", text: "passear" },
            ],
          },
          guide: {
            objetivo: "Trocar cenários pelo código (base para fases e telas de jogo).",
            minutos: 10,
            passos: ["Mostre o botão “Cenário” e o palco no painel."],
            errosComuns: ["Trocar o cenário antes de o Bloquinho falar (a ordem dos blocos importa)."],
          },
          extra: "Adicione o cenário **Espaço** e faça o Bloquinho visitar os 3 lugares, um de cada vez.",
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
              { type: "usesAnyBlock", opcodes: ["sound_play", "sound_playuntildone"], min: 2, label: "Toque pelo menos 2 sons" },
              { type: "playedSound", sound: "pulo" },
              { type: "playedSound", sound: "vitoria" },
            ],
          },
          guide: {
            objetivo: "Usar sons como retorno para o jogador.",
            minutos: 10,
            passos: ["Compare “toque o som” e “toque o som até o fim”: qual espera?", "Fones de ouvido ajudam muito nesta aula!"],
            errosComuns: ["Achar que o som não tocou porque o computador está no mudo."],
          },
        },
        {
          slug: "show-de-talentos",
          title: "Crie: show de talentos",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Crie: o show de talentos

Monte um pequeno show com **pelo menos 2 atores**:

- Um cenário de **palco de show** (escolha qualquer cenário além do branco) e troque para ele no começo.
- Um ator faz uma **dança** (repita: próxima fantasia, gire, espere...).
- Toque pelo menos **um som**.
- No fim, alguém diz **“Obrigado!”**.`,
          allowedBlocks: VIDA,
          starter: game({ sprites: [{ name: "Bloquinho", code: [[flag()]] }] }),
          checks: {
            checks: [
              { type: "sprites", min: 2, message: "Coloque pelo menos 2 atores no show." },
              { type: "backdrops", min: 2, message: "Escolha um cenário para o show (botão “Cenário”)." },
              { type: "usesBlock", opcode: "looks_switchbackdropto" },
              { type: "inside", parent: ["control_repeat", "control_forever"], child: ["looks_nextcostume", "motion_turnright"], label: "Faça uma dança dentro de um repita" },
              { type: "playedSound" },
              { type: "said", text: "obrigad" },
            ],
          },
          guide: {
            objetivo: "Combinar atores, fantasias, cenários e sons em uma criação própria.",
            minutos: 25,
            passos: ["Faça uma “sessão de estreia” com alguns shows projetados.", "Valorize ideias diferentes, não só as mais complexas."],
            errosComuns: ["Esquecer de selecionar o ator certo antes de montar os blocos."],
          },
          extra: "Faça a plateia (outros atores) **aplaudir** trocando de fantasia no fim do show.",
        },
      ],
    },
    {
      title: "Leve para o PictoBlox (opcional)",
      lessons: [
        pictoblox({
          slug: "disfarce-e-canto",
          title: "Disfarce e canto no PictoBlox",
          type: "EXERCICIO",
          content: `## Missão: fantasias e sons no PictoBlox

No PictoBlox, os atores também têm **fantasias** e **sons** (veja as abas **Fantasias** e **Sons**).

Quando a bandeira for clicada: **próxima fantasia** e **toque o som … até o fim**. Teste, salve e envie.`,
          checks: {
            checks: [
              { type: "costumes", min: 2 },
              { type: "sounds", min: 1 },
              { type: "inScript", hat: [FLAG], opcodes: ["looks_nextcostume", "looks_switchcostumeto"], label: "Troque de fantasia quando a bandeira for clicada" },
              { type: "inScript", hat: [FLAG], opcodes: ["sound_play", "sound_playuntildone"], label: "Toque um som quando a bandeira for clicada" },
            ],
          },
          guide: {
            objetivo: "Transferir fantasias e sons para o PictoBlox; conhecer as abas Fantasias e Sons.",
            minutos: 15,
            passos: ["No PictoBlox dá para gravar a própria voz na aba Sons: os alunos adoram."],
            errosComuns: ["Escolher um ator com só 1 fantasia."],
          },
        }),
      ],
    },
  ],
};
