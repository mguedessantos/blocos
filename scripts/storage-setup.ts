// Cria (uma vez) o bucket PRIVADO do Supabase Storage usado pelo site.
// Uso: npm run storage:setup   (precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env)
import "dotenv/config";

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET ?? "blocos-arquivos";
if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");

const headers = { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" };
const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers });
if (existing.ok) {
  const b = await existing.json();
  if (b.public) throw new Error(`O bucket "${bucket}" existe mas é PÚBLICO. Torne-o privado no painel do Supabase.`);
  console.log(`Bucket "${bucket}" já existe e é privado ✔`);
} else {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: bucket, name: bucket, public: false, file_size_limit: 30 * 1024 * 1024 }),
  });
  if (!res.ok) throw new Error(`Falha ao criar o bucket: ${res.status} ${await res.text()}`);
  console.log(`Bucket privado "${bucket}" criado ✔`);
}
