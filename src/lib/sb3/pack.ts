// Navegador: monta o .sb3 do projeto inicial (com a arte de /editor-assets) e lê o .sb3 do editor
// de volta para o nosso formato. Também guarda o rascunho do aluno (o .sb3 inteiro) no IndexedDB.
import JSZip from "jszip";
import type { ProjectState } from "@/lib/blocks/project";
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
