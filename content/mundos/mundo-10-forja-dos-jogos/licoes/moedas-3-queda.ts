import { heroControls, IFS, TODOS } from "../../blocos/avancado";
import { changeY, flag, forever, game, gotoXY } from "../../../../src/lib/blocks/build";
import { coinBottom } from "../../teste";
import type { LessonTest, LessonContent } from "../../tipos";

export const licao: LessonContent = {
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
};

/** Só para os testes: o seed não grava e o aluno nunca recebe. */
export const teste: LessonTest = {
  solucao: { backdrops: ["floresta"], sprites: [
  { name: "Bloquinho", y: -140, code: [heroControls()] },
  { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(changeY(-5), coinBottom())]] },
  ] },
};
