// Leitura de projetos .sb3 (Scratch 3 / PictoBlox). O arquivo é um ZIP com project.json + mídias;
// só o project.json é lido. Tudo aqui trata o arquivo como NÃO confiável.

import JSZip from "jszip";
import { emptyModel, type StaticModel } from "../blocks/static-model";

export const MAX_SB3_BYTES = 25 * 1024 * 1024; // projetos com muitos sons/imagens ficam grandes
const MAX_PROJECT_JSON_BYTES = 10 * 1024 * 1024;
const MAX_BLOCKS = 20000;

export class Sb3Error extends Error {}

type RawBlock = {
  opcode?: unknown;
  next?: unknown;
  parent?: unknown;
  inputs?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  shadow?: unknown;
  topLevel?: unknown;
};
type RawTarget = {
  isStage?: unknown;
  costumes?: unknown;
  sounds?: unknown;
  variables?: unknown;
  lists?: unknown;
  blocks?: unknown;
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const len = (v: unknown) => (Array.isArray(v) ? v.length : isObj(v) ? Object.keys(v).length : 0);

/** Abre o .sb3 e devolve o project.json já interpretado. */
export async function readSb3(bytes: ArrayBuffer | Uint8Array): Promise<unknown> {
  if (bytes.byteLength > MAX_SB3_BYTES) throw new Sb3Error("O arquivo é grande demais (máximo 25 MB).");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Sb3Error("Esse arquivo não parece um projeto .sb3. No PictoBlox, use Arquivo → Salvar no computador.");
  }
  const entry = zip.file("project.json");
  if (!entry) throw new Sb3Error("Não encontrei o project.json dentro do arquivo. Ele foi salvo pelo PictoBlox ou Scratch 3?");
  // tamanho descompactado declarado no ZIP: evita “bombas de zip”
  const declared = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  if (declared > MAX_PROJECT_JSON_BYTES) throw new Sb3Error("O projeto é grande demais para verificar.");
  const text = await entry.async("string");
  if (text.length > MAX_PROJECT_JSON_BYTES) throw new Sb3Error("O projeto é grande demais para verificar.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Sb3Error("O arquivo do projeto está corrompido.");
  }
}

/** Converte o project.json no modelo estático usado pelo verificador. */
export function modelFromProjectJson(project: unknown): StaticModel {
  const m = emptyModel("sb3");
  const targets = (isObj(project) && Array.isArray(project.targets) ? project.targets : []).filter(isObj) as RawTarget[];
  if (targets.length === 0) throw new Sb3Error("Esse projeto não tem atores nem palco. Ele foi salvo pelo PictoBlox ou Scratch 3?");

  m.sprites = targets.filter((t) => t.isStage !== true).length;
  const stage = targets.find((t) => t.isStage === true);
  m.backdrops = stage ? len(stage.costumes) : 0;
  m.maxCostumes = Math.max(0, ...targets.filter((t) => t.isStage !== true).map((t) => len(t.costumes)));
  m.sounds = targets.reduce((n, t) => n + len(t.sounds), 0);
  m.variables = targets.reduce((n, t) => n + len(t.variables), 0);

  let total = 0;
  for (const t of targets) {
    const blocks = isObj(t.blocks) ? (t.blocks as Record<string, unknown>) : {};
    const get = (id: unknown): RawBlock | null => {
      if (typeof id !== "string") return null;
      const b = blocks[id];
      return isObj(b) && typeof b.opcode === "string" ? (b as RawBlock) : null;
    };

    for (const raw of Object.values(blocks)) {
      if (++total > MAX_BLOCKS) throw new Sb3Error("O projeto tem blocos demais para verificar.");
      if (!isObj(raw) || typeof raw.opcode !== "string" || raw.shadow === true) continue;
      const op = raw.opcode;
      m.opcodeCounts[op] = (m.opcodeCounts[op] ?? 0) + 1;
      m.blockCount++;
      if (op === "event_whenkeypressed") {
        const key = (raw.fields as Record<string, unknown> | undefined)?.KEY_OPTION;
        if (Array.isArray(key) && typeof key[0] === "string") m.keys.add(key[0]);
      }
      // textos literais das entradas: [1, [10, "Olá"]] ou referência a um bloco-sombra com campo TEXT
      for (const [name, input] of Object.entries(isObj(raw.inputs) ? raw.inputs : {})) {
        if (!Array.isArray(input)) continue;
        const v = input[input.length === 3 ? 2 : 1] ?? input[1];
        if (Array.isArray(v) && v.length >= 2 && (typeof v[1] === "string" || typeof v[1] === "number")) {
          m.texts.push({ opcode: op, input: name, value: String(v[1]).slice(0, 300) });
        } else {
          const sh = get(input[1]);
          const f = sh?.fields && Object.values(sh.fields)[0];
          if (sh?.shadow === true && Array.isArray(f) && f[0] !== undefined) m.texts.push({ opcode: op, input: name, value: String(f[0]).slice(0, 300) });
        }
      }
    }

    // Percorre a árvore a partir de cada bloco, coletando opcodes (com limite contra ciclos).
    const collect = (id: unknown, out: Set<string>, seen: Set<string>, followNext: boolean) => {
      let cur = id;
      while (typeof cur === "string" && !seen.has(cur)) {
        seen.add(cur);
        const b = get(cur);
        if (!b) return;
        if (b.shadow !== true) out.add(b.opcode as string);
        for (const input of Object.values(isObj(b.inputs) ? b.inputs : {})) {
          if (Array.isArray(input) && typeof input[1] === "string") collect(input[1], out, seen, true);
        }
        if (!followNext) return;
        cur = b.next;
      }
    };

    for (const [id, raw] of Object.entries(blocks)) {
      const b = get(id);
      if (!b || b.shadow === true) continue;
      const inputs = isObj(raw) && isObj((raw as RawBlock).inputs) ? ((raw as RawBlock).inputs as Record<string, unknown>) : {};
      // C-blocks: o que está dentro de SUBSTACK/SUBSTACK2
      const subs = Object.entries(inputs).filter(([k, v]) => k.startsWith("SUBSTACK") && Array.isArray(v) && typeof v[1] === "string");
      if (subs.length) {
        const inside = new Set<string>();
        for (const [, v] of subs) collect((v as unknown[])[1], inside, new Set(), true);
        m.containers.push({ opcode: b.opcode as string, inside });
      }
      // scripts: blocos de topo que são “chapéus” (eventos)
      if (b.topLevel === true && typeof b.opcode === "string" && /^(event_when|control_start_as_clone|procedures_definition)/.test(b.opcode)) {
        const opcodes = new Set<string>();
        collect(b.next, opcodes, new Set([id]), true);
        m.scripts.push({ hat: b.opcode, opcodes });
      }
    }
  }
  return m;
}

export async function modelFromSb3(bytes: ArrayBuffer | Uint8Array): Promise<StaticModel> {
  return modelFromProjectJson(await readSb3(bytes));
}
