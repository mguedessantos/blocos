// Encaminha webhooks do Stripe para o app local usando a MESMA conta da STRIPE_SECRET_KEY do .env
// (o login do Stripe CLI pode apontar para outra conta). Uso: npm run stripe:listen
import "dotenv/config";
import { spawn } from "node:child_process";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_")) {
  console.error("Defina STRIPE_SECRET_KEY (sk_test_...) no .env.");
  process.exit(1);
}

const child = spawn(
  "stripe",
  ["listen", "--api-key", key, "--all-snapshot", "--forward-to", "localhost:3000/api/stripe/webhook"],
  { stdio: "inherit", shell: process.platform === "win32" },
);
child.on("exit", (code) => process.exit(code ?? 0));
console.log("Se o segredo whsec_ exibido for diferente do STRIPE_WEBHOOK_SECRET no .env, atualize o .env.");
