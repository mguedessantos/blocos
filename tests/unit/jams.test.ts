import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { FileError, findIdentityLeaks, sanitizeDocx, sanitizePdf, sanitizeSb3 } from "@/lib/jam-files";
import { jamOpenTo, jamPhase, newAnonCode, parseYouTube, rankEntries, slugifyJam, validateJamDates } from "@/lib/jams";
import { projectJson } from "./sb3-builder";

const d = (s: string) => new Date(s);
const jam = { published: true, startsAt: d("2026-12-01T12:00:00Z"), endsAt: d("2026-12-15T12:00:00Z"), judgingEndsAt: d("2026-12-22T12:00:00Z") };

describe("fase da jam pelo relógio do servidor", () => {
  it("segue as datas", () => {
    expect(jamPhase({ ...jam, published: false }, d("2026-12-05T00:00:00Z"))).toBe("RASCUNHO");
    expect(jamPhase(jam, d("2026-11-30T00:00:00Z"))).toBe("EM_BREVE");
    expect(jamPhase(jam, d("2026-12-01T12:00:00Z"))).toBe("EM_ANDAMENTO");
    expect(jamPhase(jam, d("2026-12-15T11:59:59Z"))).toBe("EM_ANDAMENTO");
    expect(jamPhase(jam, d("2026-12-15T12:00:00Z"))).toBe("JULGAMENTO");
    expect(jamPhase(jam, d("2026-12-22T12:00:00Z"))).toBe("ENCERRADA");
  });
  it("valida a ordem das datas", () => {
    expect(validateJamDates(jam.startsAt, jam.endsAt, jam.judgingEndsAt)).toBeNull();
    expect(validateJamDates(jam.endsAt, jam.startsAt, jam.judgingEndsAt)).toMatch(/depois do início/);
    expect(validateJamDates(jam.startsAt, jam.endsAt, jam.endsAt)).toMatch(/julgamento/);
    expect(validateJamDates(new Date("x"), jam.endsAt, jam.judgingEndsAt)).toMatch(/datas/);
  });
});

describe("quem participa", () => {
  const sp = { id: "o1", state: "SP", city: "São Paulo" };
  const base = { states: [], cities: [], orgIds: [] };
  it("por alcance", () => {
    expect(jamOpenTo({ ...base, scope: "PLATAFORMA" }, sp)).toBe(true);
    expect(jamOpenTo({ ...base, scope: "PLATAFORMA" }, null)).toBe(false);
    expect(jamOpenTo({ ...base, scope: "ESTADOS", states: ["SP"] }, sp)).toBe(true);
    expect(jamOpenTo({ ...base, scope: "ESTADOS", states: ["RJ"] }, sp)).toBe(false);
    expect(jamOpenTo({ ...base, scope: "CIDADES", cities: ["sao paulo"] }, sp)).toBe(true);
    expect(jamOpenTo({ ...base, scope: "ESCOLAS", orgIds: ["o2"] }, sp)).toBe(false);
  });
});

describe("link do YouTube", () => {
  it("aceita formatos do YouTube", () => {
    for (const u of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ]) expect(parseYouTube(u)).toBe("dQw4w9WgXcQ");
  });
  it("recusa outros sites e ids inválidos", () => {
    for (const u of ["https://vimeo.com/123", "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtu.be/curto", "nada"]) {
      expect(parseYouTube(u)).toBeNull();
    }
  });
});

describe("códigos e slugs", () => {
  it("código anônimo tem 4 caracteres sem ambíguos e não repete", () => {
    const taken = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const c = newAnonCode(taken);
      expect(c).toMatch(/^[2-9A-HJKMNP-Z]{4}$/);
      expect(taken.has(c)).toBe(false);
      taken.add(c);
    }
  });
  it("slug", () => expect(slugifyJam("Jam de Férias: Ação!")).toBe("jam-de-ferias-acao"));
});

describe("ranking", () => {
  const criteria = [{ id: "a", weight: 2, maxScore: 10 }, { id: "b", weight: 1, maxScore: 5 }];
  it("média ponderada por jurado, depois média entre jurados; empates dividem a posição", () => {
    const scores = [
      { entryId: "e1", criterionId: "a", judgeId: "j1", value: 10 }, { entryId: "e1", criterionId: "b", judgeId: "j1", value: 5 }, // 100
      { entryId: "e1", criterionId: "a", judgeId: "j2", value: 5 }, { entryId: "e1", criterionId: "b", judgeId: "j2", value: 5 }, // 66,7
      { entryId: "e2", criterionId: "a", judgeId: "j1", value: 10 }, { entryId: "e2", criterionId: "b", judgeId: "j1", value: 0 }, // 66,7
      { entryId: "e3", criterionId: "a", judgeId: "j1", value: 10 }, { entryId: "e3", criterionId: "b", judgeId: "j1", value: 0 }, // 66,7
    ];
    const r = rankEntries(["e1", "e2", "e3", "e4"], criteria, scores);
    expect(r[0]).toMatchObject({ entryId: "e1", score: 83.3, place: 1, judges: 2 });
    expect(r.slice(1, 3).map((x) => x.place)).toEqual([2, 2]);
    expect(r[3]).toMatchObject({ entryId: "e4", score: null, place: null });
  });
});

// ───────────── Arquivos ─────────────

async function sb3With(meta: object, comment = "feito pela Escola Aurora") {
  const pj = projectJson({ sprites: [{ name: "Herói" }] }) as unknown as { meta: object; targets: { comments: object }[] };
  pj.meta = meta;
  pj.targets[1].comments = { c1: { text: comment } };
  const zip = new JSZip();
  zip.file("project.json", JSON.stringify(pj), { date: new Date("2026-05-05") });
  return zip.generateAsync({ type: "uint8array" });
}

describe("limpeza do .sb3", () => {
  it("zera meta, apaga comentários e devolve textos do projeto", async () => {
    const raw = await sb3With({ semver: "3.0.0", agent: "Mozilla (Colégio Aurora PC-12)", user: "prof.paulo" });
    const { bytes, text } = await sanitizeSb3(raw);
    const zip = await JSZip.loadAsync(bytes);
    const pj = JSON.parse(await zip.file("project.json")!.async("string"));
    expect(pj.meta.agent).toBe("");
    expect(pj.meta.user).toBeUndefined();
    expect(JSON.stringify(pj)).not.toContain("Aurora");
    expect(zip.file("project.json")!.date.getUTCFullYear()).toBe(2000);
    expect(text).toContain("Herói");
  });
  it("recusa o que não é projeto", async () => {
    const zip = new JSZip();
    zip.file("x.txt", "oi");
    await expect(sanitizeSb3(await zip.generateAsync({ type: "uint8array" }))).rejects.toBeInstanceOf(FileError);
    await expect(sanitizeSb3(new TextEncoder().encode("não é zip"))).rejects.toBeInstanceOf(FileError);
  });
});

describe("limpeza do PDF", () => {
  it("apaga autor, criador, produtor e título", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.setAuthor("Ana da Escola Aurora");
    doc.setCreator("Word - Colégio Aurora");
    doc.setTitle("Documentação - Colégio Aurora");
    const { bytes } = await sanitizePdf(await doc.save());
    const again = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(again.getAuthor() ?? "").toBe("");
    expect(again.getCreator() ?? "").toBe("");
    expect(again.getTitle() ?? "").toBe("");
    expect(new TextDecoder("latin1").decode(bytes)).not.toContain("Aurora");
  });
  it("recusa o que não é PDF", async () => {
    await expect(sanitizePdf(new TextEncoder().encode("oi"))).rejects.toBeInstanceOf(FileError);
  });
});

describe("limpeza do .docx", () => {
  it("zera docProps e autores de comentários/revisões", async () => {
    const zip = new JSZip();
    zip.file("docProps/core.xml", "<cp:coreProperties><dc:creator>Paulo Professor</dc:creator><cp:lastModifiedBy>Ana</cp:lastModifiedBy></cp:coreProperties>");
    zip.file("docProps/app.xml", "<Properties><Company>Colégio Aurora</Company><Pages>2</Pages></Properties>");
    zip.file("word/document.xml", '<w:document><w:body><w:p><w:ins w:author="Paulo Professor"><w:r><w:t>Etapa 1: o herói pula</w:t></w:r></w:ins></w:p></w:body></w:document>');
    zip.file("word/comments.xml", '<w:comments><w:comment w:author="Ana Souza" w:initials="AS"/></w:comments>');
    const { bytes, text } = await sanitizeDocx(await zip.generateAsync({ type: "uint8array" }));
    const out = await JSZip.loadAsync(bytes);
    const all = (await Promise.all(Object.values(out.files).map((f) => f.async("string")))).join("\n");
    expect(all).not.toMatch(/Paulo|Ana Souza|Aurora/);
    expect(all).toContain("<Pages>2</Pages>");
    expect(text).toContain("o herói pula");
  });
});

describe("nomes que revelam a origem", () => {
  it("acha escola/cidade/aluno sem acento e sem pegar pedaços de palavras", () => {
    const leaks = findIdentityLeaks(["Jogo feito no colegio aurora, em Campinas!", "Personagem: Bruno"], ["Colégio Aurora", "Campinas", "Bruno", "Ana", "Clara"]);
    expect(leaks).toEqual(["Colégio Aurora", "Campinas", "Bruno"]);
    expect(findIdentityLeaks(["Brunoso e Clarabóia"], ["Bruno", "Clara"])).toEqual([]);
  });
});
