import { describe, expect, it } from "vitest";
import { OFFICIAL_TRACKS } from "../../content/trilhas";
import { BLOCKS_BY_OPCODE } from "@/lib/blocks/catalog";
import { programFromBlockly, type BlocklyBlock } from "@/lib/blocks/program";
import { check, checksSchema } from "@/lib/checker";

const n = (v: number | string) => ({ shadow: typeof v === "number" ? { type: "math_number", fields: { NUM: v } } : { type: "text", fields: { TEXT: v } } });
function flag(...body: BlocklyBlock[]) {
  const all: BlocklyBlock[] = [{ type: "event_whenflagclicked" }, ...body];
  for (let i = all.length - 2; i >= 0; i--) all[i] = { ...all[i], next: { block: all[i + 1] } };
  return { blocks: { blocks: [all[0]] } };
}
const move = (s: number): BlocklyBlock => ({ type: "motion_movesteps", inputs: { STEPS: n(s) } });
const left = (d: number): BlocklyBlock => ({ type: "motion_turnleft", inputs: { DEGREES: n(d) } });

// Solução de referência para cada exercício: garante que toda lição pode ser resolvida com 3 estrelas.
const SOLUTIONS: Record<string, ReturnType<typeof flag>> = {
  "primeiros-passos": flag(move(100)),
  "virando-a-esquina": flag(move(100), left(90), move(100)),
  "diga-ola": flag({ type: "looks_sayforsecs", inputs: { MESSAGE: n("Olá!"), SECS: n(2) } }, move(50)),
  "quadrado-magico": flag({ type: "pen_penDown" }, {
    type: "control_repeat",
    inputs: { TIMES: n(4), SUBSTACK: { block: { ...move(100), next: { block: left(90) } } } },
  }),
};

const lessons = OFFICIAL_TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons));

describe("conteúdo das trilhas oficiais", () => {
  it.each(lessons.map((l) => [l.slug, l] as const))("%s é válida", (_, l) => {
    for (const op of l.allowedBlocks ?? []) expect(BLOCKS_BY_OPCODE.has(op), op).toBe(true);
    if (l.type === "EXERCICIO" || l.type === "DESAFIO") {
      const checks = checksSchema.parse(l.checks);
      for (const c of checks.checks) if ("opcode" in c) expect(l.allowedBlocks ?? [], c.opcode).toContain(c.opcode);
      const solution = SOLUTIONS[l.slug];
      expect(solution, `falta solução de referência para ${l.slug}`).toBeDefined();
      const r = check(programFromBlockly(solution), checks);
      expect(r.items.filter((i) => !i.ok)).toEqual([]);
      expect(r.stars).toBe(3);
    }
  });

  it("slugs únicos por trilha", () => {
    for (const t of OFFICIAL_TRACKS) {
      const slugs = t.modules.flatMap((m) => m.lessons.map((l) => l.slug));
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});
