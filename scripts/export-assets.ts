// Exporta a arte e os sons da biblioteca (desenhados em código em components/editor/art.ts) como
// arquivos PNG e WAV, para o editor de blocos (que trabalha com fantasias e sons de verdade).
// Saída: public/editor-assets/<md5>.<ext> + src/lib/sb3/assets.json (índice usado pelos conversores).
// Uso: npm run editor:assets
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { build } from "esbuild";

const OUT = "public/editor-assets";

// Código que roda no navegador: desenha cada fantasia/cenário e sintetiza cada som.
const ENTRY = `
import { drawBackdrop, drawCharacter, playSound } from "./src/components/editor/art";
import { BACKDROPS, CHARACTERS, SOUNDS } from "./src/lib/blocks/library";

const RES = 2; // bitmapResolution: o dobro de pixels, para ficar nítido
function png(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w * RES; c.height = h * RES;
  const ctx = c.getContext("2d");
  ctx.scale(RES, RES);
  draw(ctx);
  return c.toDataURL("image/png").split(",")[1];
}
function wav(buffer) {
  const data = buffer.getChannelData(0), rate = buffer.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + data.length * 2));
  const str = (o, s) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); out.setUint32(4, 36 + data.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  str(36, "data"); out.setUint32(40, data.length * 2, true);
  data.forEach((v, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  let bin = ""; new Uint8Array(out.buffer).forEach((b) => (bin += String.fromCharCode(b)));
  return { b64: btoa(bin), rate, sampleCount: data.length };
}
// Imagem de scripts/arte: fundo branco (ligado à borda) vira transparente, recorta e cabe no tamanho do ator.
async function fromImage(url, box) {
  const img = new Image(); img.src = url; await img.decode();
  const src = document.createElement("canvas"); src.width = img.width; src.height = img.height;
  const sx = src.getContext("2d"); sx.drawImage(img, 0, 0);
  const d = sx.getImageData(0, 0, src.width, src.height), W = src.width, H = src.height, px = d.data;
  const white = (i) => px[i + 3] < 20 || (px[i] > 215 && px[i + 1] > 215 && px[i + 2] > 215);
  const seen = new Uint8Array(W * H), stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue; seen[p] = 1;
    if (!white(p * 4)) continue;
    px[p * 4 + 3] = 0;
    const x = p % W;
    if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
    if (p >= W) stack.push(p - W); if (p < W * (H - 1)) stack.push(p + W);
  }
  sx.putImageData(d, 0, 0);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, s = box / Math.max(cw, ch);
  const out = document.createElement("canvas"); out.width = out.height = 100 * RES;
  const ox = out.getContext("2d");
  ox.imageSmoothingEnabled = s > 0.5; // arte em pixel reduzida muito: sem borrar
  ox.drawImage(src, x0, y0, cw, ch, (out.width - cw * s) / 2, (out.height - ch * s) / 2, cw * s, ch * s);
  return out.toDataURL("image/png").split(",")[1];
}
window.exportAll = async (arte) => {
  const S = 100; // cada personagem cabe num quadrado de 100x100 centrado
  const characters = await Promise.all(Object.values(CHARACTERS).map(async (ch) => ({
    id: ch.id,
    name: ch.name,
    costumes: await Promise.all(ch.costumes.map(async (name, i) => ({ name, b64: arte[ch.id] ? await fromImage(arte[ch.id][i] ?? arte[ch.id][0], ch.radius * 2 * 1.2 * RES) : png(S, S, (ctx) => { ctx.translate(S / 2, S / 2); drawCharacter(ctx, ch.id, i); }) }))),
  })));
  const backdrops = Object.entries(BACKDROPS).map(([id, name]) => ({ id, name, b64: png(480, 360, (ctx) => drawBackdrop(ctx, id, 480, 360)) }));
  const sounds = [];
  for (const [id, name] of Object.entries(SOUNDS)) {
    const ctx = new OfflineAudioContext(1, 22050, 22050); // 1 s, mono
    playSound(id, ctx);
    sounds.push({ id, name, ...wav(await ctx.startRendering()) });
  }
  return { characters, backdrops, sounds, size: S, res: RES };
};
`;

// Cenário "Xy-grid" da biblioteca original (já espelhado em public/editor-assets).
const XY_GRID = "9838d02002d05f88dc54d96494fbc202.png";
// Arte trocável: scripts/arte/<ator>.png|jpg substitui o desenho em código (1ª fantasia);
// <ator>-2.png|jpg é a 2ª fantasia (sem ela, repete a 1ª).
const ARTE = "scripts/arte";
function arteFiles() {
  const out: Record<string, string[]> = {};
  for (const f of readdirSync(ARTE).sort()) {
    const m = /^([a-z]+)(-2)?\.(png|jpe?g)$/.exec(f);
    if (!m) continue;
    const url = `data:image/${m[3] === "png" ? "png" : "jpeg"};base64,${readFileSync(`${ARTE}/${f}`).toString("base64")}`;
    (out[m[1]] ??= [])[m[2] ? 1 : 0] = url;
  }
  return out;
}
const md5 = (buf: Buffer) => createHash("md5").update(buf).digest("hex");

async function main() {
  const bundle = await build({ stdin: { contents: ENTRY, resolveDir: process.cwd(), loader: "ts" }, bundle: true, write: false, format: "iife", alias: { "@": "./src" } });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body></body>");
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const raw = await page.evaluate((a) => (window as unknown as { exportAll: (a: unknown) => Promise<Exported> }).exportAll(a), arteFiles());
  await browser.close();

  mkdirSync(OUT, { recursive: true });
  const save = (b64: string, ext: string) => {
    const buf = Buffer.from(b64, "base64");
    const md5ext = `${md5(buf)}.${ext}`;
    writeFileSync(`${OUT}/${md5ext}`, buf);
    return md5ext;
  };
  const half = (raw.size * raw.res) / 2;
  const index = {
    bitmapResolution: raw.res,
    characters: Object.fromEntries(raw.characters.map((c) => [c.id, c.costumes.map((k) => ({ name: k.name, md5ext: save(k.b64, "png"), rotationCenterX: half, rotationCenterY: half }))])),
    backdrops: Object.fromEntries(raw.backdrops.map((b) => [b.id, { name: b.name, md5ext: b.id === "grade" ? XY_GRID : save(b.b64, "png"), rotationCenterX: 480, rotationCenterY: 360 }])),
    sounds: Object.fromEntries(raw.sounds.map((s) => [s.id, { name: s.name, md5ext: save(s.b64, "wav"), rate: s.rate, sampleCount: s.sampleCount }])),
  };
  writeFileSync("src/lib/sb3/assets.json", JSON.stringify(index, null, 2) + "\n");

  // Bibliotecas do editor ("Escolher um ator/cenário/som/fantasia"), no formato do scratch-gui.
  const costume = (c: { name: string; md5ext: string; rotationCenterX: number; rotationCenterY: number }, name = c.name) => ({
    name, tags: [], assetId: c.md5ext.split(".")[0], md5ext: c.md5ext, dataFormat: "png", bitmapResolution: index.bitmapResolution,
    rotationCenterX: c.rotationCenterX, rotationCenterY: c.rotationCenterY,
  });
  const sound = (s: { name: string; md5ext: string; rate: number; sampleCount: number }) => ({
    name: s.name, tags: [], assetId: s.md5ext.split(".")[0], md5ext: s.md5ext, dataFormat: "wav", rate: s.rate, sampleCount: s.sampleCount,
  });
  const names = Object.fromEntries(raw.characters.map((c) => [c.id, c.name]));
  const library = {
    sprites: Object.entries(index.characters).map(([id, costumes]) => ({
      name: names[id], tags: [], isStage: false, variables: {}, blocks: {},
      costumes: costumes.map((c) => costume(c)), sounds: Object.values(index.sounds).map(sound),
    })),
    costumes: Object.entries(index.characters).flatMap(([id, costumes]) => costumes.map((c) => costume(c, `${names[id]} ${c.name}`))),
    backdrops: Object.values(index.backdrops).map((b) => costume(b)),
    sounds: Object.values(index.sounds).map(sound),
  };
  mkdirSync(`${OUT}/library`, { recursive: true });
  for (const [name, list] of Object.entries(library)) writeFileSync(`${OUT}/library/${name}.json`, JSON.stringify(list));
  console.log(`✓ ${raw.characters.length} personagens, ${raw.backdrops.length} cenários, ${raw.sounds.length} sons`);
}

type Exported = {
  size: number;
  res: number;
  characters: { id: string; name: string; costumes: { name: string; b64: string }[] }[];
  backdrops: { id: string; name: string; b64: string }[];
  sounds: { id: string; name: string; b64: string; rate: number; sampleCount: number }[];
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
