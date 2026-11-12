// Modelo estático de um projeto: o que dá para verificar SEM executar.
// É produzido tanto pelo editor (Program) quanto por arquivos .sb3 do Scratch/PictoBlox,
// então as mesmas checagens servem para os dois.

import { CHARACTERS } from "./library";
import type { Expr, Program, Stmt } from "./program";
import type { ProjectProgram } from "./project";

export type StaticScript = {
  /** Opcode do bloco de início (event_whenflagclicked, event_whenkeypressed...). */
  hat: string;
  /** Todos os opcodes do script, inclusive dentro de laços e repórteres encaixados. */
  opcodes: Set<string>;
};

export type StaticModel = {
  opcodeCounts: Record<string, number>;
  blockCount: number;
  scripts: StaticScript[];
  /** Para cada C-block (repita, se, sempre...), os opcodes que estão DENTRO dele, em qualquer profundidade. */
  containers: { opcode: string; inside: Set<string> }[];
  sprites: number;
  backdrops: number;
  /** Maior número de fantasias de um mesmo ator. */
  maxCostumes: number;
  sounds: number;
  variables: number;
  /** Teclas usadas em “quando a tecla … for pressionada” e “tecla … pressionada?”. */
  keys: Set<string>;
  /** Sons diferentes usados (editor do site). */
  soundNames: Set<string>;
  /** Textos literais por opcode/entrada, ex.: looks_say/MESSAGE → ["Olá, mundo!"]. */
  texts: { opcode: string; input: string; value: string }[];
  source: "editor" | "sb3";
};

export function emptyModel(source: StaticModel["source"]): StaticModel {
  return {
    opcodeCounts: Object.create(null),
    blockCount: 0,
    scripts: [],
    containers: [],
    sprites: 1,
    backdrops: 1,
    maxCostumes: 1,
    sounds: 0,
    variables: 0,
    keys: new Set(),
    soundNames: new Set(),
    texts: [],
    source,
  };
}

/** Soma os scripts de um programa ao modelo. */
function accumulate(m: StaticModel, program: Program, vars: Set<string>) {
  for (const [op, n] of Object.entries(program.opcodeCounts)) m.opcodeCounts[op] = (m.opcodeCounts[op] ?? 0) + n;
  m.blockCount += program.blockCount;

  function exprOps(e: Expr | undefined, out: Set<string>) {
    if (!e || e.kind === "lit") return;
    if (e.kind === "var") {
      out.add("data_variable");
      vars.add(e.name);
      return;
    }
    out.add(e.opcode);
    if (e.opcode === "sensing_keypressed" && e.fields.KEY_OPTION) m.keys.add(e.fields.KEY_OPTION);
    for (const a of Object.values(e.args)) exprOps(a, out);
  }

  function stmtsOps(stmts: Stmt[], out: Set<string>) {
    for (const st of stmts) {
      out.add(st.opcode);
      if (st.variable) vars.add(st.variable);
      if (st.opcode.startsWith("sound_play") && st.fields.SOUND_MENU) m.soundNames.add(st.fields.SOUND_MENU);
      for (const [name, a] of Object.entries(st.args)) {
        exprOps(a, out);
        if (a.kind === "lit") m.texts.push({ opcode: st.opcode, input: name, value: String(a.value) });
      }
      for (const [name, v] of Object.entries(st.fields)) m.texts.push({ opcode: st.opcode, input: name, value: v });
      if (st.substack || st.substack2) {
        const inside = new Set<string>();
        stmtsOps(st.substack ?? [], inside);
        stmtsOps(st.substack2 ?? [], inside);
        m.containers.push({ opcode: st.opcode, inside });
        for (const op of inside) out.add(op);
      }
    }
  }

  for (const s of program.scripts) {
    if (s.hat === "event_whenkeypressed" && s.fields.KEY_OPTION) m.keys.add(s.fields.KEY_OPTION);
    const opcodes = new Set<string>();
    stmtsOps(s.body, opcodes);
    m.scripts.push({ hat: s.hat, opcodes });
  }
}

/** Modelo estático de um programa do editor do navegador (1 ator, 1 cenário). */
export function modelFromProgram(program: Program): StaticModel {
  const m = emptyModel("editor");
  const vars = new Set<string>();
  accumulate(m, program, vars);
  m.variables = vars.size;
  return m;
}

/** Modelo estático de um projeto do editor com vários atores. */
export function modelFromProject(project: ProjectProgram): StaticModel {
  const m = emptyModel("editor");
  const vars = new Set<string>(project.variables);
  for (const s of project.sprites) accumulate(m, s.program, vars);
  accumulate(m, project.stage.program, vars);
  m.sprites = project.sprites.length;
  m.backdrops = project.stage.backdrops.length;
  m.maxCostumes = Math.max(1, ...project.sprites.map((s) => CHARACTERS[s.character].costumes.length));
  m.sounds = m.soundNames.size;
  m.variables = vars.size;
  return m;
}
