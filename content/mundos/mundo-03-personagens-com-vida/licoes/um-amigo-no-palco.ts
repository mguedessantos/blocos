import { VIDA } from "../../blocos/basico";
import { flag, game, sayFor, wait } from "../../../../src/lib/blocks/build";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { sprites: [
  { name: "Bloquinho", x: -100, code: [[flag(), sayFor("Oi, tudo bem?", 2)]] },
  { name: "Estrela", character: "estrela", x: 100, code: [[flag(), wait(2), sayFor("Tudo ótimo!", 2)]] },
  ] },
};
