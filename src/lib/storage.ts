import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Armazenamento de arquivos privados (entregas das game jams, logos das escolas).
// Os arquivos recebem uma CHAVE ALEATÓRIA — nunca o nome original — e só saem por rotas
// do próprio site (que checam permissão). Dois destinos:
// - Produção: bucket PRIVADO do Supabase Storage (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//   Crie o bucket uma vez com `npm run storage:setup`.
// - Desenvolvimento: pasta .data/uploads (fora de public/, ignorada pelo git).

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const BUCKET = process.env.SUPABASE_BUCKET ?? "blocos-arquivos";
const useSupabase = Boolean(SUPABASE_URL && SERVICE_KEY);

const ROOT = path.resolve(process.env.STORAGE_DIR ?? ".data/uploads");

function checkKey(key: string) {
  if (!/^[a-z0-9-]+\/[0-9a-f-]{36}$/.test(key)) throw new Error("Chave de arquivo inválida.");
  return key;
}

const localFile = (key: string) => path.join(ROOT, ...checkKey(key).split("/"));

async function supabase(method: string, objectPath: string, body?: BodyInit, contentType = "application/octet-stream") {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${objectPath}`, {
    method,
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY!, "Content-Type": contentType, "x-upsert": "false" },
    body,
    cache: "no-store",
  });
  return res;
}

/** Grava e devolve a chave (ex.: "jams/2b0c…"). */
export async function putFile(folder: "jams" | "marca", bytes: Uint8Array) {
  const key = `${folder}/${randomUUID()}`;
  if (useSupabase) {
    const res = await supabase("POST", `${BUCKET}/${key}`, Buffer.from(bytes));
    if (!res.ok) throw new Error(`Falha ao gravar arquivo (${res.status}).`);
    return key;
  }
  const file = localFile(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return key;
}

export async function getFile(key: string) {
  checkKey(key);
  if (useSupabase) {
    const res = await supabase("GET", `authenticated/${BUCKET}/${key}`);
    if (!res.ok) throw new Error(`Arquivo não encontrado (${res.status}).`);
    return new Uint8Array(await res.arrayBuffer());
  }
  return new Uint8Array(await readFile(localFile(key)));
}

export async function deleteFile(key: string) {
  checkKey(key);
  if (useSupabase) {
    await supabase("DELETE", BUCKET, JSON.stringify({ prefixes: [key] }), "application/json");
    return;
  }
  await rm(localFile(key), { force: true });
}
