import { BROADCAST, heroControls4, IFS, RECEIVE, TODOS } from "../../blocos/avancado";
import { b, broadcast, flag, forever, game, gotoXY, iff, move, n, pointTowards, rotationLR, sayFor, whenReceive } from "../../../../src/lib/blocks/build";
import { touchingHero } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "fuga-3-perigo",
  title: "Fuga 3: perigo!",
  type: "EXERCICIO",
  content: `## Etapa 3: pegou!

Quando o Glitch encosta no Bloquinho, ele avisa com um **recado**, como no Mundo 9 (Recados entre atores): **transmita** manda o recado para todos os atores, e **quando eu receber** reage a ele.

## Passo a passo

1. Clique no ator **Glitch**.
2. Dentro do **sempre** dele, embaixo do **mova**, encaixe um **se ⬡ então** (Controle).
3. Arraste **tocando em ...?** (Sensores) para o espaço ⬡ e escolha **Bloquinho** no menu.
4. Dentro do **se**, encaixe **transmita [...]** (Eventos).
5. Abra o menu do **transmita**, escolha **Nova mensagem**, digite **pegou** e clique em OK.
6. Agora clique no ator **Bloquinho**.
7. Arraste **quando eu receber [...]** (Eventos) e escolha **pegou** no menu.
8. Embaixo dele, encaixe **diga “Ai!” por 1 segundos** (Aparência).
9. Embaixo, encaixe **vá para x: -150 y: 0** (Movimento): o Bloquinho volta para o começo.

**Teste:** clique na bandeira verde e deixe o Glitch pegar o Bloquinho. Ele diz “Ai!” e volta para o começo.`,
  allowedBlocks: TODOS,
  starter: game({
    backdrops: ["castelo"],
    sprites: [
      { name: "Bloquinho", x: -150, code: [heroControls4()] },
      { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), rotationLR(), forever(b("motion_pointtowards", {}, { TOWARDS: "Bloquinho" }), b("motion_movesteps", { STEPS: n(3) }))]] },
    ],
  }),
  checks: {
    maxSeconds: 8,
    checks: [
      { type: "inside", parent: IFS, child: BROADCAST, label: "Transmita uma mensagem dentro do “se” (quando o Glitch pegar o Bloquinho)", goal: "2 a 5. Glitch: **se tocando em Bloquinho** → **transmita [pegou]**" },
      { type: "usesBlock", opcode: RECEIVE, message: "No Bloquinho, use quando eu receber pegou.", goal: "7. Bloquinho: **quando eu receber [pegou]**" },
      { type: "said", text: "Ai", message: "Quando receber pegou, o Bloquinho diz “Ai!”.", goal: "8 e 9. O Bloquinho diz **Ai!** e volta para o começo" },
    ],
  },
  guide: {
    objetivo: "Usar mensagens para comunicar eventos do jogo.",
    minutos: 10,
    passos: ["Compare: o Glitch poderia fazer tudo sozinho, mas a mensagem deixa o código organizado."],
    errosComuns: ["Nome da mensagem diferente entre transmitir e receber."],
  },
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["castelo"], sprites: [
  { name: "Bloquinho", x: -150, code: [heroControls4(), [whenReceive("pegou"), sayFor("Ai!", 1), gotoXY(-150, 0)]] },
  { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), rotationLR(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
};
