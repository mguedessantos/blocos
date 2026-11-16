// npm run dev: o site (next dev) e, junto, dois vigias:
// - scripts/arte  → gera a arte dos atores de novo (export-assets);
// - content/      → grava as lições no banco local (db:seed), ao editar o texto no VS Code.
// Depois de "[...] pronto", é só recarregar a página (F5).
import { spawn } from "node:child_process";
import { watch } from "node:fs";

const run = (cmd, args) => spawn([cmd, ...args].join(" "), { stdio: "inherit", shell: true }); // só argumentos fixos deste arquivo
const next = run("npx", ["next", "dev", ...process.argv.slice(2)]);
next.on("exit", (code) => process.exit(code ?? 0));

/** Roda `args` quando a pasta muda (espera o arquivo terminar de salvar; nunca roda duas vezes ao mesmo tempo). */
function vigiar(dir, tag, what, args) {
  let timer = null;
  let busy = false;
  let again = false;
  const go = () => {
    if (busy) return void (again = true);
    busy = true;
    console.log(`\n[${tag}] ${dir} mudou: ${what}...`);
    run("npx", args).on("exit", (code) => {
      busy = false;
      console.log(code === 0 ? `[${tag}] pronto. Recarregue a página (F5).` : `[${tag}] erro (veja acima).`);
      if (!again) return;
      again = false;
      go();
    });
  };
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(go, 800);
  });
  console.log(`[${tag}] olhando ${dir}.`);
}

vigiar("scripts/arte", "arte", "gerando a arte dos atores", ["tsx", "scripts/export-assets.ts"]);
vigiar("content", "lições", "gravando as lições no banco local", ["prisma", "db", "seed"]);
