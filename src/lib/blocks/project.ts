// Projeto do editor do site: vários atores (cada um com seus blocos) + palco com cenários.
// É o que o aluno salva, o que o servidor verifica e o que será exportado como .sb3.
// Toda entrada vem do navegador: `normalizeProject` valida e limita tudo.

import { BACKDROPS, CHARACTERS, isBackdrop, isCharacter, type BackdropId, type CharacterId } from "./library";
import { programFromBlockly, type BlocklyState, type Program } from "./program";

export type SpriteState = {
  id: string;
  name: string;
  character: CharacterId;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  workspace: BlocklyState;
};

export type ProjectState = {
  v: 2;
  sprites: SpriteState[];
  stage: { backdrops: BackdropId[]; workspace: BlocklyState };
  /** Variáveis do projeto (para todos os atores). */
  variables: { id: string; name: string }[];
};

export const MAX_SPRITES = 20;
const MAX_VARIABLES = 30;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, def: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def);
const text = (v: unknown, def: string, max = 30) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : def);
const ws = (v: unknown): BlocklyState => (isObj(v) ? (v as BlocklyState) : {});

export function newSprite(character: CharacterId, name?: string, at: Partial<SpriteState> = {}): SpriteState {
  return {
    id: `s${Math.random().toString(36).slice(2, 9)}`,
    name: name ?? CHARACTERS[character].name,
    character,
    x: 0,
    y: 0,
    direction: 90,
    size: 100,
    visible: true,
    workspace: {},
    ...at,
  };
}

export function emptyProject(): ProjectState {
  return { v: 2, sprites: [{ ...newSprite("bloquinho"), id: "s1" }], stage: { backdrops: ["branco"], workspace: {} }, variables: [] };
}

/** Aceita o formato novo (v2) e o antigo (estado do Blockly de um ator só). */
export function normalizeProject(raw: unknown): ProjectState {
  if (!isObj(raw)) return emptyProject();
  if (raw.v !== 2) {
    // formato antigo: um único Bloquinho com o estado do Blockly
    const legacy = raw as BlocklyState;
    const p = emptyProject();
    p.sprites[0].workspace = { blocks: legacy.blocks };
    p.variables = Array.isArray(legacy.variables) ? legacy.variables.filter(isObj).map((v) => ({ id: text(v.id, "v", 60), name: text(v.name, "variável") })) : [];
    return p;
  }

  const names = new Set<string>();
  const sprites = (Array.isArray(raw.sprites) ? raw.sprites : []).filter(isObj).slice(0, MAX_SPRITES).map((s, i) => {
    const base = text(s.name, `Ator ${i + 1}`, 26);
    let name = base;
    for (let k = 2; names.has(name); k++) name = `${base} ${k}`;
    names.add(name);
    return {
      id: text(s.id, `s${i + 1}`, 40),
      name,
      character: isCharacter(s.character) ? s.character : "bloquinho",
      x: num(s.x, 0, -240, 240),
      y: num(s.y, 0, -180, 180),
      direction: num(s.direction, 90, -180, 180),
      size: num(s.size, 100, 5, 500),
      visible: s.visible !== false,
      workspace: ws(s.workspace),
    } satisfies SpriteState;
  });
  const stage = isObj(raw.stage) ? raw.stage : {};
  const backdrops = (Array.isArray(stage.backdrops) ? stage.backdrops : []).filter(isBackdrop).slice(0, 10);
  const variables = (Array.isArray(raw.variables) ? raw.variables : []).filter(isObj).slice(0, MAX_VARIABLES)
    .map((v) => ({ id: text(v.id, "v", 60), name: text(v.name, "variável") }));
  return {
    v: 2,
    sprites: sprites.length ? sprites : emptyProject().sprites,
    stage: { backdrops: backdrops.length ? backdrops : ["branco"], workspace: ws(stage.workspace) },
    variables,
  };
}

export type SpriteProgram = Omit<SpriteState, "workspace" | "id"> & { program: Program };
export type ProjectProgram = {
  sprites: SpriteProgram[];
  stage: { backdrops: BackdropId[]; program: Program };
  variables: string[];
  opcodeCounts: Record<string, number>;
  blockCount: number;
};

/** Converte o projeto em programas executáveis (um por ator + palco). */
export function compileProject(project: ProjectState): ProjectProgram {
  const sprites = project.sprites.map(({ workspace, name, character, x, y, direction, size, visible }) => ({
    name, character, x, y, direction, size, visible, program: programFromBlockly(workspace, project.variables),
  }));
  const stage = { backdrops: project.stage.backdrops, program: programFromBlockly(project.stage.workspace, project.variables) };
  const opcodeCounts: Record<string, number> = Object.create(null);
  let blockCount = 0;
  for (const p of [...sprites.map((s) => s.program), stage.program]) {
    blockCount += p.blockCount;
    for (const [op, n] of Object.entries(p.opcodeCounts)) opcodeCounts[op] = (opcodeCounts[op] ?? 0) + n;
  }
  return { sprites, stage, variables: project.variables.map((v) => v.name), opcodeCounts, blockCount };
}

/** Projeto de um ator só a partir de um programa (testes e compatibilidade). */
export function singleSpriteProject(program: Program): ProjectProgram {
  const empty = programFromBlockly({});
  return {
    sprites: [{ name: "Bloquinho", character: "bloquinho", x: 0, y: 0, direction: 90, size: 100, visible: true, program }],
    stage: { backdrops: ["branco"], program: empty },
    variables: [],
    opcodeCounts: program.opcodeCounts,
    blockCount: program.blockCount,
  };
}

export const BACKDROP_IDS = Object.keys(BACKDROPS) as BackdropId[];
