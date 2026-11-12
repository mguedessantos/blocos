// Monta projetos do editor do site (JSON do Blockly) de forma compacta: projetos iniciais das lições,
// soluções de referência e testes.
import type { BackdropId, CharacterId } from "./library";
import type { BlocklyBlock, BlocklyState } from "./program";
import { compileProject, normalizeProject, type ProjectState } from "./project";

type In = Record<string, unknown>;
export const n = (v: number) => ({ shadow: { type: "math_number", fields: { NUM: v } } });
export const t = (v: string) => ({ shadow: { type: "text", fields: { TEXT: v } } });
export const r = (block: BlocklyBlock) => ({ block });

export function chain(...blocks: BlocklyBlock[]): BlocklyBlock | undefined {
  const copy = blocks.map((x) => ({ ...x }));
  for (let i = copy.length - 2; i >= 0; i--) copy[i].next = { block: copy[i + 1] };
  return copy[0];
}
export const b = (type: string, inputs: In = {}, fields?: Record<string, unknown>): BlocklyBlock => ({ type, inputs: inputs as BlocklyBlock["inputs"], fields });
export const c = (type: string, inputs: In, body: BlocklyBlock[], body2?: BlocklyBlock[], fields?: Record<string, unknown>): BlocklyBlock =>
  b(type, { ...inputs, SUBSTACK: { block: chain(...body) }, ...(body2 ? { SUBSTACK2: { block: chain(...body2) } } : {}) }, fields);

/** Scripts de um ator: cada um é [chapéu, ...corpo]. */
export const scripts = (...ss: BlocklyBlock[][]): BlocklyState => ({ blocks: { blocks: ss.map((s) => chain(...s)!) } });

// atalhos frequentes
export const flag = () => b("event_whenflagclicked");
export const whenKey = (k: string) => b("event_whenkeypressed", {}, { KEY_OPTION: k });
export const whenClicked = () => b("event_whenthisspriteclicked");
export const whenReceive = (m: string) => b("event_whenbroadcastreceived", {}, { BROADCAST_OPTION: m });
export const whenClone = () => b("control_start_as_clone");
export const broadcast = (m: string) => b("event_broadcast", {}, { BROADCAST_OPTION: m });
export const move = (s: number) => b("motion_movesteps", { STEPS: n(s) });
export const right = (d: number) => b("motion_turnright", { DEGREES: n(d) });
export const left = (d: number) => b("motion_turnleft", { DEGREES: n(d) });
export const changeX = (d: number) => b("motion_changexby", { DX: n(d) });
export const changeY = (d: number) => b("motion_changeyby", { DY: n(d) });
export const gotoXY = (x: number | BlocklyBlock, y: number | BlocklyBlock) =>
  b("motion_gotoxy", { X: typeof x === "number" ? n(x) : r(x), Y: typeof y === "number" ? n(y) : r(y) });
export const repeat = (times: number, ...body: BlocklyBlock[]) => c("control_repeat", { TIMES: n(times) }, body);
export const forever = (...body: BlocklyBlock[]) => c("control_forever", {}, body);
export const iff = (cond: BlocklyBlock, ...body: BlocklyBlock[]) => c("control_if", { CONDITION: r(cond) }, body);
export const ifElse = (cond: BlocklyBlock, yes: BlocklyBlock[], no: BlocklyBlock[]) => c("control_if_else", { CONDITION: r(cond) }, yes, no);
export const keyPressed = (k: string) => b("sensing_keypressed", {}, { KEY_OPTION: k });
export const touching = (what: string) => b("sensing_touchingobject", {}, { TOUCHINGOBJECTMENU: what });
export const say = (msg: In[string]) => b("looks_say", { MESSAGE: msg });
export const sayFor = (msg: string, secs = 1) => b("looks_sayforsecs", { MESSAGE: t(msg), SECS: n(secs) });
export const random = (from: number, to: number) => b("operator_random", { FROM: n(from), TO: n(to) });
export const gt = (a: In[string], z: In[string]) => b("operator_gt", { OPERAND1: a, OPERAND2: z });
export const lt = (a: In[string], z: In[string]) => b("operator_lt", { OPERAND1: a, OPERAND2: z });
export const eq = (a: In[string], z: In[string]) => b("operator_equals", { OPERAND1: a, OPERAND2: z });
export const xpos = () => b("motion_xposition");
export const ypos = () => b("motion_yposition");
export const wait = (s: number) => b("control_wait", { DURATION: n(s) });
export const stopAll = () => b("control_stop", {}, { STOP_OPTION: "all" });
export const sound = (s: string) => b("sound_play", {}, { SOUND_MENU: s });
export const createClone = (of = "_myself_") => b("control_create_clone_of", {}, { CLONE_OPTION: of });
export const deleteClone = () => b("control_delete_this_clone");
export const hide = () => b("looks_hide");
export const show = () => b("looks_show");
export const backdrop = (id: string) => b("looks_switchbackdropto", {}, { BACKDROP: id });
export const pen = () => b("pen_penDown");

// variáveis: ids "v_<nome>"
export const setVar = (name: string, v: In[string]) => b("data_setvariableto", { VALUE: v }, { VARIABLE: { id: `v_${name}` } });
export const changeVar = (name: string, v: In[string]) => b("data_changevariableby", { VALUE: v }, { VARIABLE: { id: `v_${name}` } });
export const getVar = (name: string) => b("data_variable", {}, { VARIABLE: { id: `v_${name}` } });

export type SpriteSpec = { name?: string; character?: CharacterId; x?: number; y?: number; size?: number; visible?: boolean; code?: BlocklyBlock[][] };
export type GameSpec = { sprites: SpriteSpec[]; backdrops?: BackdropId[]; stage?: BlocklyBlock[][]; variables?: string[] };

export function project(spec: GameSpec): ProjectState {
  return normalizeProject({
    v: 2,
    sprites: spec.sprites.map((s, i) => ({
      id: `s${i + 1}`, name: s.name ?? `Ator ${i + 1}`, character: s.character ?? "bloquinho", x: s.x ?? 0, y: s.y ?? 0, direction: 90, size: s.size ?? 100, visible: s.visible ?? true,
      workspace: scripts(...(s.code ?? [])),
    })),
    stage: { backdrops: spec.backdrops ?? ["branco"], workspace: scripts(...(spec.stage ?? [])) },
    variables: (spec.variables ?? []).map((name) => ({ id: `v_${name}`, name })),
  });
}

export const compiled = (spec: GameSpec) => compileProject(project(spec));

/** Projeto inicial de uma lição de jogo (mostra o painel de atores e cenários). */
export function game(spec: GameSpec): ProjectState & { ui: { sprites: true } } {
  return { ...project(spec), ui: { sprites: true } };
}

// mais atalhos (jogos)
export const pointTowards = (what: string) => b("motion_pointtowards", {}, { TOWARDS: what });
export const goTo = (where: string) => b("motion_goto", {}, { TO: where });
export const nextCostume = () => b("looks_nextcostume");
export const distanceTo = (what: string) => b("sensing_distanceto", {}, { DISTANCETOMENU: what });
export const timer = () => b("sensing_timer");
export const resetTimer = () => b("sensing_resettimer");
export const roundOf = (v: BlocklyBlock) => b("operator_round", { NUM: r(v) });
export const join = (a: In[string], z: In[string]) => b("operator_join", { STRING1: a, STRING2: z });
export const setY = (y: number) => b("motion_sety", { Y: n(y) });
export const setX = (x: number | BlocklyBlock) => b("motion_setx", { X: typeof x === "number" ? n(x) : r(x) });
export const rotationLR = () => b("motion_setrotationstyle", {}, { STYLE: "left-right" });
export const effect = (e: "color" | "ghost", by: number) => b("looks_changeeffectby", { CHANGE: n(by) }, { EFFECT: e });
export const playUntilDone = (s: string) => b("sound_playuntildone", {}, { SOUND_MENU: s });
export const waitUntil = (cond: BlocklyBlock) => b("control_wait_until", { CONDITION: r(cond) });
export const ifEdgeBounce = () => b("motion_ifonedgebounce");
