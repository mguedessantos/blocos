// Conversão entre o nosso projeto (ProjectState, com o estado do Blockly de cada ator) e o
// project.json do .sb3 usado pelo editor de blocos (iframe). Os opcodes são os mesmos do Scratch;
// muda só a forma: menus que lá são "blocos sombra" aqui são campos, e literais viram sombras do Blockly.
import { BLOCKS_BY_OPCODE } from "@/lib/blocks/catalog";
import { BACKDROPS, SOUNDS, isBackdrop, type BackdropId, type CharacterId, type SoundId } from "@/lib/blocks/library";
import { normalizeProject, MAX_SPRITES, type ProjectState, type SpriteState } from "@/lib/blocks/project";
import type { BlocklyBlock, BlocklyState } from "@/lib/blocks/program";
import ASSETS from "./assets.json";

export class ConvertError extends Error {}

/** Menus que no Scratch são uma entrada com um bloco sombra: campo → opcode da sombra. */
const MENU_SHADOWS: Record<string, string> = {
  "motion_goto.TO": "motion_goto_menu",
  "motion_pointtowards.TOWARDS": "motion_pointtowards_menu",
  "looks_switchcostumeto.COSTUME": "looks_costume",
  "looks_switchbackdropto.BACKDROP": "looks_backdrops",
  "sound_play.SOUND_MENU": "sound_sounds_menu",
  "sound_playuntildone.SOUND_MENU": "sound_sounds_menu",
  "control_create_clone_of.CLONE_OPTION": "control_create_clone_of_menu",
  "sensing_touchingobject.TOUCHINGOBJECTMENU": "sensing_touchingobjectmenu",
  "sensing_keypressed.KEY_OPTION": "sensing_keyoptions",
  "sensing_distanceto.DISTANCETOMENU": "sensing_distancetomenu",
};
const MENU_OPCODES = new Set([...Object.values(MENU_SHADOWS), "event_broadcast_menu"]);
const LITERAL_SHADOWS = new Set(["math_number", "math_positive_number", "math_whole_number", "math_integer", "math_angle", "text", "colour_picker"]);
/** Entradas de texto (o resto das entradas literais é número). */
const TEXT_INPUTS = new Set(["MESSAGE", "STRING1", "STRING2", "OPERAND1", "OPERAND2", "VALUE"]);

const BACKDROP_BY_NAME = new Map<string, BackdropId>(Object.entries(BACKDROPS).map(([id, name]) => [name, id as BackdropId]));
const SOUND_BY_NAME = new Map<string, SoundId>(Object.entries(SOUNDS).map(([id, name]) => [name, id as SoundId]));
const BACKDROP_BY_ASSET = new Map(Object.entries(ASSETS.backdrops).map(([bid, b]) => [b.md5ext.split(".")[0], bid as BackdropId]));
const CHARACTER_BY_ASSET = new Map(
  Object.entries(ASSETS.characters).flatMap(([id, costumes]) => costumes.map((c) => [c.md5ext.split(".")[0], id as CharacterId] as const)),
);

type Sb3Block = {
  opcode: string;
  next: string | null;
  parent: string | null;
  inputs: Record<string, unknown[]>;
  fields: Record<string, unknown[]>;
  shadow: boolean;
  topLevel: boolean;
  x?: number;
  y?: number;
};
type Sb3Target = Record<string, unknown> & { isStage: boolean; name: string; blocks: Record<string, Sb3Block> };

// ───────────────────────────── nosso projeto → .sb3 ─────────────────────────────

/** project.json do .sb3 + lista de arquivos de arte/som que ele usa (em /editor-assets). */
export function projectToSb3Json(state: ProjectState): { json: Record<string, unknown>; assets: string[] } {
  const assets = new Set<string>();
  const broadcasts = new Map<string, string>(); // nome → id
  const varName = new Map(state.variables.map((v) => [v.id, v.name]));
  let seq = 0;
  const id = () => `b${(seq++).toString(36)}`;
  let usesPen = false;

  const sounds = () =>
    Object.entries(ASSETS.sounds).map(([, s]) => {
      assets.add(s.md5ext);
      const [assetId, dataFormat] = s.md5ext.split(".");
      return { name: s.name, assetId, md5ext: s.md5ext, dataFormat, rate: s.rate, sampleCount: s.sampleCount };
    });

  function convertWorkspace(ws: BlocklyState, localVars: Map<string, string>): Record<string, Sb3Block> {
    const out: Record<string, Sb3Block> = {};
    for (const v of ws.variables ?? []) localVars.set(v.id, v.name);
    const nameOf = (field: unknown) => {
      const vid = field && typeof field === "object" && "id" in field ? String((field as { id: unknown }).id) : String(field);
      return [localVars.get(vid) ?? varName.get(vid) ?? vid, vid];
    };
    const literal = (input: string, value: unknown) => (TEXT_INPUTS.has(input) ? [10, String(value ?? "")] : [4, String(value ?? "")]);

    function add(b: BlocklyBlock, parent: string | null, topLevel: boolean, pos?: { x: number; y: number }): string {
      const me = id();
      if (b.type.startsWith("pen_")) usesPen = true;
      const block: Sb3Block = { opcode: b.type, next: null, parent, inputs: {}, fields: {}, shadow: false, topLevel, ...(topLevel ? { x: pos?.x ?? 0, y: pos?.y ?? 0 } : {}) };
      out[me] = block;
      for (const [k, raw] of Object.entries(b.fields ?? {})) {
        const v = typeof raw === "object" ? raw : String(raw);
        if (k === "VARIABLE") block.fields.VARIABLE = nameOf(v);
        else if (k === "BROADCAST_OPTION") {
          const name = String(v);
          if (!broadcasts.has(name)) broadcasts.set(name, `m_${broadcasts.size}`);
          if (b.type === "event_whenbroadcastreceived") block.fields.BROADCAST_OPTION = [name, broadcasts.get(name)];
          else block.inputs.BROADCAST_INPUT = [1, [11, name, broadcasts.get(name)]];
        } else if (MENU_SHADOWS[`${b.type}.${k}`]) {
          const shadow = id();
          const value = k === "BACKDROP" && isBackdrop(v) ? BACKDROPS[v] : k === "SOUND_MENU" && String(v) in SOUNDS ? SOUNDS[v as SoundId] : String(v);
          out[shadow] = { opcode: MENU_SHADOWS[`${b.type}.${k}`], next: null, parent: me, inputs: {}, fields: { [k]: [value, null] }, shadow: true, topLevel: false };
          block.inputs[k] = [1, shadow];
        } else block.fields[k] = [k === "EFFECT" ? String(v).toUpperCase() : String(v), null];
      }
      for (const [k, inp] of Object.entries(b.inputs ?? {})) {
        if (k === "SUBSTACK" || k === "SUBSTACK2") {
          if (inp.block) block.inputs[k] = [2, addChain(inp.block, me)];
          continue;
        }
        const shadowVal = inp.shadow ? (inp.shadow.fields?.NUM ?? inp.shadow.fields?.TEXT) : undefined;
        if (inp.block) {
          const child = add(inp.block, me, false);
          block.inputs[k] = inp.shadow ? [3, child, literal(k, shadowVal)] : [2, child];
        } else if (inp.shadow) block.inputs[k] = [1, literal(k, shadowVal)];
      }
      return me;
    }
    function addChain(first: BlocklyBlock, parent: string | null, pos?: { x: number; y: number }): string {
      let prev: string | null = null;
      let head = "";
      for (let b: BlocklyBlock | undefined = first; b; b = b.next?.block) {
        const me = add(b, prev ?? parent, prev === null && parent === null, pos);
        if (prev) out[prev].next = me;
        else head = me;
        prev = me;
      }
      return head;
    }
    (ws.blocks?.blocks ?? []).forEach((top, i) => {
      const p = top as BlocklyBlock & { x?: number; y?: number };
      addChain(top, null, { x: p.x ?? 40, y: p.y ?? 40 + i * 160 });
    });
    return out;
  }

  const costume = (c: { name: string; md5ext: string; rotationCenterX: number; rotationCenterY: number }) => {
    assets.add(c.md5ext);
    const [assetId, dataFormat] = c.md5ext.split(".");
    return { name: c.name, bitmapResolution: ASSETS.bitmapResolution, dataFormat, assetId, md5ext: c.md5ext, rotationCenterX: c.rotationCenterX, rotationCenterY: c.rotationCenterY };
  };

  const sprites = state.sprites.map((s, i) => {
    const locals = new Map<string, string>();
    const blocks = convertWorkspace(s.workspace, locals);
    return {
      isStage: false, name: s.name, variables: Object.fromEntries([...locals].map(([vid, name]) => [vid, [name, 0]])), lists: {}, broadcasts: {},
      blocks, comments: {}, currentCostume: 0, costumes: ASSETS.characters[s.character].map(costume), sounds: sounds(), volume: 100,
      layerOrder: i + 1, visible: s.visible, x: s.x, y: s.y, size: s.size, direction: s.direction, draggable: false, rotationStyle: "all around",
    };
  });
  const stageBlocks = convertWorkspace(state.stage.workspace, new Map());
  const backdrops = state.stage.backdrops.length ? state.stage.backdrops : (["branco"] as BackdropId[]);
  const stage = {
    isStage: true, name: "Stage", variables: Object.fromEntries(state.variables.map((v) => [v.id, [v.name, 0]])), lists: {},
    broadcasts: Object.fromEntries([...broadcasts].map(([name, bid]) => [bid, name])), blocks: stageBlocks, comments: {}, currentCostume: 0,
    costumes: backdrops.map((b) => costume(ASSETS.backdrops[b])), sounds: sounds(), volume: 100, layerOrder: 0, tempo: 60,
    videoTransparency: 50, videoState: "on", textToSpeechLanguage: null,
  };
  return {
    json: { targets: [stage, ...sprites], monitors: [], extensions: usesPen ? ["pen"] : [], meta: { semver: "3.0.0", vm: "0.2.0", agent: "Blocos" } },
    assets: [...assets],
  };
}

// ───────────────────────────── .sb3 → nosso projeto ─────────────────────────────

const MAX_DEPTH = 200;
const MAX_BLOCKS = 4000;

/**
 * project.json (vindo do navegador: não confiável) → ProjectState. Lança ConvertError com uma
 * mensagem para a criança quando usa um bloco que a plataforma ainda não sabe verificar.
 */
export function sb3JsonToProject(json: unknown): ProjectState {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(json) || !Array.isArray(json.targets)) throw new ConvertError("Projeto inválido.");
  const targets = json.targets.filter(isObj) as Sb3Target[];
  const stage = targets.find((t) => t.isStage === true);
  const spriteTargets = targets.filter((t) => t.isStage !== true).slice(0, MAX_SPRITES);
  if (!stage) throw new ConvertError("Projeto sem palco.");

  const unsupported = new Set<string>();
  let total = 0;
  const str = (v: unknown, max = 60) => String(v ?? "").slice(0, max);
  const varsOf = (t: Sb3Target) =>
    Object.entries(isObj(t.variables) ? t.variables : {})
      .filter(([, v]) => Array.isArray(v))
      .map(([vid, v]) => ({ id: str(vid), name: str((v as unknown[])[0], 50) }));

  function convertBlocks(t: Sb3Target): BlocklyState {
    const blocks: Record<string, Sb3Block> = isObj(t.blocks) ? (t.blocks as Record<string, Sb3Block>) : {};
    const get = (bid: unknown) => (typeof bid === "string" && Object.hasOwn(blocks, bid) && isObj(blocks[bid]) ? blocks[bid] : undefined);
    const fieldValue = (f: unknown) => (Array.isArray(f) ? f[0] : f);

    function block(src: Sb3Block, depth: number): BlocklyBlock {
      if (depth > MAX_DEPTH || ++total > MAX_BLOCKS) throw new ConvertError("O projeto é grande demais para verificar.");
      const opcode = str(src.opcode, 80);
      if (!BLOCKS_BY_OPCODE.has(opcode)) unsupported.add(opcode);
      const out: BlocklyBlock = { type: opcode, fields: {}, inputs: {} };
      for (const [k, f] of Object.entries(isObj(src.fields) ? src.fields : {})) {
        if (k === "VARIABLE") out.fields!.VARIABLE = { id: str(Array.isArray(f) ? f[1] ?? f[0] : f) };
        else if (k === "EFFECT") out.fields![k] = str(fieldValue(f)).toLowerCase();
        else out.fields![k] = str(fieldValue(f));
      }
      for (const [k, inp] of Object.entries(isObj(src.inputs) ? src.inputs : {})) {
        if (!Array.isArray(inp)) continue;
        const value = inp[1];
        if (k === "SUBSTACK" || k === "SUBSTACK2") {
          const first = get(value);
          if (first) out.inputs![k] = { block: chain(first, depth + 1) };
          continue;
        }
        if (Array.isArray(value)) {
          primitive(out, k, value);
          continue;
        }
        const child = get(value);
        if (!child) continue;
        if (child.shadow && LITERAL_SHADOWS.has(child.opcode)) {
          const v = fieldValue(Object.values(isObj(child.fields) ? child.fields : {})[0]);
          out.inputs![k] = literal(child.opcode === "text" ? "text" : "num", v);
        } else if (child.shadow && (MENU_OPCODES.has(child.opcode) || Object.keys(child.fields ?? {}).length === 1)) {
          // menu: o valor vira um campo do próprio bloco
          const [fname, f] = Object.entries(isObj(child.fields) ? child.fields : {})[0] ?? [];
          if (fname) out.fields![k === "BROADCAST_INPUT" ? "BROADCAST_OPTION" : fname] = menuValue(fname, str(fieldValue(f)));
        } else {
          out.inputs![k] = { block: block(child, depth + 1) };
        }
      }
      return out;
    }
    function primitive(out: BlocklyBlock, k: string, p: unknown[]) {
      const kind = p[0];
      if (kind === 11) out.fields!.BROADCAST_OPTION = str(p[1]);
      else if (kind === 12) out.inputs![k] = { block: { type: "data_variable", fields: { VARIABLE: { id: str(p[2] ?? p[1]) } } } };
      else if (kind === 13) unsupported.add("data_listcontents");
      else out.inputs![k] = literal(kind === 10 ? "text" : "num", p[1]);
    }
    const literal = (kind: "text" | "num", v: unknown) => {
      if (kind === "text") return { shadow: { type: "text", fields: { TEXT: str(v, 200) } } };
      const n = Number(v);
      return { shadow: { type: "math_number", fields: { NUM: v === "" || !Number.isFinite(n) ? str(v, 200) : n } } };
    };
    const menuValue = (field: string, v: string) =>
      field === "BACKDROP" ? (BACKDROP_BY_NAME.get(v) ?? v) : field === "SOUND_MENU" ? (SOUND_BY_NAME.get(v) ?? v) : v;

    function chain(first: Sb3Block, depth: number): BlocklyBlock {
      const head = block(first, depth);
      let tail = head;
      for (let nx = get(first.next), guard = 0; nx && guard < MAX_BLOCKS; nx = get(nx.next), guard++) {
        const b = block(nx, depth);
        tail.next = { block: b };
        tail = b;
      }
      return head;
    }

    const tops = Object.values(blocks).filter((b) => isObj(b) && b.topLevel === true && !b.shadow);
    // só scripts que começam com um bloco de início contam (blocos soltos são ignorados, como no Scratch)
    return { blocks: { blocks: tops.map((b) => ({ ...chain(b, 0), x: Number(b.x) || 0, y: Number(b.y) || 0 }) as BlocklyBlock) } };
  }

  const characterOf = (t: Sb3Target): CharacterId => {
    for (const c of Array.isArray(t.costumes) ? t.costumes : []) {
      const found = isObj(c) && CHARACTER_BY_ASSET.get(str(c.assetId, 40));
      if (found) return found;
    }
    return "bloquinho"; // ator desenhado pelo aluno: colisão com o tamanho padrão
  };
  const num = (v: unknown, def: number) => (typeof v === "number" && Number.isFinite(v) ? v : def);

  const sprites: SpriteState[] = spriteTargets.map((t, i) => ({
    id: `s${i + 1}`,
    name: str(t.name, 30) || `Ator ${i + 1}`,
    character: characterOf(t),
    x: num(t.x, 0), y: num(t.y, 0), direction: num(t.direction, 90), size: num(t.size, 100), visible: t.visible !== false,
    workspace: { ...convertBlocks(t), variables: varsOf(t) },
  }));
  const backdrops = (Array.isArray(stage.costumes) ? stage.costumes : [])
    .map((c) => (isObj(c) ? (BACKDROP_BY_NAME.get(str(c.name)) ?? BACKDROP_BY_ASSET.get(str(c.assetId, 40))) : undefined))
    .filter((b): b is BackdropId => !!b);
  const stageWs = convertBlocks(stage);

  if (unsupported.size) {
    const names = [...unsupported].slice(0, 3).join(", ");
    throw new ConvertError(`Este projeto usa blocos que a plataforma ainda não sabe verificar (${names}). Tire esses blocos e tente de novo.`);
  }
  return normalizeProject({ v: 2, sprites, stage: { backdrops: backdrops.length ? backdrops : ["branco"], workspace: stageWs }, variables: varsOf(stage) });
}

