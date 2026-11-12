import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Armazenamento de arquivos privados (entregas das game jams).
// Os arquivos recebem uma CHAVE ALEATÓRIA — nunca o nome original — e só saem por rotas
// autenticadas. Em desenvolvimento ficam em .data/uploads (fora de public/, ignorado pelo git).
// Em produção, troque por um bucket PRIVADO do Supabase Storage mantendo esta interface.

const ROOT = path.resolve(process.env.STORAGE_DIR ?? ".data/uploads");

function fileOf(key: string) {
  if (!/^[a-z0-9-]+\/[0-9a-f-]{36}$/.test(key)) throw new Error("Chave de arquivo inválida.");
  return path.join(ROOT, ...key.split("/"));
}

/** Grava e devolve a chave (ex.: "jams/2b0c…"). */
export async function putFile(folder: "jams", bytes: Uint8Array) {
  const key = `${folder}/${randomUUID()}`;
  const file = fileOf(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return key;
}

export async function getFile(key: string) {
  return new Uint8Array(await readFile(fileOf(key)));
}

export async function deleteFile(key: string) {
  await rm(fileOf(key), { force: true });
}
