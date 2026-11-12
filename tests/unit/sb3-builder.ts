// Monta project.json no formato do Scratch 3 / PictoBlox a partir de uma descrição compacta,
// para testar o leitor de .sb3 e as soluções de referência das lições.
import JSZip from "jszip";

export type Node =
  | string
  | { op: string; sub?: Node[]; sub2?: Node[]; inputs?: Record<string, string | number | Node>; fields?: Record<string, unknown[]> };
export type Script = [hat: Node, ...body: Node[]];
export type SpriteSpec = { name?: string; costumes?: number; sounds?: number; variables?: string[]; scripts?: Script[] };
export type ProjectSpec = { sprites?: SpriteSpec[]; backdrops?: number; stageVariables?: string[]; stageScripts?: Script[] };

let seq = 0;
const id = () => `b${++seq}`;

function buildScripts(scripts: Script[]) {
  const blocks: Record<string, unknown> = {};
  const node = (n: Node, parent: string | null, topLevel: boolean): string => {
    const spec = typeof n === "string" ? { op: n } : n;
    const me = id();
    const inputs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(spec.inputs ?? {})) {
      if (typeof v === "string" || typeof v === "number") inputs[k] = [1, [typeof v === "number" ? 4 : 10, String(v)]];
      else inputs[k] = [3, node(v, me, false), [10, ""]];
    }
    if (spec.sub?.length) inputs.SUBSTACK = [2, chain(spec.sub, me)];
    if (spec.sub2?.length) inputs.SUBSTACK2 = [2, chain(spec.sub2, me)];
    blocks[me] = { opcode: spec.op, next: null, parent, inputs, fields: spec.fields ?? {}, shadow: false, topLevel, ...(topLevel ? { x: 0, y: 0 } : {}) };
    return me;
  };
  const chain = (nodes: Node[], parent: string | null, topLevel = false) => {
    const ids: string[] = [];
    nodes.forEach((n, i) => {
      const bid = node(n, i === 0 ? parent : ids[i - 1], topLevel && i === 0);
      if (i > 0) (blocks[ids[i - 1]] as { next: string }).next = bid;
      ids.push(bid);
    });
    return ids[0];
  };
  for (const s of scripts) chain(s, null, true);
  return blocks;
}

const vars = (names: string[] = []) => Object.fromEntries(names.map((n) => [`v_${n}`, [n, 0]]));
const list = (n: number, kind: string) => Array.from({ length: n }, (_, i) => ({ name: `${kind}${i + 1}`, assetId: `x${i}`, md5ext: `x${i}.svg`, dataFormat: "svg" }));

export function projectJson(p: ProjectSpec) {
  return {
    targets: [
      { isStage: true, name: "Stage", variables: vars(p.stageVariables), lists: {}, broadcasts: {}, blocks: buildScripts(p.stageScripts ?? []), costumes: list(p.backdrops ?? 1, "cenario"), sounds: [] },
      ...(p.sprites ?? [{}]).map((s, i) => ({
        isStage: false,
        name: s.name ?? `Ator${i + 1}`,
        variables: vars(s.variables),
        lists: {},
        blocks: buildScripts(s.scripts ?? []),
        costumes: list(s.costumes ?? 1, "fantasia"),
        sounds: list(s.sounds ?? 0, "som"),
      })),
    ],
    meta: { semver: "3.0.0" },
  };
}

export async function sb3Bytes(p: ProjectSpec | object) {
  const zip = new JSZip();
  zip.file("project.json", JSON.stringify("targets" in p ? p : projectJson(p as ProjectSpec)));
  return zip.generateAsync({ type: "uint8array" });
}

/** Atalho: bloco de tecla. */
export const key = (k: string): Node => ({ op: "event_whenkeypressed", fields: { KEY_OPTION: [k, null] } });
