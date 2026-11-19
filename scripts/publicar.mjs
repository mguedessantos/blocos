// npm run publicar
// Publica o site: testes → editor (fork) → commit e push no master → espera o deploy da Vercel → seed de produção.
// Mostra o que mudou e sugere uma descrição pronta (Enter aceita). Para no primeiro erro, sem publicar nada pela metade.
// Nunca mostra segredos (.env.prod é lido só pelo seed).
import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const CO = "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>";
const EDITOR = "../blocos-editor";

const out = (cmd, cwd) => execSync(cmd, { cwd, encoding: "utf8" }).trim();

/** Descrição automática a partir das pastas que mudaram (ex.: "Atualiza lições e arte dos atores"). */
const AREAS = [
  [/^content\//, "lições"],
  [/^(scripts\/arte\/|public\/editor-assets\/|src\/lib\/sb3\/(assets|asset-aliases)\.json)/, "arte dos atores"],
  [/\.css$/, "visual do site"],
  [/^src\/(app|components)\//, "telas do site"],
  [/^src\//, "funcionamento do site"],
  [/^prisma\//, "banco de dados"],
  [/^tests\//, "testes"],
  [/^scripts\//, "scripts"],
];
function sugestao(files, editorMudou) {
  const areas = new Set(editorMudou ? ["editor de blocos"] : []);
  for (const f of files) {
    const a = AREAS.find(([re]) => re.test(f));
    areas.add(a ? a[1] : "configurações");
  }
  const l = [...areas];
  if (!l.length) return "";
  return "Atualiza " + (l.length === 1 ? l[0] : l.slice(0, -1).join(", ") + " e " + l.at(-1));
}
function step(title, cmd, args, opts = {}) {
  console.log(`\n▶ ${title}`);
  // shell só para npm/npx (.cmd no Windows); com shell, a mensagem do commit seria quebrada nos espaços
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" && cmd !== "git", ...opts });
  if (r.status !== 0) {
    console.error(`\n✖ Parou em: ${title}. Nada foi publicado a partir daqui.`);
    process.exit(1);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 0. ramo certo
if (out("git branch --show-current") !== "master") {
  console.error("✖ Publique a partir do ramo master.");
  process.exit(1);
}

// 0b. o que vai ser publicado e a descrição (texto que fica no histórico do GitHub)
const files = out("git status --porcelain -uall").split("\n").filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());
const editorMudou = existsSync(EDITOR) && !!out("git status --porcelain", EDITOR);
let msg = process.argv.slice(2).join(" ").trim();
if (!msg) {
  const auto = sugestao(files, editorMudou) || `Atualização ${new Date().toLocaleString("pt-BR")}`;
  console.log(files.length || editorMudou ? `\nMudanças (${files.length} arquivo(s)${editorMudou ? " + editor" : ""}):` : "\nNenhuma mudança nova.");
  for (const f of files.slice(0, 15)) console.log("  " + f);
  if (files.length > 15) console.log(`  ... e mais ${files.length - 15}`);
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const resp = (await rl.question(`\nDescrição: "${auto}"\nAperte Enter para usar, ou escreva outra: `)).trim();
    rl.close();
    msg = resp || auto;
  } else msg = auto;
}

// 1. conferências (tudo precisa passar)
step("Testes", "npx", ["vitest", "run"]);
step("Tipos", "npm", ["run", "typecheck"]);
step("Lint", "npm", ["run", "lint"]);

// 2. editor (fork GPL): se mudou, compila, publica o código-fonte e copia para public/editor
if (editorMudou) {
  step("Compilando o editor", "npm", ["run", "editor:build"]);
  step("Commit do editor", "git", ["-c", "user.name=Blocos", "-c", "user.email=mguedes.santos@gmail.com", "commit", "-qam", `${msg}\n\n${CO}`], { cwd: EDITOR });
  step("Push do editor (código-fonte público)", "git", ["push", "-q", "origin", "main"], { cwd: EDITOR });
}

// 3. site: commit e push (o .gitignore já deixa de fora segredos e arquivos locais)
step("Juntando as mudanças", "git", ["add", "-A"]);
if (out("git diff --cached --name-only")) step("Commit", "git", ["commit", "-qm", `${msg}\n\n${CO}`]);
else console.log("\n(nada novo para enviar; só confere o deploy e roda o seed)");
step("Push", "git", ["push", "-q", "origin", "master"]);
const sha = out("git rev-parse HEAD");

// 4. espera o deploy deste commit ficar pronto na Vercel (até 15 min)
console.log(`\n▶ Esperando o deploy na Vercel (${sha.slice(0, 7)})...`);
let state = "";
for (let i = 0; i < 90; i++) {
  try {
    const list = JSON.parse(out("vercel ls blocos --json 2>" + (process.platform === "win32" ? "NUL" : "/dev/null"))).deployments ?? [];
    const d = list.find((x) => x.meta?.githubCommitSha === sha && x.target === "production");
    state = d?.state ?? "AGUARDANDO";
  } catch {
    state = "SEM_RESPOSTA";
  }
  process.stdout.write(`  ${state}\r`);
  if (state === "READY") break;
  if (state === "ERROR" || state === "CANCELED") {
    console.error(`\n✖ O deploy falhou (${state}). Veja em vercel.com. O seed de produção NÃO foi rodado.`);
    process.exit(1);
  }
  await sleep(10_000);
}
if (state !== "READY") {
  console.error("\n✖ O deploy não ficou pronto em 15 min. Rode de novo `npm run publicar` depois.");
  process.exit(1);
}
console.log("\n  pronto.");

// 5. lições e contas de teste em produção (idempotente; nunca apaga progresso)
step("Seed de produção", "npx", ["tsx", "prisma/seed.ts"], { env: { ...process.env, DOTENV_CONFIG_PATH: ".env.prod", SEED_DEMO: "minimal" } });

console.log("\n✔ Publicado: https://blokinlab.com.br");
