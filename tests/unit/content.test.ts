import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFICIAL_TRACKS, TESTES, type LessonContent } from "../../content/mundos";
import { project, type GameSpec } from "@/lib/blocks/build";
import { BLOCKS_BY_OPCODE } from "@/lib/blocks/catalog";
import { compileProject, normalizeProject } from "@/lib/blocks/project";
import { checkProject, checksSchema, objectivesOf } from "@/lib/checker";
import { projectToSb3Json, sb3JsonToProject } from "@/lib/sb3/convert";

// As soluções de referência e os erros comuns ficam em cada lição (content/mundos/<mundo>/licoes/<slug>.ts, `teste`).
const SOLUTIONS = Object.fromEntries(Object.entries(TESTES).map(([slug, t]) => [slug, t.solucao]));
const WRONG = Object.entries(TESTES).flatMap(([slug, t]) => (t.erros ?? []).map((e) => [slug, e] as const));

const lessons = OFFICIAL_TRACKS.flatMap((tr) => tr.modules.flatMap((m) => m.lessons));
const bySlug = new Map(lessons.map((l) => [l.slug, l]));
const isExercise = (l: LessonContent) => l.type === "EXERCICIO" || l.type === "DESAFIO";
const run = (spec: GameSpec | object, l: LessonContent) => checkProject(compileProject(normalizeProject("sprites" in spec && !("v" in spec) ? project(spec as GameSpec) : spec)), checksSchema.parse(l.checks));

describe("currículo oficial", () => {
  it("tem 11 mundos em 3 níveis, em ordem, com história, terminando no projeto final da jam", () => {
    expect(OFFICIAL_TRACKS.map((tr) => tr.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(new Set(OFFICIAL_TRACKS.map((tr) => tr.level))).toEqual(new Set([1, 2, 3]));
    for (const tr of OFFICIAL_TRACKS) expect(tr.story, tr.slug).toBeTruthy();
    const required = OFFICIAL_TRACKS.at(-1)!.modules.flatMap((m) => m.lessons).filter((l) => !l.optional);
    expect(required.at(-1)!.slug).toBe("projeto-final");
  });

  it("o site vem primeiro: nenhuma lição obrigatória depende do PictoBlox", () => {
    for (const l of lessons) {
      if (l.mode === "SB3") expect(l.optional, `${l.slug} é do PictoBlox e não pode ser obrigatória`).toBe(true);
    }
  });

  it("não menciona robótica nem inteligência artificial", () => {
    const text = JSON.stringify(OFFICIAL_TRACKS).toLowerCase();
    for (const word of ["inteligência artificial", "aprendizado de máquina", "robótica", "detecção de rosto", "extensões"]) expect(text).not.toContain(word);
  });

  it.each(lessons.map((l) => [l.slug, l] as const))("%s: guia do professor, blocos válidos e solução com 3 estrelas", (_, l) => {
    expect(l.guide, `${l.slug} sem guia do professor`).toBeDefined();
    for (const op of l.allowedBlocks ?? []) expect(BLOCKS_BY_OPCODE.has(op), op).toBe(true);
    if (!isExercise(l)) return;
    const checks = checksSchema.parse(l.checks);

    expect(l.mode, `${l.slug}: missões do PictoBlox (.sb3) saíram do currículo`).not.toBe("SB3");

    const solution = SOLUTIONS[l.slug];
    expect(solution, `falta a solução de referência (export const teste) em ${l.slug}`).toBeDefined();
    // a solução só usa blocos liberados na lição (os que já vêm prontos no projeto inicial não contam)
    if (l.allowedBlocks?.length) {
      const used = Object.keys(compileProject(project(solution)).opcodeCounts);
      const ready = l.starter ? Object.keys(compileProject(normalizeProject(l.starter)).opcodeCounts) : [];
      for (const op of used) if (!op.startsWith("event_whenflag") && !ready.includes(op)) expect(l.allowedBlocks, `${l.slug} usa ${op}`).toContain(op);
    }
    const res = run(solution, l);
    expect(res.items.filter((i) => !i.ok)).toEqual([]);
    expect(res.stars).toBe(3);
    // o projeto inicial, sem mudanças, não pode passar
    const starter = l.starter ?? (l.startWithFlag ? { blocks: { blocks: [{ type: "event_whenflagclicked" }] } } : {});
    expect(run(starter, l).passed, `${l.slug}: o projeto inicial já passa sem fazer nada`).toBe(false);

    // ida e volta pelo editor de blocos (.sb3): a solução continua valendo 3 estrelas e o início continua não passando
    const viaSb3 = (spec: GameSpec | object) =>
      sb3JsonToProject(JSON.parse(JSON.stringify(projectToSb3Json(normalizeProject("sprites" in spec && !("v" in spec) ? project(spec as GameSpec) : spec)).json)));
    const back = checkProject(compileProject(viaSb3(solution)), checks);
    expect(back.items.filter((i) => !i.ok), `${l.slug} (via .sb3)`).toEqual([]);
    expect(back.stars).toBe(3);
    expect(checkProject(compileProject(viaSb3(starter)), checks).passed, `${l.slug} (via .sb3): o início já passa`).toBe(false);
  });

  it.each(WRONG.map(([slug, prog], i) => [`${slug} #${i}`, slug, prog] as const))("rejeita solução errada: %s", (_, slug, prog) => {
    expect(run(prog, bySlug.get(slug)!).passed).toBe(false);
  });

  it("slugs únicos", () => {
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
    expect(new Set(OFFICIAL_TRACKS.map((tr) => tr.slug)).size).toBe(OFFICIAL_TRACKS.length);
  });
});

import { OFFICIAL_COURSES } from "../../content/cursos";

describe("cursos oficiais", () => {
  it("o primeiro curso reúne os 11 mundos; o de Arduino está “em breve” e vazio", () => {
    const [intro, arduino] = OFFICIAL_COURSES;
    expect(intro.title).toBe("PictoBlox e Introdução à Programação de Blocos");
    expect(intro.tracks).toHaveLength(11);
    expect(intro.comingSoon).toBeFalsy();
    expect(arduino.title).toBe("Arduino e PictoBlox");
    expect(arduino.comingSoon).toBe(true);
    expect(arduino.tracks).toHaveLength(0);
  });

  it("cada trilha oficial pertence a exatamente um curso", () => {
    const slugs = OFFICIAL_COURSES.flatMap((c) => c.tracks.map((t) => t.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.sort()).toEqual(OFFICIAL_TRACKS.map((t) => t.slug).sort());
  });
});

describe("quem anda não termina onde começou (senão parece que não se mexeu)", async () => {
  const { World } = await import("@/lib/blocks/interpreter");
  for (const [slug, spec] of Object.entries(SOLUTIONS)) {
    it(slug, () => {
      const l = bySlug.get(slug)!;
      const w = new World(compileProject(normalizeProject(project(spec))));
      const start = structuredClone(w.state.targets.filter((t) => !t.isClone));
      w.runToEnd(checksSchema.parse(l.checks).maxSeconds ?? 30, checksSchema.parse(l.checks).inputs ?? []);
      for (const t of w.state.targets.filter((t) => !t.isClone)) {
        const s0 = start.find((s) => s.name === t.name);
        if (!s0 || t.steps === 0) continue;
        expect(Math.hypot(t.x - s0.x, t.y - s0.y), `${t.name} andou e voltou para o mesmo lugar`).toBeGreaterThan(5);
      }
    });
  }
});

// ───────────── Regras das missões ─────────────
describe("missões", () => {
  it("nenhuma lição tem desafio extra", () => {
    expect(lessons.filter((l) => l.extra || l.extraChecks).map((l) => l.slug)).toEqual([]);
  });
  it("toda missão tem checklist de objetivos", () => {
    for (const l of lessons.filter(isExercise)) expect(objectivesOf(l.checks).length, l.slug).toBeGreaterThan(0);
  });
  it("os blocos já ensinados continuam liberados nas lições seguintes", () => {
    const seen = new Set<string>();
    for (const l of lessons) {
      if (l.allowedBlocks?.length) for (const op of seen) expect(l.allowedBlocks, `${l.slug} sem ${op}`).toContain(op);
      for (const op of l.allowedBlocks ?? []) seen.add(op);
    }
  });
});

// ───────────── As soluções nunca chegam ao aluno ─────────────
describe("soluções protegidas", () => {
  it("nenhum arquivo do site (src/) importa o conteúdo das lições: o navegador nunca recebe as soluções", () => {
    const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
    for (const f of files("src").filter((f) => /\.(ts|tsx)$/.test(f))) expect(readFileSync(f, "utf8"), f).not.toMatch(/content\/mundos/);
  });
  it("o que o seed grava (a lição) não carrega a solução", () => {
    const text = JSON.stringify(OFFICIAL_TRACKS);
    for (const k of ['"teste"', '"solucao"', '"erros"']) expect(text).not.toContain(k);
  });
});
