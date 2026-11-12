import JSZip from "jszip";
import { PDFDocument, PDFName } from "pdf-lib";

// Limpeza dos arquivos das game jams para o JULGAMENTO CEGO: tira autoria/metadados
// que poderiam revelar a escola ou os alunos. Os arquivos são regravados do zero.

export const MAX_PROJECT_BYTES = 25 * 1024 * 1024;
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
const MAX_UNZIPPED = 120 * 1024 * 1024; // proteção contra "zip bomb"
const FIXED_DATE = new Date("2000-01-01T00:00:00Z"); // datas internas do zip não revelam nada

export class FileError extends Error {}

async function openZip(bytes: Uint8Array, what: string) {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new FileError(`Não conseguimos abrir o ${what}. Ele está corrompido?`);
  }
  let total = 0;
  for (const f of Object.values(zip.files)) {
    // @ts-expect-error — campo interno do JSZip com o tamanho descompactado
    total += f._data?.uncompressedSize ?? 0;
    if (total > MAX_UNZIPPED) throw new FileError(`O ${what} é grande demais quando descompactado.`);
  }
  return zip;
}

async function rezip(src: JSZip, transform: (name: string, data: Uint8Array) => Uint8Array | Promise<Uint8Array>) {
  const out = new JSZip();
  for (const [name, f] of Object.entries(src.files)) {
    if (f.dir) continue;
    out.file(name, await transform(name, await f.async("uint8array")), { date: FIXED_DATE, createFolders: false });
  }
  return out.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Textos visíveis do projeto (nomes de atores, falas, variáveis, comentários) para procurar nomes. */
function sb3Strings(project: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(project);
  return out;
}

/** .sb3: zera `meta` (agente/navegador/usuário), apaga comentários e regrava o zip. */
export async function sanitizeSb3(bytes: Uint8Array) {
  const zip = await openZip(bytes, "projeto .sb3");
  const pj = zip.file("project.json");
  if (!pj) throw new FileError("Isto não parece um projeto do PictoBlox/Scratch (falta o project.json).");
  let project: { targets?: { comments?: unknown }[]; meta?: unknown; [k: string]: unknown };
  try {
    project = JSON.parse(await pj.async("string"));
  } catch {
    throw new FileError("O project.json do projeto está com defeito.");
  }
  if (!Array.isArray(project.targets)) throw new FileError("Isto não parece um projeto do PictoBlox/Scratch.");
  project.meta = { semver: "3.0.0", vm: "0.2.0", agent: "" };
  for (const t of project.targets) t.comments = {};
  const clean = await rezip(zip, (name, data) => (name === "project.json" ? enc.encode(JSON.stringify(project)) : data));
  return { bytes: clean, text: sb3Strings(project.targets).join("\n") };
}

/** PDF: apaga autor, criador, produtor, título, assunto, palavras-chave e o XMP. */
export async function sanitizePdf(bytes: Uint8Array) {
  if (dec.decode(bytes.slice(0, 5)) !== "%PDF-") throw new FileError("O arquivo não é um PDF válido.");
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch {
    throw new FileError("Não conseguimos abrir o PDF. Se ele tiver senha, tire a senha e envie de novo.");
  }
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);
  doc.catalog.delete(PDFName.of("Metadata"));
  return { bytes: await doc.save({ updateFieldAppearances: false }), text: "" };
}

/** .docx: zera docProps (autor, empresa, gerente), autores de comentários e revisões. */
export async function sanitizeDocx(bytes: Uint8Array) {
  const zip = await openZip(bytes, "documento .docx");
  if (!zip.file("word/document.xml")) throw new FileError("Isto não parece um documento do Word (.docx).");
  let text = "";
  const out = await rezip(zip, async (name, data) => {
    if (name === "docProps/core.xml") {
      return enc.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"></cp:coreProperties>',
      );
    }
    if (name === "docProps/app.xml") {
      return enc.encode(dec.decode(data).replace(/<(Company|Manager|HyperlinkBase)>[\s\S]*?<\/\1>/g, "<$1></$1>"));
    }
    if (name === "docProps/custom.xml") {
      return enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties"/>');
    }
    if (name.startsWith("word/") && name.endsWith(".xml")) {
      let xml = dec.decode(data)
        .replace(/\bw:author="[^"]*"/g, 'w:author="Equipe"')
        .replace(/\bw:initials="[^"]*"/g, 'w:initials="EQ"')
        .replace(/\bw15:userId="[^"]*"/g, 'w15:userId="Equipe"')
        .replace(/\bw15:providerId="[^"]*"/g, 'w15:providerId="None"');
      if (name === "word/people.xml") xml = xml.replace(/<w15:person [^>]*>[\s\S]*?<\/w15:person>/g, "");
      if (name === "word/document.xml") text = xml.replace(/<[^>]+>/g, " ");
      return enc.encode(xml);
    }
    return data;
  });
  return { bytes: out, text };
}

export function docExtOf(filename: string): "pdf" | "docx" | null {
  const m = filename.toLowerCase().match(/\.(pdf|docx)$/);
  return (m?.[1] as "pdf" | "docx") ?? null;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Procura nomes que identificam a origem (escola, cidade, alunos) nos textos da entrega. */
export function findIdentityLeaks(texts: string[], names: string[]) {
  const hay = norm(texts.join("\n"));
  return [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 4))].filter((n) => {
    const re = new RegExp(`(^|[^a-z0-9])${norm(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`);
    return re.test(hay);
  });
}
