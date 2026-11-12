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
  for (const raw of source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)) {
    const lines = raw.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    if (lines.length === 0) continue;
    const img = /^!\[([^\]]*)\]\(([a-z0-9-]+)\)$/.exec(lines[0]);
    if (img && lines.length === 1) {
      out.push({ t: "img", alt: img[1], id: img[2] });
      continue;
    }
    const h = /^(#{2,3})\s+(.*)$/.exec(lines[0]);
    if (h && lines.length === 1) {
      out.push({ t: h[1].length === 2 ? "h2" : "h3", text: h[2], id: slug(h[2]) });
      continue;
    }
    if (lines.every((l) => l.startsWith(">"))) {
      const text = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
      const m = /^(Dica|Atenção):\s*(.*)$/.exec(text);
      out.push({ t: "callout", kind: m?.[1] === "Atenção" ? "atencao" : "dica", text: m ? m[2] : text });
      continue;
    }
    if (lines.every((l) => /^(\d+\.|-)\s+/.test(l))) {
      out.push({ t: /^\d+\./.test(lines[0]) ? "ol" : "ul", items: lines.map((l) => l.replace(/^(\d+\.|-)\s+/, "")) });
      continue;
    }
    out.push({ t: "p", text: lines.join(" ") });
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
