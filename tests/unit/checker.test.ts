import { describe, expect, it } from "vitest";
import { Runtime } from "@/lib/blocks/interpreter";
import { programFromBlockly, type BlocklyBlock } from "@/lib/blocks/program";
import { check, checksSchema, starsFor } from "@/lib/checker";

// Helpers para montar o JSON que o Blockly salva.
const n = (v: number | string) => ({ shadow: { type: typeof v === "number" ? "math_number" : "text", fields: typeof v === "number" ? { NUM: v } : { TEXT: v } } });
function seq(...blocks: BlocklyBlock[]): BlocklyBlock {
  for (let i = blocks.length - 2; i >= 0; i--) blocks[i] = { ...blocks[i], next: { block: blocks[i + 1] } };
  return blocks[0];
}
const flag = (...body: BlocklyBlock[]) => ({ blocks: { blocks: [seq({ type: "event_whenflagclicked" }, ...body)] } });
const move = (s: number): BlocklyBlock => ({ type: "motion_movesteps", inputs: { STEPS: n(s) } });
const turn = (d: number): BlocklyBlock => ({ type: "motion_turnright", inputs: { DEGREES: n(d) } });
const repeat = (t: number, ...body: BlocklyBlock[]): BlocklyBlock => ({ type: "control_repeat", inputs: { TIMES: n(t), SUBSTACK: { block: seq(...body) } } });

describe("programFromBlockly", () => {
  it("converte scripts, conta blocos e ignora blocos soltos na execução", () => {
    const p = programFromBlockly({ blocks: { blocks: [seq({ type: "event_whenflagclicked" }, move(10)), move(5)] } });
    expect(p.scripts).toHaveLength(1);
    expect(p.scripts[0].body[0]).toMatchObject({ opcode: "motion_movesteps", args: { STEPS: { kind: "lit", value: 10 } } });
    expect(p.blockCount).toBe(3);
    expect(p.opcodeCounts.motion_movesteps).toBe(2);
  });

  it("resolve nomes de variáveis pelo id", () => {
    const p = programFromBlockly({
      variables: [{ id: "v1", name: "pontos" }],
      blocks: { blocks: [seq({ type: "event_whenflagclicked" }, { type: "data_setvariableto", fields: { VARIABLE: { id: "v1" } }, inputs: { VALUE: n(3) } })] },
    });
    expect(p.scripts[0].body[0].variable).toBe("pontos");
  });

  it("não quebra com JSON vazio ou estranho", () => {
    expect(programFromBlockly({}).blockCount).toBe(0);
    expect(programFromBlockly({ blocks: { blocks: [{ type: "motion_movesteps" }] } }).scripts).toHaveLength(0);
  });
});

describe("Runtime", () => {
  it("anda na direção certa (90 = direita)", () => {
    const s = new Runtime(programFromBlockly(flag(move(100)))).runToEnd();
    expect(s.x).toBe(100);
    expect(s.y).toBe(0);
  });

  it("quadrado com repetição volta ao início e desenha 400 de linha", () => {
    const s = new Runtime(programFromBlockly(flag({ type: "pen_penDown" }, repeat(4, move(100), turn(90))))).runToEnd();
    expect(s.x).toBeCloseTo(0);
    expect(s.y).toBeCloseTo(0);
    expect(s.lines).toHaveLength(4);
    expect(s.direction).toBe(90);
  });

  it("laço sempre para no limite de tempo e a espera usa tempo virtual", () => {
    const rt = new Runtime(programFromBlockly(flag({ type: "control_forever", inputs: { SUBSTACK: { block: move(10) } } })));
    const s = rt.runToEnd(2);
    expect(rt.done).toBe(false);
    expect(s.x).toBe(STAGE_HALF); // a cerca segura o personagem dentro do palco
    const w = new Runtime(programFromBlockly(flag({ type: "control_wait", inputs: { DURATION: n(3) } }, move(5)))).runToEnd();
    expect(w.time).toBeGreaterThanOrEqual(3);
    expect(w.x).toBe(5);
  });

  it("variáveis, operadores e condicionais", () => {
    const vars = [{ id: "a", name: "pontos" }];
    const v = { VARIABLE: { id: "a" } };
    const prog = programFromBlockly({
      variables: vars,
      blocks: {
        blocks: [seq(
          { type: "event_whenflagclicked" },
          { type: "data_setvariableto", fields: v, inputs: { VALUE: n(0) } },
          repeat(5, { type: "data_changevariableby", fields: v, inputs: { VALUE: n(2) } }),
          {
            type: "control_if_else",
            inputs: {
              CONDITION: { block: { type: "operator_gt", inputs: { OPERAND1: { block: { type: "data_variable", fields: v } }, OPERAND2: n(5) } } },
              SUBSTACK: { block: { type: "looks_say", inputs: { MESSAGE: n("muitos") } } },
              SUBSTACK2: { block: { type: "looks_say", inputs: { MESSAGE: n("poucos") } } },
            },
          },
        )],
      },
    });
    const s = new Runtime(prog).runToEnd();
    expect(s.vars.pontos).toBe(10);
    expect(s.said).toEqual(["muitos"]);
  });
});

const STAGE_HALF = 240;

describe("check", () => {
  const square = { checks: [
    { type: "usesBlock", opcode: "control_repeat" },
    { type: "drawnLength", min: 400, max: 400 },
    { type: "finalPosition", x: 0, y: 0 },
    { type: "maxBlocks", max: 5, bonus: true },
  ] } as const;

  it("3 estrelas para a solução ideal", () => {
    const r = check(programFromBlockly(flag({ type: "pen_penDown" }, repeat(4, move(100), turn(90)))), checksSchema.parse(square));
    expect(r.passed).toBe(true);
    expect(r.stars).toBe(3);
  });

  it("solução sem repetição falha no requisito com mensagem amigável", () => {
    const r = check(programFromBlockly(flag({ type: "pen_penDown" }, move(100), turn(90), move(100), turn(90), move(100), turn(90), move(100), turn(90))), checksSchema.parse(square));
    expect(r.passed).toBe(false);
    expect(r.stars).toBe(0);
    expect(r.items.find((i) => !i.ok)?.message).toContain("repita");
  });

  it("exige o bloco de início", () => {
    const r = check(programFromBlockly({ blocks: { blocks: [move(10)] } }), { checks: [] });
    expect(r.passed).toBe(false);
    expect(r.items[0].message).toContain("quando 🏁");
  });

  it("estrelas", () => {
    expect(starsFor(false, 1, 1)).toBe(0);
    expect(starsFor(true, 0, 0)).toBe(3);
    expect(starsFor(true, 0, 2)).toBe(1);
    expect(starsFor(true, 1, 2)).toBe(2);
  });

  it("rejeita especificação inválida", () => {
    expect(checksSchema.safeParse({ checks: [{ type: "eval", code: "x" }] }).success).toBe(false);
  });
});

describe("entrada maliciosa", () => {
  it("ignora formatos inválidos sem lançar erro", () => {
    for (const bad of [{ blocks: { blocks: "x" } }, { blocks: { blocks: [null, 1, { type: 5 }] } }, { variables: "x" }, { blocks: { blocks: [{ type: "event_whenflagclicked", next: { block: { type: "motion_movesteps", inputs: { STEPS: null } } } }] } }]) {
      expect(() => programFromBlockly(bad as never)).not.toThrow();
    }
  });
});
