import { BROADCAST, RECEIVE, TODOS } from "../../blocos/avancado";
import { broadcast, game, sayFor, whenClicked, whenReceive } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "mensagens",
  title: "Recados entre atores",
  type: "EXERCICIO",
  xp: 20,
  content: `## Missão: o botão de começar

Os atores podem mandar **recados** uns para os outros. Dois blocos novos (Eventos, amarelos) fazem isso:

- **transmita [recado]**: manda um recado com esse nome para **todos** os atores. Transmitir é como gritar uma palavra na sala: todo mundo ouve.
- **quando eu receber [recado]**: começa um programa quando chega um recado com esse nome.

## Passo a passo

1. Clique no ator **Botão**.
2. Arraste **quando este ator for clicado** (Eventos).
3. Embaixo dele, encaixe **transmita [...]** (Eventos).
4. Abra o menu do **transmita**, escolha **Nova mensagem**, digite **começar** e clique em OK.
5. Agora clique no ator **Bloquinho**.
6. Arraste **quando eu receber [...]** (Eventos) e escolha **começar** no menu.
7. Embaixo dele, encaixe **diga “Vamos!” por 2 segundos** (Aparência).

**Teste:** clique na bandeira verde e depois clique no Botão. O Bloquinho diz “Vamos!”.

> O nome do recado precisa ser **igual** nos dois blocos.`,
  allowedBlocks: TODOS,
  starter: game({ sprites: [{ name: "Botão", character: "botao", y: -110 }, { name: "Bloquinho", y: 40 }] }),
  checks: {
    maxSeconds: 3,
    inputs: [{ click: "Botão", at: 0.3 }],
    checks: [
      { type: "usesAnyBlock", opcodes: BROADCAST, label: "Use “transmita …” no Botão", goal: "3 e 4. Botão: **transmita [começar]**" },
      { type: "usesBlock", opcode: RECEIVE, message: "No Bloquinho, use quando eu receber começar.", goal: "6. Bloquinho: **quando eu receber [começar]**" },
      { type: "said", text: "Vamos", message: "Quando o Botão for clicado, o Bloquinho precisa dizer “Vamos!”. Os nomes dos recados são iguais?", goal: "Teste: clicou no Botão, o Bloquinho diz **Vamos!**" },
    ],
  },
  guide: {
    objetivo: "Coordenar atores com mensagens (transmitir/receber).",
    minutos: 15,
    passos: ["Dinâmica: um aluno “transmite” uma palavra em voz alta e só quem tem aquela palavra no papel reage.", "Mostre no projetor o Nova mensagem no menu do transmita: é ali que o recado ganha nome."],
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
