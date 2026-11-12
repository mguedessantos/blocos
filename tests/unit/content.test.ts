import { describe, expect, it } from "vitest";
import { OFFICIAL_TRACKS, type LessonContent } from "../../content/trilhas";
import { BLOCKS_BY_OPCODE } from "@/lib/blocks/catalog";
import { programFromBlockly, type BlocklyBlock, type BlocklyState } from "@/lib/blocks/program";
import { check, checksSchema } from "@/lib/checker";

// ───────────── Mini-construtor do JSON do Blockly ─────────────
type In = Record<string, unknown>;
const n = (v: number) => ({ shadow: { type: "math_number", fields: { NUM: v } } });
const t = (v: string) => ({ shadow: { type: "text", fields: { TEXT: v } } });
const r = (block: BlocklyBlock) => ({ block }); // repórter encaixado
const V = { VARIABLE: { id: "v" } };
const VARIABLES = [{ id: "v", name: "pontos" }];

function chain(...blocks: BlocklyBlock[]): BlocklyBlock | undefined {
  const copy = blocks.map((b) => ({ ...b }));
  for (let i = copy.length - 2; i >= 0; i--) copy[i].next = { block: copy[i + 1] };
  return copy[0];
}
const b = (type: string, inputs: In = {}, fields?: Record<string, unknown>): BlocklyBlock => ({ type, inputs: inputs as BlocklyBlock["inputs"], fields });
const c = (type: string, inputs: In, body: BlocklyBlock[], body2?: BlocklyBlock[]): BlocklyBlock =>
  b(type, { ...inputs, SUBSTACK: { block: chain(...body) }, ...(body2 ? { SUBSTACK2: { block: chain(...body2) } } : {}) });
const flag = (...body: BlocklyBlock[]): BlocklyState => ({ variables: VARIABLES, blocks: { blocks: [chain(b("event_whenflagclicked"), ...body)!] } });

const move = (s: number) => b("motion_movesteps", { STEPS: n(s) });
const right = (d: number) => b("motion_turnright", { DEGREES: n(d) });
const left = (d: number) => b("motion_turnleft", { DEGREES: n(d) });
const repeat = (times: number, ...body: BlocklyBlock[]) => c("control_repeat", { TIMES: n(times) }, body);
const say = (msg: In[string]) => b("looks_say", { MESSAGE: msg });
const pen = b("pen_penDown");
const xpos = b("motion_xposition");
const ypos = b("motion_yposition");
const gt = (a: In[string], z: In[string]) => b("operator_gt", { OPERAND1: a, OPERAND2: z });
const edge = b("sensing_touchingobject");
const setVar = (v: In[string]) => b("data_setvariableto", { VALUE: v }, V);
const changeVar = (v: In[string]) => b("data_changevariableby", { VALUE: v }, V);
const pontos = b("data_variable", {}, V);

// Solução de referência de cada exercício: garante que toda lição pode ser resolvida com 3 estrelas.
const SOLUTIONS: Record<string, BlocklyState> = {
  // Trilha 1
  "primeiros-passos": flag(move(100)),
  "virando-a-esquina": flag(move(100), left(90), move(100)),
  "pule-para-o-canto": flag(b("motion_gotoxy", { X: n(150), Y: n(100) })),
  "passeio-com-pausa": flag(move(50), b("control_wait", { DURATION: n(1) }), move(50)),
  "diga-ola": flag(b("looks_sayforsecs", { MESSAGE: t("Olá!"), SECS: n(2) }), move(50)),
  "quadrado-magico": flag(pen, repeat(4, move(100), left(90))),
  // Trilha 2
  "dez-passinhos": flag(repeat(10, move(10))),
  triangulo: flag(pen, repeat(3, move(100), left(120))),
  escada: flag(repeat(4, move(30), left(90), move(30), right(90))),
  "flor-de-quadrados": flag(pen, repeat(4, repeat(4, move(50), right(90)), right(90))),
  estrela: flag(pen, repeat(5, move(100), right(144))),
  "para-sempre": flag(b("motion_pointindirection", { DIRECTION: n(45) }), c("control_forever", {}, [move(5), b("motion_ifonedgebounce")])),
  // Trilha 3
  "bate-e-volta": flag(repeat(30, move(10), c("control_if", { CONDITION: r(edge) }, [right(180)]))),
  "direita-ou-esquerda": flag(
    b("motion_setx", { X: n(150) }),
    c("control_if_else", { CONDITION: r(gt(r(xpos), n(0))) }, [say(t("Direita!"))], [say(t("Esquerda!"))]),
  ),
  "volta-ao-mundo": flag(repeat(20, b("motion_changexby", { DX: n(15) }), c("control_if", { CONDITION: r(gt(r(xpos), n(150))) }, [b("motion_setx", { X: n(-150) })]))),
  "e-ou-nao": flag(
    b("motion_gotoxy", { X: n(80), Y: n(60) }),
    c("control_if", { CONDITION: r(b("operator_and", { OPERAND1: r(gt(r(xpos), n(0))), OPERAND2: r(gt(r(ypos), n(0))) })) }, [say(t("Canto de cima!"))]),
  ),
  "ate-a-borda": flag(c("control_repeat_until", { CONDITION: r(edge) }, [move(5)]), say(t("Cheguei!"))),
  "robo-aspirador": flag(c("control_forever", {}, [move(10), c("control_if", { CONDITION: r(edge) }, [right(135), move(10)])])),
  // Trilha 4
  placar: flag(setVar(n(0)), repeat(3, changeVar(n(10)))),
  "contando-passos": flag(setVar(n(0)), repeat(5, move(20), changeVar(n(1))), say(r(pontos))),
  calculadora: flag(say(r(b("operator_multiply", { NUM1: n(7), NUM2: n(8) })))),
  "juntando-palavras": flag(say(r(b("operator_join", { STRING1: t("Olá, "), STRING2: t("mundo!") })))),
  espiral: flag(pen, setVar(n(10)), repeat(5, b("motion_movesteps", { STEPS: r(pontos) }), right(90), changeVar(n(10)))),
  "tabuada-do-3": flag(setVar(n(0)), repeat(10, changeVar(n(3)), b("looks_sayforsecs", { MESSAGE: r(pontos), SECS: n(0.5) }))),
};

// Erros comuns que NÃO podem passar.
const WRONG: [string, BlocklyState][] = [
  ["quadrado-magico", flag(pen, move(100), left(90), move(100), left(90), move(100), left(90), move(100), left(90))],
  ["triangulo", flag(pen, repeat(3, move(100), left(90)))],
  ["flor-de-quadrados", flag(pen, repeat(16, move(50), right(90)))],
  ["para-sempre", flag(c("control_forever", {}, [move(5)]))],
  ["bate-e-volta", flag(repeat(30, move(10)))],
  ["direita-ou-esquerda", flag(say(t("Direita!")))],
  ["robo-aspirador", flag(c("control_forever", {}, [move(10)]))],
  ["robo-aspirador", flag(c("control_forever", {}, [move(10), b("motion_ifonedgebounce"), c("control_if", { CONDITION: r(edge) }, [])]))],
  ["contando-passos", flag(repeat(5, move(20)), say(t("5")))],
  ["calculadora", flag(say(t("56")))],
  ["tabuada-do-3", flag(say(t("30")))],
];

const lessons = OFFICIAL_TRACKS.flatMap((tr) => tr.modules.flatMap((m) => m.lessons));
const bySlug = new Map(lessons.map((l) => [l.slug, l]));
const isExercise = (l: LessonContent) => l.type === "EXERCICIO" || l.type === "DESAFIO";

describe("conteúdo das trilhas oficiais", () => {
  it("tem as 4 primeiras trilhas, em ordem", () => {
    expect(OFFICIAL_TRACKS.map((tr) => tr.order)).toEqual([1, 2, 3, 4]);
    for (const tr of OFFICIAL_TRACKS) expect(tr.modules.flatMap((m) => m.lessons).length).toBeGreaterThanOrEqual(6);
  });

  it.each(lessons.map((l) => [l.slug, l] as const))("%s é válida e tem solução com 3 estrelas", (_, l) => {
    for (const op of l.allowedBlocks ?? []) expect(BLOCKS_BY_OPCODE.has(op), op).toBe(true);
    if (!isExercise(l)) return;
    const checks = checksSchema.parse(l.checks);
    // tudo o que a verificação exige precisa estar na caixa de blocos
    for (const chk of checks.checks) {
      if (chk.type === "usesBlock") expect(l.allowedBlocks ?? [], chk.opcode).toContain(chk.opcode);
    }
    const solution = SOLUTIONS[l.slug];
    expect(solution, `falta solução de referência para ${l.slug}`).toBeDefined();
    for (const op of Object.keys(programFromBlockly(solution).opcodeCounts)) {
      if (op !== "event_whenflagclicked") expect(l.allowedBlocks ?? [], `${l.slug} usa ${op}`).toContain(op);
    }
    const res = check(programFromBlockly(solution), checks);
    expect(res.items.filter((i) => !i.ok)).toEqual([]);
    expect(res.stars).toBe(3);
  });

  it.each(WRONG.map(([slug, prog], i) => [`${slug} #${i}`, slug, prog] as const))("rejeita solução errada: %s", (_, slug, prog) => {
    const res = check(programFromBlockly(prog), checksSchema.parse(bySlug.get(slug)!.checks));
    expect(res.passed).toBe(false);
  });

  it("slugs únicos", () => {
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
    expect(new Set(OFFICIAL_TRACKS.map((tr) => tr.slug)).size).toBe(OFFICIAL_TRACKS.length);
  });
});
