import { existsSync, readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { GUIDES } from "../../content/manual";
import { guidesFor, imagesOf, parseBlocks } from "@/lib/manual";
import { buildManualPdf } from "@/lib/manual-pdf";

describe("manual", () => {
  it("todo guia tem capítulos com título, slug único e conteúdo", () => {
    for (const g of GUIDES) {
      expect(g.chapters.length).toBeGreaterThan(0);
      expect(new Set(g.chapters.map((c) => c.slug)).size).toBe(g.chapters.length);
      for (const c of g.chapters) {
        expect(c.title).toBeTruthy();
        expect(parseBlocks(c.body).length).toBeGreaterThan(0);
      }
    }
  });

  it("separa parágrafo e lista no mesmo bloco", () => {
    expect(parseBlocks("Você vê:\n- A\n- B").map((b) => b.t)).toEqual(["p", "ul"]);
    expect(parseBlocks("1. um\n2. dois")).toEqual([{ t: "ol", items: ["um", "dois"] }]);
  });

  it("toda captura citada existe em public/manual", () => {
    for (const g of GUIDES) for (const img of imagesOf(g)) expect(existsSync(`public/manual/${img.id}.png`), img.id).toBe(true);
  });

  it("não menciona robótica nem inteligência artificial e não usa travessão", () => {
    const text = GUIDES.flatMap((g) => g.chapters.map((c) => `${c.title}\n${c.body}`)).join("\n").toLowerCase();
    for (const word of ["inteligência artificial", "aprendizado de máquina", "robótica", "—"]) expect(text).not.toContain(word);
  });

  it("cada papel vê os guias certos; aluno não vê nenhum", () => {
    expect(guidesFor("TEACHER").map((g) => g.slug)).toEqual(["professor"]);
    expect(guidesFor("ORG_ADMIN").map((g) => g.slug)).toEqual(["coordenacao", "professor"]);
    expect(guidesFor("JUDGE").map((g) => g.slug)).toEqual(["jurado"]);
    expect(guidesFor("SUPER_ADMIN")).toHaveLength(3);
    expect(guidesFor("STUDENT")).toEqual([]);
  });

  it("gera o PDF com capa, sumário e um capítulo por página, com acentos", async () => {
    const guide = GUIDES.find((g) => g.slug === "jurado")!;
    const bytes = await buildManualPdf(guide, {
      brandName: "Escola Ação",
      primary: "#6d28d9",
      image: async (id) => (existsSync(`public/manual/${id}.png`) ? new Uint8Array(readFileSync(`public/manual/${id}.png`)) : null),
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Guia do(a) jurado(a) - Escola Ação");
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2 + guide.chapters.length);
  });
});
