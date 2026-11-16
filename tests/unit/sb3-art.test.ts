import JSZip from "jszip";
import { afterEach, expect, it, vi } from "vitest";
import ALIASES from "@/lib/sb3/asset-aliases.json";
import ASSETS from "@/lib/sb3/assets.json";
import { refreshArt } from "@/lib/sb3/pack";

afterEach(() => vi.unstubAllGlobals());

it("projeto salvo com o desenho antigo abre com o desenho atual e o mesmo código", async () => {
  const [old, cur] = Object.entries(ALIASES as Record<string, string>).find(([, n]) => n === ASSETS.characters.bloquinho[0].md5ext)!;
  const zip = new JSZip();
  const blocks = { a: { opcode: "event_whenflagclicked", next: null, parent: null, inputs: {}, fields: {}, topLevel: true } };
  zip.file("project.json", JSON.stringify({ targets: [{ isStage: false, name: "Bloquinho", blocks, costumes: [{ name: "parado", md5ext: old, assetId: old.split(".")[0] }] }] }));
  zip.file(old, "antigo");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("novo")));

  const out = await JSZip.loadAsync(await refreshArt(await zip.generateAsync({ type: "arraybuffer" })));
  const json = JSON.parse(await out.file("project.json")!.async("string"));
  expect(json.targets[0].costumes[0]).toMatchObject({ md5ext: cur, assetId: cur.split(".")[0] });
  expect(json.targets[0].blocks).toEqual(blocks);
  expect(await out.file(cur)!.async("string")).toBe("novo");
});

it("fantasia desenhada pelo aluno nunca é trocada, mesmo com nome de personagem", async () => {
  const zip = new JSZip();
  zip.file("project.json", JSON.stringify({ targets: [{ isStage: false, name: "Moeda", blocks: {}, costumes: [
    { name: "frente", md5ext: "11111111111111111111111111111111.png", assetId: "11111111111111111111111111111111" },
  ] }] }));
  vi.stubGlobal("fetch", vi.fn(async () => new Response("novo")));
  const out = await JSZip.loadAsync(await refreshArt(await zip.generateAsync({ type: "arraybuffer" })));
  const [frente] = JSON.parse(await out.file("project.json")!.async("string")).targets[0].costumes;
  expect(frente.md5ext).toBe("11111111111111111111111111111111.png");
});
