// Leitura de projetos .sb3 (Scratch 3). O arquivo é um ZIP com project.json + mídias; só o project.json é lido
// (para validar o que o editor salva e o que as equipes entregam nas jams). Tudo aqui trata o arquivo como NÃO confiável.

import JSZip from "jszip";

export const MAX_SB3_BYTES = 25 * 1024 * 1024; // projetos com muitos sons/imagens ficam grandes
const MAX_PROJECT_JSON_BYTES = 10 * 1024 * 1024;

export class Sb3Error extends Error {}

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
