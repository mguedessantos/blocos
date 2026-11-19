import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";

// Certificado (A4 paisagem) com a marca da escola: conclusão de nível do curso ou participação em Game Jam.

export type CertificateData = {
  studentName: string;
  kind: "conclusão" | "participação";
  title: string; // nome curto (título do PDF e do arquivo)
  achievement: string; // linha em destaque, ex.: concluiu o nível “Básico”
  detail: string;
  skills: string[]; // habilidades desenvolvidas (até 4, em duas linhas)
  platformName: string; // referência à plataforma, mesmo com a marca da escola
  schoolName: string;
  brandName: string;
  primary: string; // #rrggbb
  secondary: string;
  completedAt: Date;
  code: string; // para conferência
  logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
};

// shortcut: domínio fixo da plataforma; trocar por variável se houver outro domínio principal.
const PLATFORM_SITE = "blokinlab.com.br";

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** As fontes padrão do PDF usam WinAnsi: acentos do português funcionam; o resto é trocado. */
const safe = (s: string) => s.normalize("NFC").replace(/[^ -~ -ÿ–—‘’“”•…]/g, "?");

function centered(page: ReturnType<PDFDocument["addPage"]>, text: string, y: number, font: PDFFont, size: number, color = rgb(0.12, 0.11, 0.17), maxWidth = 700) {
  let s = size;
  while (font.widthOfTextAtSize(text, s) > maxWidth && s > 10) s -= 1;
  const w = font.widthOfTextAtSize(text, s);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size: s, font, color });
}

export async function buildCertificate(d: CertificateData) {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`Certificado - ${d.title}`));
  doc.setAuthor(safe(d.brandName));
  doc.setCreator(safe(d.brandName));
  doc.setProducer(safe(d.platformName));
  const page = doc.addPage([841.89, 595.28]); // A4 paisagem
  const { width, height } = page.getSize();
  const [bold, regular] = await Promise.all([doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.Helvetica)]);
  const primary = hex(d.primary);
  const secondary = hex(d.secondary);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: primary, borderWidth: 6 });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: secondary, borderWidth: 2 });
  for (const [x, y] of [[44, height - 64], [width - 64, height - 64], [44, 44], [width - 64, 44]]) {
    page.drawRectangle({ x, y, width: 9, height: 9, color: primary });
    page.drawRectangle({ x: x + 11, y, width: 9, height: 9, color: secondary });
    page.drawRectangle({ x, y: y + 11, width: 9, height: 9, color: secondary });
    page.drawRectangle({ x: x + 11, y: y + 11, width: 9, height: 9, color: primary });
  }

  let top = height - 70;
  if (d.logo) {
    try {
      const img = d.logo.kind === "png" ? await doc.embedPng(d.logo.bytes) : await doc.embedJpg(d.logo.bytes);
      const scale = Math.min(200 / img.width, 70 / img.height, 1);
      const w = img.width * scale, h = img.height * scale;
      page.drawImage(img, { x: (width - w) / 2, y: top - h, width: w, height: h });
      top -= h + 18;
    } catch {
      centered(page, safe(d.brandName), top - 24, bold, 22, primary);
      top -= 44;
    }
  } else {
    centered(page, safe(d.brandName), top - 24, bold, 22, primary);
    top -= 44;
  }

  centered(page, "CERTIFICADO", top - 40, bold, 44, primary);
  centered(page, `de ${d.kind}`, top - 68, regular, 18, rgb(0.39, 0.45, 0.55));
  centered(page, "Certificamos que", top - 118, regular, 16);
  centered(page, safe(d.studentName), top - 160, bold, 34);
  page.drawLine({ start: { x: width / 2 - 200, y: top - 172 }, end: { x: width / 2 + 200, y: top - 172 }, thickness: 1.5, color: secondary });
  centered(page, safe(d.achievement), top - 206, bold, 20);
  centered(page, safe(d.detail), top - 232, regular, 15);

  if (d.skills.length) {
    const muted = rgb(0.39, 0.45, 0.55);
    centered(page, "HABILIDADES DESENVOLVIDAS", top - 266, bold, 10, primary);
    const half = Math.ceil(d.skills.length / 2);
    centered(page, safe(d.skills.slice(0, half).join("  •  ")), top - 284, regular, 12, muted);
    if (d.skills.length > half) centered(page, safe(d.skills.slice(half).join("  •  ")), top - 300, regular, 12, muted);
  }

  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(d.completedAt);
  centered(page, safe(`${d.schoolName} · ${date}`), 92, regular, 14);
  centered(page, safe(`Emitido pela plataforma ${d.platformName} · ${PLATFORM_SITE}`), 68, bold, 10, rgb(0.39, 0.45, 0.55));
  centered(page, `Código de conferência: ${d.code}`, 54, regular, 9, rgb(0.5, 0.55, 0.62));

  return doc.save();
}
