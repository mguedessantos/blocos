// Navegador: monta o .sb3 do projeto inicial (com a arte de /editor-assets) e lê o .sb3 do editor
// de volta para o nosso formato. Também guarda o rascunho do aluno (o .sb3 inteiro) no IndexedDB.
import JSZip from "jszip";
import type { ProjectState } from "@/lib/blocks/project";
import type { CharacterId } from "@/lib/blocks/library";
import ALIASES from "./asset-aliases.json";
import ASSETS from "./assets.json";
import { projectToSb3Json, sb3JsonToProject } from "./convert";

export async function buildSb3(state: ProjectState): Promise<ArrayBuffer> {
  const { json, assets } = projectToSb3Json(state);
  const zip = new JSZip();
  zip.file("project.json", JSON.stringify(json));
  await Promise.all(
    assets.map(async (name) => {
      const res = await fetch(`/editor-assets/${name}`);
      if (!res.ok) throw new Error(`Arquivo da biblioteca não encontrado: ${name}`);
      zip.file(name, await res.arrayBuffer());
    }),
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

/**
 * Personagens da biblioteca sempre com o desenho atual: fantasias com imagem da biblioteca (atual ou antiga, via
 * asset-aliases.json) recebem a arte de hoje. Só a arte muda; o código e as fantasias desenhadas pelo aluno ficam.
 */
export async function refreshArt(sb3: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(sb3);
  const file = zip.file("project.json");
  if (!file) return sb3;
  const json = JSON.parse(await file.async("string"));
  const aliases = ALIASES as Record<string, string>;
  const byAsset = new Map<string, CharacterId>();
  for (const [id, cs] of Object.entries(ASSETS.characters)) for (const c of cs) byAsset.set(c.md5ext, id as CharacterId);
  for (const [old, cur] of Object.entries(aliases)) if (byAsset.has(cur)) byAsset.set(old, byAsset.get(cur)!);
  const add = new Set<string>();
  let changed = false;
  for (const target of Array.isArray(json.targets) ? json.targets : []) {
    const costumes: { name?: string; md5ext?: string; assetId?: string; rotationCenterX?: number; rotationCenterY?: number; bitmapResolution?: number; dataFormat?: string }[] =
      Array.isArray(target.costumes) ? target.costumes : [];
    if (target.isStage) {
      for (const c of costumes) {
        const cur = c.md5ext && aliases[c.md5ext];
        if (!cur) continue;
        Object.assign(c, { md5ext: cur, assetId: cur.split(".")[0] });
        add.add(cur);
        changed = true;
      }
      continue;
    }
    const id = costumes.map((c) => c.md5ext && byAsset.get(c.md5ext)).find(Boolean);
    if (!id) continue;
    const lib = ASSETS.characters[id];
    for (const c of costumes) {
      // só troca imagens da biblioteca (atuais ou antigas): fantasia desenhada pelo aluno nunca muda
      if (!c.md5ext || byAsset.get(c.md5ext) !== id) continue;
      const now = lib.find((x) => x.name === c.name) ?? lib[0];
      if (!now || c.md5ext === now.md5ext) continue;
      Object.assign(c, {
        md5ext: now.md5ext, assetId: now.md5ext.split(".")[0], dataFormat: now.md5ext.endsWith(".svg") ? "svg" : "png", bitmapResolution: now.md5ext.endsWith(".svg") ? 1 : ASSETS.bitmapResolution,
        rotationCenterX: now.rotationCenterX, rotationCenterY: now.rotationCenterY,
      });
      add.add(now.md5ext);
      changed = true;
    }
  }
  if (!changed) return sb3;
  await Promise.all([...add].map(async (name) => {
    const res = await fetch(`/editor-assets/${name}`);
    if (res.ok) zip.file(name, await res.arrayBuffer());
  }));
  zip.file("project.json", JSON.stringify(json));
  return zip.generateAsync({ type: "arraybuffer" });
}

/** Lança ConvertError (mensagem para a criança) se o projeto usa blocos que não sabemos verificar. */
export async function projectFromSb3(sb3: ArrayBuffer): Promise<ProjectState> {
  const zip = await JSZip.loadAsync(sb3);
  const file = zip.file("project.json");
  if (!file) throw new Error("Arquivo do editor sem project.json.");
  return sb3JsonToProject(JSON.parse(await file.async("string")));
}

// ───────────── rascunho no IndexedDB (por lição, neste computador) ─────────────
const DB = "blocos-rascunhos";
const STORE = "sb3";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).finally(() => db.close());
  } catch {
    return undefined; // navegação privada ou sem IndexedDB: segue sem rascunho
  }
}
export type Draft = { sb3: ArrayBuffer; at: number };
export const readDraft = async (key: string): Promise<Draft | undefined> => {
  const v = await tx<Draft | ArrayBuffer>("readonly", (s) => s.get(key));
  return v instanceof ArrayBuffer ? { sb3: v, at: 0 } : v;
};
export const writeDraft = (key: string, sb3: ArrayBuffer) => tx("readwrite", (s) => s.put({ sb3, at: Date.now() } satisfies Draft, key));
export const clearDraft = (key: string) => tx("readwrite", (s) => s.delete(key));

// ───────────── projeto guardado no servidor (vale em qualquer computador) ─────────────
export async function fetchSavedProject(lessonId: string): Promise<Draft | undefined> {
  try {
    const res = await fetch(`/api/licoes/${lessonId}/projeto`, { cache: "no-store" });
    if (res.status !== 200) return undefined;
    return { sb3: await res.arrayBuffer(), at: Date.parse(res.headers.get("X-Saved-At") ?? "") || 0 };
  } catch {
    return undefined;
  }
}
export async function uploadProject(lessonId: string, sb3: ArrayBuffer) {
  try {
    await fetch(`/api/licoes/${lessonId}/projeto`, { method: "PUT", body: sb3, headers: { "Content-Type": "application/octet-stream" } });
  } catch {
    /* sem rede agora: o rascunho local continua guardado */
  }
}
export async function deleteSavedProject(lessonId: string) {
  await fetch(`/api/licoes/${lessonId}/projeto`, { method: "DELETE" }).catch(() => {});
}
