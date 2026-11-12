import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { brandAssetUrl, checkBrandImage, sniffImage } from "@/lib/brand-assets";
import { buildCertificate } from "@/lib/certificate";
import { checkCustomHostname } from "@/lib/domain-rules";
import { renderEmail } from "@/lib/email-template";

const PNG_1x1 = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));

describe("imagens de marca", () => {
  it("reconhece PNG e JPG pelos bytes, recusa SVG e outros", () => {
    expect(sniffImage(PNG_1x1)).toBe("png");
    expect(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("jpg");
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(checkBrandImage(new Uint8Array(2 * 1024 * 1024))).toEqual({ error: "A imagem pode ter no máximo 1 MB." });
    expect(checkBrandImage(new Uint8Array())).toHaveProperty("error");
  });
  it("URL pública relativa", () => {
    expect(brandAssetUrl("marca/123e4567-e89b-12d3-a456-426614174000")).toBe("/marca/arquivo/123e4567-e89b-12d3-a456-426614174000");
  });
});

describe("domínio próprio", () => {
  const root = "seusite.com.br";
  it("normaliza e aceita domínios válidos", () => {
    expect(checkCustomHostname(" https://Codigo.EscolaABC.com.br/ ", root)).toEqual({ hostname: "codigo.escolaabc.com.br" });
    expect(checkCustomHostname("escolaabc.com.br", root)).toEqual({ hostname: "escolaabc.com.br" });
  });
  it("recusa inválidos e domínios da própria plataforma", () => {
    expect(checkCustomHostname("", root)).toHaveProperty("error");
    expect(checkCustomHostname("sem-ponto", root)).toHaveProperty("error");
    expect(checkCustomHostname("tem espaço.com", root)).toHaveProperty("error");
    expect(checkCustomHostname("seusite.com.br", root)).toHaveProperty("error");
    expect(checkCustomHostname("outra.seusite.com.br", root)).toHaveProperty("error");
  });
});

describe("email com a marca", () => {
  const brand = { name: "Aurora <Code>", primary: "#0f766e", primaryText: "#ffffff", logoUrl: null, senderName: "Aurora", replyTo: null, showPlatform: false };
  it("usa a cor da escola, escapa HTML e gera texto puro", () => {
    const m = renderEmail(brand, { subject: "Oi", heading: "Olá <b>!", paragraphs: ["Linha & mais"], button: { label: "Entrar", url: "https://x.test/a?b=1&c=2" } });
    expect(m.html).toContain("#0f766e");
    expect(m.html).toContain("Aurora &lt;Code&gt;");
    expect(m.html).toContain("Olá &lt;b&gt;!");
    expect(m.html).not.toContain("com tecnologia");
    expect(m.html).toContain("https://x.test/a?b=1&amp;c=2");
    expect(m.text).toContain("Entrar: https://x.test/a?b=1&c=2");
  });
  it("mostra a plataforma quando a escola não escondeu", () => {
    expect(renderEmail({ ...brand, showPlatform: true }, { subject: "s", heading: "h", paragraphs: [] }).html).toContain("com tecnologia");
  });
});

describe("certificado", () => {
  it("gera PDF com logo, acentos e metadados da escola", async () => {
    const bytes = await buildCertificate({
      studentName: "Ana Conceição", trackTitle: "Mundo 1 · Vila do Palco", courseTitle: "PictoBlox e Introdução à Programação de Blocos",
      lessons: 8, schoolName: "Colégio Aurora", brandName: "Aurora Code", primary: "#0f766e", secondary: "#facc15",
      completedAt: new Date("2026-11-12T15:00:00Z"), code: "ABC123DEF0", logo: { bytes: PNG_1x1, kind: "png" },
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getAuthor()).toBe("Aurora Code");
    expect(doc.getTitle()).toContain("Vila do Palco");
    const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
    expect(w).toBeGreaterThan(h); // paisagem
  });
  it("funciona sem logo e com caracteres fora do WinAnsi", async () => {
    const bytes = await buildCertificate({
      studentName: "Zoë 🚀", trackTitle: "T", courseTitle: "C", lessons: 1, schoolName: "E", brandName: "B",
      primary: "#6d28d9", secondary: "#f59e0b", completedAt: new Date(), code: "X", logo: null,
    });
    expect(bytes.length).toBeGreaterThan(500);
  });
});

describe("cor principal sobre fundo branco", () => {
  it("recusa tons claros demais para links/botões e aceita os escuros", async () => {
    const { isAcceptablePrimaryColor, isAcceptableBrandColor } = await import("@/lib/color");
    expect(isAcceptableBrandColor("#fefefe")).toBe(true); // texto escuro sobre ela é legível…
    expect(isAcceptablePrimaryColor("#fefefe")).toBe(false); // …mas some no fundo branco
    expect(isAcceptablePrimaryColor("#facc15")).toBe(false);
    for (const c of ["#6d28d9", "#0f766e", "#b91c1c", "#1d4ed8", "#dc2626"]) expect(isAcceptablePrimaryColor(c)).toBe(true);
  });
});
