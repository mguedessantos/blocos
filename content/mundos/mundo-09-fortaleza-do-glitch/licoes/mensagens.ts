import { BROADCAST, RECEIVE, TODOS } from "../../blocos/avancado";
import { broadcast, game, sayFor, whenClicked, whenReceive } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [
  { name: "Botão", character: "botao", y: -110, code: [[whenClicked(), broadcast("começar")]] },
  { name: "Bloquinho", y: 40, code: [[whenReceive("começar"), sayFor("Vamos!", 2)]] },
  ] },
  erros: [
    { sprites: [
    { name: "Botão", character: "botao", y: -110, code: [[whenClicked(), broadcast("começar")]] },
    { name: "Bloquinho", y: 40, code: [[whenReceive("comecar"), sayFor("Vamos!", 2)]] },
    ] },
  ],
};
