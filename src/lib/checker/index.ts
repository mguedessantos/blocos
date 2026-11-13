// Verificador de exercícios. Dois tipos de checagem:
// - ESTÁTICAS: olham a estrutura do projeto (blocos usados, o que está dentro de quê, atores, cenários...).
//   Funcionam no editor do navegador E em arquivos .sb3 do PictoBlox/Scratch.
// - DE EXECUÇÃO: rodam o programa e olham o palco (posição final, o que foi dito...). Só no editor.
// Resultado: 0–3 estrelas + mensagens em pt-BR para crianças.

import { z } from "zod";
import { blockLabel } from "../blocks/catalog";
import { World, type TargetState, type WorldState } from "../blocks/interpreter";
import type { Program } from "../blocks/program";
import { singleSpriteProject, type ProjectProgram } from "../blocks/project";
import { modelFromProject, type StaticModel } from "../blocks/static-model";

/** goal: objetivo mostrado ao aluno na missão (checagens com o mesmo goal formam um objetivo só). */
const base = { message: z.string().max(300).optional(), bonus: z.boolean().optional(), goal: z.string().max(160).optional() };
/** Ator observado pelas checagens de execução (padrão: o primeiro ator). */
const sprite = { sprite: z.string().max(30).optional() };
const ops = z.array(z.string()).min(1).max(20);

export const checkSpecSchema = z.discriminatedUnion("type", [
  // estáticas
  z.object({ type: z.literal("usesBlock"), opcode: z.string(), min: z.number().int().positive().optional(), ...base }),
  z.object({ type: z.literal("usesAnyBlock"), opcodes: ops, min: z.number().int().positive().optional(), label: z.string().max(120), ...base }),
  z.object({ type: z.literal("noBlock"), opcode: z.string(), ...base }),
  z.object({ type: z.literal("maxBlocks"), max: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("inScript"), hat: ops, opcodes: ops, label: z.string().max(120), ...base }),
  z.object({ type: z.literal("inside"), parent: ops, child: ops, label: z.string().max(120), ...base }),
  z.object({ type: z.literal("sprites"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("backdrops"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("costumes"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("sounds"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("variables"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("keys"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("textContains"), opcodes: ops, text: z.string().min(1), label: z.string().max(120), ...base }),
  // de execução (só editor)
  z.object({ type: z.literal("finalPosition"), x: z.number(), y: z.number(), tolerance: z.number().nonnegative().optional(), ...sprite, ...base }),
  // passos NA ORDEM; cada passo é um objetivo. Um passo pode pedir: lugar (x e/ou y; sem x vale qualquer x,
  // ex. { y: 180 } = topo), direção (dir), uma fala (say, trecho do texto) ou uma pausa antes do próximo movimento (wait, segundos)
  z.object({
    type: z.literal("visits"),
    points: z.array(z.object({
      x: z.number().optional(), y: z.number().optional(), dir: z.number().optional(), say: z.string().max(60).optional(),
      wait: z.number().positive().optional(), goal: z.string().max(160),
    })).min(1).max(16),
    tolerance: z.number().nonnegative().optional(), ...sprite, bonus: z.boolean().optional(),
  }),
  z.object({ type: z.literal("finalDirection"), direction: z.number(), ...sprite, ...base }),
  z.object({ type: z.literal("said"), text: z.string(), ...base }),
  z.object({ type: z.literal("variableEquals"), name: z.string(), value: z.union([z.number(), z.string()]), ...base }),
  z.object({ type: z.literal("drawnLength"), min: z.number().nonnegative(), max: z.number().optional(), ...base }),
  z.object({ type: z.literal("visible"), value: z.boolean(), ...sprite, ...base }),
  z.object({ type: z.literal("walked"), min: z.number().positive(), ...sprite, ...base }),
  z.object({ type: z.literal("movedBy"), axis: z.enum(["x", "y"]), min: z.number(), ...sprite, label: z.string().max(120), ...base }),
  z.object({ type: z.literal("variableAtLeast"), name: z.string(), min: z.number(), ...base }),
  z.object({ type: z.literal("backdropIs"), backdrop: z.string(), ...base }),
  z.object({ type: z.literal("clonesAtLeast"), min: z.number().int().positive(), ...base }),
  z.object({ type: z.literal("stopped"), ...base }),
  z.object({ type: z.literal("playedSound"), sound: z.string().optional(), ...base }),
]);
export const checksSchema = z.object({
  checks: z.array(checkSpecSchema).max(30),
  /** Tempo máximo de execução na verificação (segundos). */
  maxSeconds: z.number().positive().max(120).optional(),
  /** Teclas e cliques simulados durante a verificação (em segundos). */
  inputs: z.array(z.union([
    z.object({ key: z.string(), from: z.number().nonnegative(), to: z.number().positive() }),
    z.object({ click: z.string(), at: z.number().nonnegative() }),
  ])).max(40).optional(),
});

export type CheckSpec = z.infer<typeof checkSpecSchema>;
export type Checks = z.infer<typeof checksSchema>;
export type CheckItem = { ok: boolean; message: string; bonus: boolean; goal?: string };
export type CheckResult = { passed: boolean; stars: number; items: CheckItem[]; summary: string };

const RUNTIME_TYPES = new Set([
  "finalPosition", "visits", "finalDirection", "said", "variableEquals", "drawnLength", "visible", "walked",
  "movedBy", "variableAtLeast", "backdropIs", "clonesAtLeast", "stopped", "playedSound",
]);
export const needsRuntime = (spec: CheckSpec) => RUNTIME_TYPES.has(spec.type);

const fmt = (n: number) => String(Math.round(n * 10) / 10);
const sameAngle = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < 1;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
type Eval = { ok: boolean; fail: string; pass: string };

function evaluateStatic(spec: CheckSpec, m: StaticModel): Eval | null {
  const count = (op: string) => m.opcodeCounts[op] ?? 0;
  switch (spec.type) {
    case "usesBlock": {
      const min = spec.min ?? 1;
      const name = blockLabel(spec.opcode);
      const ok = count(spec.opcode) >= min;
      return min === 1
        ? { ok, pass: `Você usou o bloco “${name}”.`, fail: `Use o bloco “${name}”.` }
        : { ok, pass: `Você usou ${min} blocos “${name}”.`, fail: `Use pelo menos ${min} blocos “${name}”.` };
    }
    case "usesAnyBlock": {
      const total = spec.opcodes.reduce((n, op) => n + count(op), 0);
      const ok = total >= (spec.min ?? 1);
      return { ok, pass: `${spec.label}: ok!`, fail: `${spec.label}.` };
    }
    case "noBlock": {
      const ok = !count(spec.opcode);
      return { ok, pass: `Resolveu sem o bloco “${blockLabel(spec.opcode)}”.`, fail: `Tente resolver sem usar o bloco “${blockLabel(spec.opcode)}”.` };
    }
    case "maxBlocks": {
      const ok = m.blockCount <= spec.max;
      return { ok, pass: `Programa enxuto: ${m.blockCount} blocos.`, fail: `Dá para fazer com até ${spec.max} blocos (você usou ${m.blockCount}).` };
    }
    case "inScript": {
      const ok = m.scripts.some((s) => spec.hat.includes(s.hat) && spec.opcodes.some((op) => s.opcodes.has(op)));
      return { ok, pass: `${spec.label}: ok!`, fail: `${spec.label}.` };
    }
    case "inside": {
      const ok = m.containers.some(
        (c) => spec.parent.includes(c.opcode) && (spec.child.includes("*") ? c.inside.size > 0 : spec.child.some((op) => c.inside.has(op))),
      );
      return { ok, pass: `${spec.label}: ok!`, fail: `${spec.label}.` };
    }
    case "sprites":
      return { ok: m.sprites >= spec.min, pass: `O projeto tem ${plural(m.sprites, "ator", "atores")}.`, fail: `O projeto precisa de pelo menos ${plural(spec.min, "ator", "atores")} (tem ${m.sprites}).` };
    case "backdrops":
      return { ok: m.backdrops >= spec.min, pass: `O palco tem ${plural(m.backdrops, "cenário", "cenários")}.`, fail: `O palco precisa de pelo menos ${plural(spec.min, "cenário", "cenários")} (tem ${m.backdrops}).` };
    case "costumes":
      return { ok: m.maxCostumes >= spec.min, pass: "Seu ator tem fantasias suficientes.", fail: `Algum ator precisa ter pelo menos ${plural(spec.min, "fantasia", "fantasias")}.` };
    case "sounds":
      return { ok: m.sounds >= spec.min, pass: "O projeto tem sons.", fail: `O projeto precisa de pelo menos ${plural(spec.min, "som", "sons")}.` };
    case "variables":
      return { ok: m.variables >= spec.min, pass: `Você criou ${plural(m.variables, "variável", "variáveis")}.`, fail: `Crie pelo menos ${plural(spec.min, "variável", "variáveis")}.` };
    case "keys":
      return { ok: m.keys.size >= spec.min, pass: `Você usou ${plural(m.keys.size, "tecla", "teclas")}.`, fail: `Use pelo menos ${plural(spec.min, "tecla diferente", "teclas diferentes")} em “quando a tecla … for pressionada”.` };
    case "textContains": {
      const want = spec.text.toLowerCase();
      const ok = m.texts.some((t) => spec.opcodes.includes(t.opcode) && t.value.toLowerCase().includes(want));
      return { ok, pass: `${spec.label}: ok!`, fail: `${spec.label}.` };
    }
    default:
      return null;
  }
}

function evaluateRuntime(spec: CheckSpec, w: WorldState, initial: WorldState): Eval {
  const pick = (name?: string): TargetState | undefined =>
    name ? w.targets.find((t) => t.name === name && !t.isClone) : w.targets.find((t) => !t.isClone);
  const who = (name?: string) => name ?? "O personagem";
  switch (spec.type) {
    case "finalPosition": {
      const s = pick(spec.sprite);
      const tol = spec.tolerance ?? 5;
      const ok = !!s && Math.abs(s.x - spec.x) <= tol && Math.abs(s.y - spec.y) <= tol;
      return { ok, pass: `${who(spec.sprite)} terminou no lugar certo.`, fail: `${who(spec.sprite)} precisa terminar em x: ${spec.x}, y: ${spec.y}${s ? ` (terminou em x: ${fmt(s.x)}, y: ${fmt(s.y)})` : ""}.` };
    }
    case "finalDirection": {
      const s = pick(spec.sprite);
      const ok = !!s && sameAngle(s.direction, spec.direction);
      return { ok, pass: `Terminou olhando para a direção certa.`, fail: `${who(spec.sprite)} precisa terminar apontando para ${spec.direction}${s ? ` (está em ${fmt(s.direction)})` : ""}.` };
    }
    case "said": {
      const want = spec.text.trim().toLowerCase();
      const ok = w.said.some((t) => t.trim().toLowerCase().includes(want));
      return { ok, pass: `Alguém disse “${spec.text}”.`, fail: `O personagem precisa dizer “${spec.text}”.` };
    }
    case "variableEquals": {
      const got = w.vars[spec.name];
      const ok = got !== undefined && String(got) === String(spec.value);
      return { ok, pass: `A variável “${spec.name}” ficou com ${spec.value}.`, fail: `A variável “${spec.name}” precisa terminar com ${spec.value}${got === undefined ? "" : ` (está com ${got})`}.` };
    }
    case "variableAtLeast": {
      const got = Number(w.vars[spec.name] ?? NaN);
      const ok = !Number.isNaN(got) && got >= spec.min;
      return { ok, pass: `A variável “${spec.name}” chegou a ${got}.`, fail: `A variável “${spec.name}” precisa chegar a pelo menos ${spec.min}${Number.isNaN(got) ? "" : ` (chegou a ${got})`}.` };
    }
    case "drawnLength": {
      const len = w.lines.reduce((acc, [x1, y1, x2, y2]) => acc + Math.hypot(x2 - x1, y2 - y1), 0);
      const ok = len >= spec.min - 1 && (spec.max === undefined || len <= spec.max + 1);
      return { ok, pass: `O desenho ficou do tamanho certo.`, fail: len === 0 ? `Nada foi desenhado. Não esqueça de abaixar a caneta!` : `O desenho não ficou do tamanho esperado.` };
    }
    case "walked": {
      const s = pick(spec.sprite);
      const ok = !!s && s.steps >= spec.min;
      return { ok, pass: `${who(spec.sprite)} andou bastante pelo palco.`, fail: `${who(spec.sprite)} precisa andar pelo menos ${spec.min} passos (andou ${Math.round(s?.steps ?? 0)}). Ficou preso na borda?` };
    }
    case "movedBy": {
      const s = pick(spec.sprite);
      const s0 = initial.targets.find((t) => t.name === s?.name && !t.isClone);
      const d = s && s0 ? s[spec.axis] - s0[spec.axis] : 0;
      const ok = spec.min >= 0 ? d >= spec.min : d <= spec.min;
      return { ok, pass: `${spec.label}: ok!`, fail: `${spec.label}.` };
    }
    case "visible": {
      const s = pick(spec.sprite);
      const ok = !!s && s.visible === spec.value;
      return { ok, pass: spec.value ? `${who(spec.sprite)} está visível.` : `${who(spec.sprite)} sumiu.`, fail: spec.value ? `${who(spec.sprite)} precisa terminar visível.` : `${who(spec.sprite)} precisa terminar escondido.` };
    }
    case "backdropIs": {
      const ok = w.backdrops[w.backdrop] === spec.backdrop;
      return { ok, pass: "O cenário certo está no palco.", fail: `No fim, o palco precisa mostrar o cenário “${spec.backdrop}”.` };
    }
    case "clonesAtLeast": {
      const ok = w.clonesCreated >= spec.min;
      return { ok, pass: `Você criou ${w.clonesCreated} clones.`, fail: `Crie pelo menos ${spec.min} clones durante o jogo (criou ${w.clonesCreated}).` };
    }
    case "stopped":
      return { ok: w.stopped, pass: "O jogo para no momento certo.", fail: "O jogo precisa parar (bloco “pare tudo”) quando acabar." };
    case "playedSound": {
      const ok = spec.sound ? w.sounds.includes(spec.sound as never) : w.sounds.length > 0;
      return { ok, pass: "O som tocou!", fail: spec.sound ? `Toque o som “${spec.sound}”.` : "Toque algum som durante o jogo." };
    }
    default:
      throw new Error(`Checagem estática tratada como de execução: ${spec.type}`);
  }
}

export function starsFor(requiredOk: boolean, bonusOk: number, bonusTotal: number) {
  if (!requiredOk) return 0;
  if (bonusTotal === 0) return 3;
  return 1 + Math.round((2 * bonusOk) / bonusTotal);
}

function finish(items: CheckItem[]): CheckResult {
  const required = items.filter((i) => !i.bonus);
  const bonus = items.filter((i) => i.bonus);
  const requiredOk = required.every((i) => i.ok);
  const stars = starsFor(requiredOk, bonus.filter((i) => i.ok).length, bonus.length);
  const summary = !requiredOk
    ? "Quase lá! Veja as dicas abaixo e tente de novo. 💪"
    : stars === 3 ? "Perfeito! Você conseguiu! 🎉" : "Muito bem, você conseguiu! Dá para ganhar mais estrelas? ⭐";
  return { passed: requiredOk, stars, items, summary };
}

const item = (spec: CheckSpec, r: Eval): CheckItem => ({
  ok: r.ok, bonus: !!spec.bonus, message: r.ok ? r.pass : ("message" in spec && spec.message ? spec.message : r.fail),
  ...("goal" in spec && spec.goal ? { goal: spec.goal } : {}),
});

type VisitsSpec = Extract<CheckSpec, { type: "visits" }>;

/** Um item por passo: procura cada passo no que o ator fez, depois do passo anterior encontrado. */
function visitItems(spec: VisitsSpec, w: WorldState): CheckItem[] {
  const s = spec.sprite ? w.targets.find((t) => t.name === spec.sprite && !t.isClone) : w.targets.find((t) => !t.isClone);
  const path = s?.path ?? [];
  const tol = spec.tolerance ?? 10;
  let from = 1; // path[0] é como o ator começou
  return spec.points.map((p) => {
    const hit = (i: number) => {
      const e = path[i];
      if (p.wait !== undefined) return e.t - path[i - 1].t >= p.wait - 0.05;
      if (p.say !== undefined) return !!e.say && e.say.toLowerCase().includes(p.say.toLowerCase());
      return (p.x === undefined || Math.abs(e.x - p.x) <= tol) && (p.y === undefined || Math.abs(e.y - p.y) <= tol) && (p.dir === undefined || sameAngle(e.d, p.dir));
    };
    let i = from;
    while (i < path.length && !hit(i)) i++;
    const ok = i < path.length;
    // a pausa acontece ANTES do passo i, então o próximo objetivo ainda pode ser esse mesmo passo
    if (ok) from = p.wait !== undefined ? i : i + 1;
    return { ok, bonus: !!spec.bonus, goal: p.goal, message: ok ? `Feito: ${p.goal.replaceAll("**", "")}.` : `Ainda falta (ou está fora de ordem): ${p.goal.replaceAll("**", "")}.` };
  });
}

/** Objetivos da missão, na ordem, para mostrar ao aluno antes e depois de verificar. */
export function objectivesOf(raw: unknown): { goal: string; bonus: boolean }[] {
  const parsed = checksSchema.safeParse(raw ?? { checks: [] });
  if (!parsed.success) return [];
  const out = new Map<string, boolean>();
  for (const spec of parsed.data.checks) {
    const goals = spec.type === "visits" ? spec.points.map((p) => p.goal) : spec.goal ? [spec.goal] : [];
    for (const g of goals) if (!out.has(g)) out.set(g, !!spec.bonus);
  }
  return [...out].map(([goal, bonus]) => ({ goal, bonus }));
}

/** Verificação de um projeto do editor do site (estática + execução com entradas simuladas). */
export function checkProject(project: ProjectProgram, checks: Checks): CheckResult {
  const model = modelFromProject(project);
  const items: CheckItem[] = [];
  const hasEvent = [...project.sprites.map((s) => s.program), project.stage.program].some((p) => p.scripts.length > 0);
  if (!hasEvent) {
    items.push({ ok: false, bonus: false, message: "Comece o programa com um bloco amarelo de evento, como “quando 🏁 for clicado”." });
  }
  let world: World | null = null;
  let initial: WorldState | null = null;
  if (checks.checks.some(needsRuntime)) {
    world = new World(project);
    initial = structuredClone(world.state);
    world.runToEnd(checks.maxSeconds ?? 30, checks.inputs ?? []);
  }
  for (const spec of checks.checks) {
    if (spec.type === "visits") {
      items.push(...visitItems(spec, world!.state));
      continue;
    }
    items.push(item(spec, evaluateStatic(spec, model) ?? evaluateRuntime(spec, world!.state, initial!)));
  }
  return finish(items);
}

/** Atalho para um programa de um ator só. */
export function check(program: Program, checks: Checks): CheckResult {
  return checkProject(singleSpriteProject(program), checks);
}

/** Verificação de um projeto .sb3 (só checagens estáticas). */
export function checkModel(model: StaticModel, checks: Checks): CheckResult {
  const items = checks.checks.flatMap((spec) => {
    if (spec.type === "visits") return spec.points.map((p) => ({ ok: false, bonus: !!spec.bonus, goal: p.goal, message: "Esta parte só pode ser verificada no editor do site." }));
    const r = evaluateStatic(spec, model);
    return r ? item(spec, r) : { ok: false, bonus: !!spec.bonus, message: "Esta parte só pode ser verificada no editor do site." };
  });
  return finish(items);
}
