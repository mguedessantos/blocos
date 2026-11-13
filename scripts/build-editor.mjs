// Compila o editor de blocos (fork GPL do TurboWarp em ../blocos-editor) e copia para public/editor.
// Uso: npm run editor:build   (pasta do fork configurável em EDITOR_DIR)
import { execSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.env.EDITOR_DIR ?? "../blocos-editor");
rmSync(`${dir}/build`, { recursive: true, force: true }); // sem sobras de builds anteriores
execSync("npx webpack --bail", {
  cwd: dir,
  stdio: "inherit",
  env: { ...process.env, BLOCOS: "1", ROOT: "/editor/", NODE_ENV: "production", CI: "1", MSYS_NO_PATHCONV: "1" },
});
rmSync("public/editor", { recursive: true, force: true });
cpSync(`${dir}/build`, "public/editor", {
  recursive: true,
  // páginas e arquivos do site do TurboWarp que não usamos
  filter: (src) => !/(embedtest|embedtestbad|privacy)\.html$|manifest\.webmanifest$|robots\.txt$|[\\/]microbit([\\/]|$)/.test(src),
});
console.log("✓ editor copiado para public/editor");
