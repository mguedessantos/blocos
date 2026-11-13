import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { ManualGuide } from "../../content/manual";
import { inlineParts, parseBlocks } from "./manual";

// Manual em PDF (A4 retrato): capa com a marca, sumário e capítulos com as capturas.

const W = 595.28, H = 841.89, M = 56, CW = W - 2 * M;
const INK = rgb(0.12, 0.11, 0.17), MUTED = rgb(0.4, 0.42, 0.5);

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
/** Fontes padrão usam WinAnsi: acentos ok; emoji e outros símbolos são removidos. */
const SYMBOLS: Record<string, string> = { "✓": "(ok)", "→": "->", "★": "estrela", "⚠": "(!)", "🎓": "(certificado)" };
const safe = (s: string) => s.normalize("NFC").replace(/✓|→|★|⚠|🎓/gu, (c) => SYMBOLS[c]).replace(/[^ -~ -ÿ–—‘’“”•…]/g, "").replace(/ {2,}/g, " ");

type Run = { text: string; bold: boolean };
type Word = Run & { sp: boolean };
type Opts = { brandName: string; primary: string; image: (id: string) => Promise<Uint8Array | null> };

export async function buildManualPdf(guide: ManualGuide, o: Opts) {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`${guide.title} - ${o.brandName}`));
  doc.setAuthor(safe(o.brandName));
  doc.setCreator(safe(o.brandName));
  doc.setProducer(safe(o.brandName));
  const [regular, bold] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold)]);
  const primary = hex(o.primary);

  // Capa
  const cover = doc.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: H - 260, width: W, height: 260, color: primary });
  cover.drawText(safe(o.brandName), { x: M, y: H - 120, size: 30, font: bold, color: rgb(1, 1, 1) });
  cover.drawText("Manual da plataforma", { x: M, y: H - 160, size: 16, font: regular, color: rgb(1, 1, 1) });
  cover.drawText(safe(guide.title), { x: M, y: H - 340, size: 28, font: bold, color: INK });
  let cy = H - 372;
  for (const line of wrap([{ text: safe(guide.intro), bold: false }], 14, regular, bold, CW)) {
    drawLine(cover, line, M, cy, 14, regular, bold, MUTED);
    cy -= 20;
  }

  // Sumário (preenchido com as páginas depois)
  const toc = doc.addPage([W, H]);
  const chapterPages: number[] = [];

  let page!: PDFPage;
  let y = 0;
  const newPage = () => { page = doc.addPage([W, H]); y = H - M; };
  const need = (h: number) => { if (y - h < M + 20) newPage(); };
  const para = async (runs: Run[], size = 11, indent = 0, color = INK, bullet?: string) => {
    const lines = wrap(runs, size, regular, bold, CW - indent);
    lines.forEach((line, i) => {
      need(size * 1.5);
      if (i === 0 && bullet) page.drawText(bullet, { x: M + indent - 14, y: y - size, size, font: bold, color: primary });
      drawLine(page, line, M + indent, y - size, size, regular, bold, color);
      y -= size * 1.5;
    });
    y -= 6;
  };
  const runs = (t: string): Run[] => inlineParts(safe(t));

  for (const [ci, ch] of guide.chapters.entries()) {
    newPage();
    chapterPages.push(doc.getPageCount());
    page.drawRectangle({ x: M, y: y - 4, width: 40, height: 4, color: primary });
    y -= 16;
    await para([{ text: safe(`${ci + 1}. ${ch.title}`), bold: true }], 20);
    for (const b of parseBlocks(ch.body)) {
      if (b.t === "h2" || b.t === "h3") { y -= 6; need(40); await para([{ text: safe(b.text), bold: true }], b.t === "h2" ? 14 : 12); }
      else if (b.t === "p") await para(runs(b.text));
      else if (b.t === "ul" || b.t === "ol") for (const [i, it] of b.items.entries()) await para(runs(it), 11, 16, INK, b.t === "ol" ? `${i + 1}.` : "•");
      else if (b.t === "callout") {
        const label = b.kind === "atencao" ? "Atenção: " : "Dica: ";
        const lines = wrap([{ text: label, bold: true }, ...runs(b.text)], 11, regular, bold, CW - 24);
        const h = lines.length * 16.5 + 16;
        need(h);
        page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: b.kind === "atencao" ? rgb(1, 0.93, 0.95) : rgb(0.9, 0.98, 0.95), borderColor: b.kind === "atencao" ? rgb(1, 0.36, 0.54) : rgb(0.17, 0.83, 0.62), borderWidth: 1.5 });
        lines.forEach((line, i) => drawLine(page, line, M + 12, y - 8 - 11 - i * 16.5, 11, regular, bold, INK));
        y -= h + 10;
      } else if (b.t === "img") {
        const bytes = await o.image(b.id);
        if (!bytes) continue;
        try {
          const img = await doc.embedPng(bytes);
          const s = Math.min(CW / img.width, 360 / img.height);
          const w = img.width * s, h = img.height * s;
          need(h + 26);
          page.drawImage(img, { x: M + (CW - w) / 2, y: y - h, width: w, height: h });
          page.drawRectangle({ x: M + (CW - w) / 2, y: y - h, width: w, height: h, borderColor: rgb(0.85, 0.85, 0.9), borderWidth: 1 });
          y -= h + 6;
          await para([{ text: safe(b.alt), bold: false }], 9, 0, MUTED);
        } catch { /* captura inválida: segue sem ela */ }
      }
    }
  }

  // Sumário
  let ty = H - M - 24;
  toc.drawText("Sumário", { x: M, y: ty, size: 22, font: bold, color: INK });
  ty -= 40;
  guide.chapters.forEach((ch, i) => {
    const t = safe(`${i + 1}. ${ch.title}`), n = String(chapterPages[i]);
    toc.drawText(t, { x: M, y: ty, size: 12, font: regular, color: INK });
    toc.drawText(n, { x: W - M - regular.widthOfTextAtSize(n, 12), y: ty, size: 12, font: bold, color: primary });
    ty -= 22;
  });

  // Rodapé com número de página (menos na capa)
  doc.getPages().forEach((p, i) => {
    if (i === 0) return;
    const t = safe(`${o.brandName} · ${guide.title} · ${i + 1}`);
    p.drawText(t, { x: W - M - regular.widthOfTextAtSize(t, 8), y: 28, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}

/** Quebra trechos (com negrito) em linhas que cabem na largura; `sp` = havia espaço antes da palavra. */
export function wrap(runs: Run[], size: number, regular: PDFFont, bold: PDFFont, max: number): Word[][] {
  const words: Word[] = [];
  let pendingSpace = false;
  for (const r of runs)
    for (const piece of r.text.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) { pendingSpace = true; continue; }
      words.push({ text: piece, bold: r.bold, sp: pendingSpace && words.length > 0 });
      pendingSpace = false;
    }
  const lines: Word[][] = [];
  let cur: Word[] = [], width = 0;
  const space = regular.widthOfTextAtSize(" ", size);
  for (const w of words) {
    const ww = (w.bold ? bold : regular).widthOfTextAtSize(w.text, size);
    if (cur.length && w.sp && width + space + ww > max) { lines.push(cur); cur = []; width = 0; }
    width += (cur.length && w.sp ? space : 0) + ww;
    cur.push(w);
  }
  if (cur.length) lines.push(cur);
  return lines;
}

function drawLine(page: PDFPage, line: Word[], x: number, y: number, size: number, regular: PDFFont, bold: PDFFont, color = INK) {
  line.forEach((w, i) => {
    const f = w.bold ? bold : regular;
    if (i > 0 && w.sp) x += regular.widthOfTextAtSize(" ", size);
    page.drawText(w.text, { x, y, size, font: f, color });
    x += f.widthOfTextAtSize(w.text, size);
  });
}
