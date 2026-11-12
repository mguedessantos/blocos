// Imagens de marca (logo e favicon). Só PNG e JPEG: são seguras para servir (SVG pode
// carregar script) e o gerador de certificados (pdf-lib) sabe embutir as duas.

export const MAX_LOGO_BYTES = 1024 * 1024;

export type ImageKind = "png" | "jpg";

export const IMAGE_TYPES: Record<ImageKind, string> = { png: "image/png", jpg: "image/jpeg" };

/** Descobre o tipo pelos bytes (não pela extensão, que o usuário pode trocar). */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const b = bytes;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  return null;
}

/** Valida e devolve o tipo, ou uma mensagem amigável. */
export function checkBrandImage(bytes: Uint8Array): { kind: ImageKind } | { error: string } {
  if (bytes.length === 0) return { error: "O arquivo está vazio." };
  if (bytes.length > MAX_LOGO_BYTES) return { error: "A imagem pode ter no máximo 1 MB." };
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Use uma imagem PNG ou JPG." };
  return { kind };
}

/** URL pública (relativa: funciona em qualquer domínio da escola). */
export const brandAssetUrl = (key: string) => `/marca/arquivo/${key.split("/")[1]}`;
