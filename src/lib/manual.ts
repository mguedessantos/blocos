import { GUIDES, type ManualGuide } from "../../content/manual";
import type { Role } from "@/generated/prisma/enums";

// Manual da plataforma: um pequeno markdown → blocos, usado pela página (/manual) e pelo PDF.

export type Block =
  | { t: "h2" | "h3"; text: string; id: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "img"; id: string; alt: string }
  | { t: "callout"; kind: "dica" | "atencao"; text: string };

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function parseBlocks(source: string): Block[] {
  const out: Block[] = [];
  const kind = (l: string) =>
    /^#{2,3}\s/.test(l) ? "h" : /^!\[[^\]]*\]\([a-z0-9-]+\)$/.test(l) ? "img" : l.startsWith(">") ? "quote" : /^(\d+\.|-)\s+/.test(l) ? "item" : "text";
  for (const raw of source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)) {
    const lines = raw.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    // linhas seguidas do mesmo tipo formam um bloco (ex.: "Você vê:\n- A\n- B" = parágrafo + lista)
    for (let i = 0; i < lines.length; ) {
      const k = kind(lines[i]);
      let j = i + 1;
      if (k !== "h" && k !== "img") while (j < lines.length && kind(lines[j]) === k) j++;
      const group = lines.slice(i, j);
      i = j;
      if (k === "h") {
        const [, hashes, text] = /^(#{2,3})\s+(.*)$/.exec(group[0])!;
        out.push({ t: hashes.length === 2 ? "h2" : "h3", text, id: slug(text) });
      } else if (k === "img") {
        const [, alt, id] = /^!\[([^\]]*)\]\(([a-z0-9-]+)\)$/.exec(group[0])!;
        out.push({ t: "img", alt, id });
      } else if (k === "quote") {
        const text = group.map((l) => l.replace(/^>\s?/, "")).join(" ");
        const m = /^(Dica|Atenção):\s*(.*)$/.exec(text);
        out.push({ t: "callout", kind: m?.[1] === "Atenção" ? "atencao" : "dica", text: m ? m[2] : text });
      } else if (k === "item") {
        out.push({ t: /^\d+\./.test(group[0]) ? "ol" : "ul", items: group.map((l) => l.replace(/^(\d+\.|-)\s+/, "")) });
      } else out.push({ t: "p", text: group.join(" ") });
    }
  }
  return out;
}

/** Trechos de texto com **negrito** marcado (para o site e o PDF). */
export function inlineParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) => (p.startsWith("**") ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }));
}

export const plain = (text: string) => text.replace(/\*\*/g, "");

export function getGuide(slugName: string): ManualGuide | undefined {
  return GUIDES.find((g) => g.slug === slugName);
}

/** Guias que cada papel vê (o primeiro é o padrão). */
export function guidesFor(role: Role): ManualGuide[] {
  const by = (s: string[]) => s.map((x) => getGuide(x)!).filter(Boolean);
  switch (role) {
    case "TEACHER":
      return by(["professor"]);
    case "ORG_ADMIN":
      return by(["coordenacao", "professor"]);
    case "JUDGE":
      return by(["jurado"]);
    case "SUPER_ADMIN":
      return GUIDES;
    default:
      return [];
  }
}

/** Todas as imagens citadas (para conferir que existem e para o script de capturas). */
export function imagesOf(guide: ManualGuide) {
  return guide.chapters.flatMap((c) => parseBlocks(c.body).filter((b): b is Extract<Block, { t: "img" }> => b.t === "img"));
}

export const MANUAL_IMAGE_DIR = "manual"; // public/manual/<id>.png
