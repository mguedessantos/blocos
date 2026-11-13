import type { TrackContent } from "../trilhas/types";

const MOVE = ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "motion_turnleft", "motion_pointindirection"];
const POS = ["motion_gotoxy", "motion_setx", "motion_sety", "motion_changexby", "motion_changeyby", "motion_xposition", "motion_yposition"];
const COMPARE = ["operator_gt", "operator_lt", "operator_equals"];

export const condicionais: TrackContent = {
  slug: "condicionais-e-sensores",
  title: "Condicionais e Sensores",
  description: "Ensine o Bloquinho a tomar decisões: se isso acontecer, faça aquilo.",
  level: 3,
  order: 3,
  modules: [
    {
      title: "Tomando decisões",
      lessons: [
        {
          slug: "se-entao",
          title: "Se... então",
          type: "TEORIA",
          xp: 5,
          content: `# O Bloquinho aprende a pensar 🤔

Todo dia você toma decisões: **se** estiver chovendo, **então** leva o guarda-chuva.

Os programas também! O bloco **se ▢ então** só executa os blocos de dentro quando a **condição** for verdadeira.

## As condições

- Têm a forma de um **hexágono** ⬡ e só cabem nos espaços hexagonais.
- **tocando na borda?** é verdadeiro quando o Bloquinho encosta na borda do palco.
- **▢ > ▢**, **▢ < ▢** e **▢ = ▢** comparam números, como **posição x > 100**.

## Se... senão

O bloco **se ▢ então ... senão** tem dois caminhos: um para quando a condição é verdadeira e outro para quando é falsa.`,
        },
        {
          slug: "bate-e-volta",
          title: "Bate e volta",
          type: "EXERCICIO",
          content: `## Missão: não bata a cabeça!

Faça o Bloquinho andar **10 passos, 30 vezes**. Mas atenção: **se** ele estiver **tocando na borda**, ele deve **girar 180 graus** para voltar.

No final, ele vai estar olhando para a **esquerda**.`,
          allowedBlocks: [...MOVE, "control_repeat", "control_if", "sensing_touchingobject"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_if" },
              { type: "usesBlock", opcode: "sensing_touchingobject" },
              { type: "finalDirection", direction: -90, message: "Quando tocar na borda, o Bloquinho precisa virar para a esquerda (girar 180)." },
            ],
          },
        },
        {
          slug: "direita-ou-esquerda",
          title: "Direita ou esquerda?",
          type: "EXERCICIO",
          content: `## Missão: onde estou?

1. Mude o **x** do Bloquinho para **150**.
2. Use **se ▢ então ... senão**: **se** a **posição x > 0**, ele diz **Direita!**; **senão**, diz **Esquerda!**.

Teste também com x **-150** para ver o outro caminho funcionando!`,
          allowedBlocks: [...MOVE, ...POS, ...COMPARE, "control_if", "control_if_else", "looks_say", "looks_sayforsecs"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_if_else" },
              { type: "usesBlock", opcode: "motion_xposition" },
              { type: "said", text: "Direita" },
            ],
          },
        },
        {
          slug: "volta-ao-mundo",
          title: "Volta ao mundo",
          type: "EXERCICIO",
          xp: 15,
          content: `## Missão: saiu de um lado, entra pelo outro

Repita **20 vezes**: adicione **15** ao x. **Se** a **posição x > 150**, mude o x para **-150** — como num videogame em que o personagem sai por um lado da tela e aparece do outro!`,
          allowedBlocks: [...MOVE, ...POS, ...COMPARE, "control_repeat", "control_if"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_if" },
              { type: "usesBlock", opcode: "operator_gt" },
              { type: "finalPosition", x: -15, y: 0, message: "Confira as regras: +15 no x a cada vez e, passando de 150, volta para -150." },
            ],
          },
        },
      ],
    },
    {
      title: "Condições combinadas",
      lessons: [
        {
          slug: "e-ou-nao",
          title: "E, ou, não",
          type: "EXERCICIO",
          content: `## Missão: o canto de cima

Às vezes precisamos de **duas** condições ao mesmo tempo. O bloco **▢ e ▢** só é verdadeiro quando as duas forem verdadeiras.

1. Leve o Bloquinho para **x: 80, y: 60**.
2. **Se** a **posição x > 0** **e** a **posição y > 0**, ele diz **Canto de cima!**`,
          allowedBlocks: [...MOVE, ...POS, ...COMPARE, "operator_and", "operator_or", "operator_not", "control_if", "control_if_else", "looks_say"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "operator_and" },
              { type: "usesBlock", opcode: "control_if" },
              { type: "said", text: "Canto de cima" },
            ],
          },
        },
        {
          slug: "ate-a-borda",
          title: "Até a borda",
          type: "EXERCICIO",
          content: `## Missão: ande até encostar

O bloco **repita até que ▢** repete os blocos **até** a condição ficar verdadeira.

Faça o Bloquinho andar **5 passos** **até que** esteja **tocando na borda**. Depois, ele diz **Cheguei!**`,
          allowedBlocks: [...MOVE, "control_repeat_until", "sensing_touchingobject", "looks_say"],
          startWithFlag: true,
          checks: {
            checks: [
              { type: "usesBlock", opcode: "control_repeat_until" },
              { type: "said", text: "Cheguei" },
              { type: "finalPosition", x: 220, y: 0, tolerance: 6, message: "O Bloquinho precisa parar quando encostar na borda da direita." },
            ],
          },
        },
        {
          slug: "robo-aspirador",
          title: "Aspirador de pó",
          type: "DESAFIO",
          xp: 30,
          content: `# 🏆 Desafio: o aspirador de pó

Alguns aspiradores de pó andam sozinhos: vão reto até bater na parede, aí giram e continuam limpando.

Programe o Bloquinho para andar **para sempre**: a cada passo, **se** estiver **tocando na borda**, ele **gira** (você escolhe quanto!) e continua.

Ele precisa andar pelo palco sem ficar preso na parede.`,
          allowedBlocks: [...MOVE, "control_forever", "control_if", "control_if_else", "sensing_touchingobject", "operator_random"],
          startWithFlag: true,
          checks: {
            maxSeconds: 10,
            checks: [
              { type: "usesBlock", opcode: "control_forever" },
              { type: "usesBlock", opcode: "sensing_touchingobject" },
              { type: "walked", min: 1500, message: "O Bloquinho ficou preso! Quando tocar na borda, gire o suficiente para sair dela." },
              { type: "noBlock", opcode: "motion_ifonedgebounce", message: "Faça sem o bloco “se tocar na borda, volte” — use o “se” e o sensor." },
            ],
          },
        },
      ],
    },
  ],
};
