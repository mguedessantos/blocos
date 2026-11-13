// Copia para public/editor-assets a arte e os sons da biblioteca do editor (TurboWarp/Scratch), para que o
// navegador do aluno nunca busque nada em servidores de fora (LGPD: o IP da escola não sai da plataforma).
// Uso: npm run editor:mirror   (pasta do fork configurável em EDITOR_DIR; só baixa o que ainda não existe)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.env.EDITOR_DIR ?? "../blocos-editor", "src/lib/libraries");
const OUT = "public/editor-assets";

type Asset = { md5ext?: string; costumes?: Asset[]; sounds?: Asset[] };
const files = new Set<string>();
for (const name of ["sprites", "costumes", "backdrops", "sounds"]) {
  for (const item of JSON.parse(readFileSync(`${dir}/${name}.json`, "utf8")) as Asset[]) {
    for (const a of [item, ...(item.costumes ?? []), ...(item.sounds ?? [])]) if (a.md5ext && /^[0-9a-f]{32}\.(svg|png|wav|mp3)$/.test(a.md5ext)) files.add(a.md5ext);
  }
}

async function get(md5ext: string, tries = 3): Promise<void> {
  const path = `${OUT}/${md5ext}`;
  if (existsSync(path)) return;
  try {
    const res = await fetch(`https://assets.scratch.mit.edu/internalapi/asset/${md5ext}/get/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // o nome do arquivo é o md5 do conteúdo: confere que veio o arquivo certo
    if (createHash("md5").update(buf).digest("hex") !== md5ext.split(".")[0]) throw new Error("md5 diferente");
    writeFileSync(path, buf);
  } catch (e) {
    if (tries > 1) return get(md5ext, tries - 1);
    throw new Error(`${md5ext}: ${(e as Error).message}`);
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const queue = [...files];
  const failed: string[] = [];
  let done = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      await get(f).catch((e) => failed.push(String(e.message)));
      if (++done % 200 === 0) console.log(`${done}/${files.size}`);
    }
  }));
  console.log(`✓ ${files.size - failed.length} de ${files.size} arquivos em ${OUT}`);
  if (failed.length) {
    console.error("falharam:", failed.slice(0, 10).join("; "));
    process.exit(1);
  }
}
main();
