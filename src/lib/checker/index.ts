// Verificador de exercícios: checagens estáticas (quais blocos foram usados) e dinâmicas
// (o que aconteceu no palco ao rodar o programa). Resultado: 0–3 estrelas + mensagens em pt-BR.

import { z } from "zod";
import { blockLabel } from "../blocks/catalog";
import { Runtime, type StageState } from "../blocks/interpreter";
import type { Program } from "../blocks/program";

const base = { message: z.string().max(300).optional(), bonus: z.boolean().optional() };

export const checkSpecSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("usesBlock"), opcode: z.string(), ...base }),
  z.object({ type: z.literal("noBlock"), opcode: z.string(), ...base }),
  z.object({ type: z.literal("maxBlocks"), max: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("finalPosition"), x: z.number(), y: z.number(), tolerance: z.number().nonnegative().optional(), ...base }),
  z.object({ type: z.literal("finalDirection"), direction: z.number(), ...base }),
  z.object({ type: z.literal("said"), text: z.string(), ...base }),
  z.object({ type: z.literal("variableEquals"), name: z.string(), value: z.union([z.number(), z.string()]), ...base }),
  z.object({ type: z.literal("drawnLength"), min: z.number().nonnegative(), max: z.number().optional(), ...base }),
  z.object({ type: z.literal("visible"), value: z.boolean(), ...base }),
]);
export const checksSchema = z.object({
  checks: z.array(checkSpecSchema).max(30),
  /** Tempo máximo de execução na verificação (segundos). */
  maxSeconds: z.number().positive().max(120).optional(),
});

export type CheckSpec = z.infer<typeof checkSpecSchema>;
export type Checks = z.infer<typeof checksSchema>;
export type CheckItem = { ok: boolean; message: string; bonus: boolean };
export type CheckResult = { passed: boolean; stars: number; items: CheckItem[]; summary: string; final: Pick<StageState, "x" | "y" | "direction" | "said" | "vars"> };

const fmt = (n: number) => String(Math.round(n * 10) / 10);
const sameAngle = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < 1;

function evaluate(spec: CheckSpec, program: Program, s: StageState): { ok: boolean; fail: string; pass: string } {
  switch (spec.type) {
    case "usesBlock": {
      const ok = (program.opcodeCounts[spec.opcode] ?? 0) > 0;
      return { ok, pass: `Você usou o bloco “${blockLabel(spec.opcode)}”.`, fail: `Use o bloco “${blockLabel(spec.opcode)}”.` };
    }
    case "noBlock": {
      const ok = !program.opcodeCounts[spec.opcode];
      return { ok, pass: `Resolveu sem o bloco “${blockLabel(spec.opcode)}”.`, fail: `Tente resolver sem usar o bloco “${blockLabel(spec.opcode)}”.` };
    }
    case "maxBlocks": {
      const ok = program.blockCount <= spec.max;
      return { ok, pass: `Programa enxuto: ${program.blockCount} blocos.`, fail: `Dá para fazer com até ${spec.max} blocos (você usou ${program.blockCount}).` };
    }
    case "finalPosition": {
      const tol = spec.tolerance ?? 5;
      const ok = Math.abs(s.x - spec.x) <= tol && Math.abs(s.y - spec.y) <= tol;
      return { ok, pass: `O personagem terminou no lugar certo.`, fail: `O personagem precisa terminar em x: ${spec.x}, y: ${spec.y} (terminou em x: ${fmt(s.x)}, y: ${fmt(s.y)}).` };
    }
    case "finalDirection": {
      const ok = sameAngle(s.direction, spec.direction);
      return { ok, pass: `Terminou olhando para a direção certa.`, fail: `O personagem precisa terminar apontando para ${spec.direction} (está em ${fmt(s.direction)}).` };
    }
    case "said": {
      const want = spec.text.trim().toLowerCase();
      const ok = s.said.some((t) => t.trim().toLowerCase().includes(want));
      return { ok, pass: `O personagem disse “${spec.text}”.`, fail: `O personagem precisa dizer “${spec.text}”.` };
    }
    case "variableEquals": {
      const got = s.vars[spec.name];
      const ok = got !== undefined && String(got) === String(spec.value);
      return { ok, pass: `A variável “${spec.name}” ficou com ${spec.value}.`, fail: `A variável “${spec.name}” precisa terminar com ${spec.value}${got === undefined ? "" : ` (está com ${got})`}.` };
    }
    case "drawnLength": {
      const len = s.lines.reduce((acc, [x1, y1, x2, y2]) => acc + Math.hypot(x2 - x1, y2 - y1), 0);
      const ok = len >= spec.min - 1 && (spec.max === undefined || len <= spec.max + 1);
      return { ok, pass: `O desenho ficou do tamanho certo.`, fail: len === 0 ? `Nada foi desenhado. Não esqueça de abaixar a caneta!` : `O desenho não ficou do tamanho esperado.` };
    }
    case "visible": {
      const ok = s.visible === spec.value;
      return { ok, pass: spec.value ? "O personagem está visível." : "O personagem sumiu.", fail: spec.value ? "O personagem precisa terminar visível." : "O personagem precisa terminar escondido." };
    }
  }
}

export function starsFor(requiredOk: boolean, bonusOk: number, bonusTotal: number) {
  if (!requiredOk) return 0;
  if (bonusTotal === 0) return 3;
  return 1 + Math.round((2 * bonusOk) / bonusTotal);
}

export function check(program: Program, checks: Checks): CheckResult {
  const state = new Runtime(program).runToEnd(checks.maxSeconds ?? 30);
  const items: CheckItem[] = [];

  if (!program.scripts.some((s) => s.hat === "event_whenflagclicked")) {
    items.push({ ok: false, bonus: false, message: "Comece o programa com o bloco “quando 🏁 for clicado”." });
  }
  for (const spec of checks.checks) {
    const r = evaluate(spec, program, state);
    items.push({ ok: r.ok, bonus: !!spec.bonus, message: r.ok ? r.pass : (spec.message ?? r.fail) });
  }

  const required = items.filter((i) => !i.bonus);
  const bonus = items.filter((i) => i.bonus);
  const requiredOk = required.every((i) => i.ok);
  const stars = starsFor(requiredOk, bonus.filter((i) => i.ok).length, bonus.length);
  const summary = !requiredOk
    ? "Quase lá! Veja as dicas abaixo e tente de novo. 💪"
    : stars === 3 ? "Perfeito! Você conseguiu! 🎉" : "Muito bem, você conseguiu! Dá para ganhar mais estrelas? ⭐";
  return { passed: requiredOk, stars, items, summary, final: { x: state.x, y: state.y, direction: state.direction, said: state.said, vars: state.vars } };
}
