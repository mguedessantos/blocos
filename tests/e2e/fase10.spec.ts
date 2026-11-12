import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"));
}

test("coordenação personaliza a marca, adiciona domínio e convida com email da escola", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const slug = `marca-${run}`;
  const email = `coord-${run}@teste.dev`;
  await page.goto(`${ROOT}/cadastro`);
  await page.getByLabel("Nome da escola").fill(`Escola Marca ${run}`);
  await page.getByLabel("Endereço").fill(slug);
  await page.getByLabel("Cidade", { exact: true }).fill("Recife");
  await page.getByLabel("Estado").selectOption("PE");
  await page.getByLabel("Seu nome").fill("Rosa");
  await page.getByLabel("Seu email").fill(email);
  await page.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
  await page.waitForURL(/\/escola/);

  await page.getByRole("link", { name: "Marca", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Marca da escola" })).toBeVisible();

  // cor ilegível é avisada na hora e recusada no servidor
  await page.getByLabel("Cor principal (hex)").fill("#fefefe");
  await expect(page.getByText(/pouco legível/)).toBeVisible();
  await page.getByRole("button", { name: "Salvar marca" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("clara demais");

  await page.getByLabel("Nome exibido (no topo e na aba do navegador)").fill(`Robôs ${run}`);
  await page.getByLabel("Cor principal (hex)").fill("#b91c1c");
  await expect(page.getByLabel("Pré-visualização").getByText(`Robôs ${run}`)).toBeVisible();
  await page.getByLabel(/^Logo/).setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Nome do remetente dos emails").fill("Robôs da Escola");
  await page.getByLabel("Email de suporte (resposta dos emails)").fill(`suporte-${run}@escola.test`);
  await page.getByLabel(/Esconder “com tecnologia/).check();
  await page.getByRole("button", { name: "Salvar marca" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Marca atualizada" })).toBeVisible();

  // o site da escola já sai com a marca nova
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`http://${slug}.localhost:3000/entrar?perfil=equipe`);
  await expect(visitor).toHaveTitle(new RegExp(`Robôs ${run}`));
  const primary = await visitor.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand-primary"));
  expect(primary.trim()).toBe("#b91c1c");
  const logo = visitor.getByRole("img", { name: `Robôs ${run}` }).first();
  await expect(logo).toBeVisible();
  const logoRes = await visitor.evaluate(async (src) => {
    const r = await fetch(src!);
    return { type: r.headers.get("content-type"), csp: r.headers.get("content-security-policy") };
  }, await logo.getAttribute("src"));
  expect(logoRes).toEqual({ type: "image/png", csp: "default-src 'none'" });
  await expect(visitor.getByText(/com tecnologia/)).toHaveCount(0);

  // domínio próprio (domínios .test são aceitos sem DNS em desenvolvimento)
  await page.getByLabel("Domínio próprio").fill(`codigo-${run}.escola.test`);
  await page.getByRole("button", { name: "Adicionar domínio" }).click();
  await expect(page.getByText(`codigo-${run}.escola.test`, { exact: true })).toBeVisible();
  await expect(page.getByText("Aguardando DNS")).toBeVisible();
  await expect(page.getByRole("cell", { name: "cname.vercel-dns.com" })).toBeVisible();
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
  await page.getByLabel("Domínio próprio").fill("outra.localhost");
  await page.getByRole("button", { name: "Adicionar domínio" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("plataforma");

  // convite de professor sai por email com a marca da escola
  const invited = `prof-${run}@teste.dev`;
  await loginStaff(page, `http://${slug}.localhost:3000`, email, "senhaforte123");
  await page.goto(`http://${slug}.localhost:3000/escola/equipe`);
  await page.getByLabel("Email do(a) professor(a)").fill(invited);
  await page.getByRole("button", { name: "Convidar" }).click();
  await expect(page.getByText(`Convite enviado por email para ${invited}`)).toBeVisible();

  const dir = path.resolve(".data/outbox");
  const files = (await readdir(dir)).sort().reverse();
  let mail: { to: string; from: string; replyTo: string; html: string; subject: string } | null = null;
  for (const f of files.slice(0, 50)) {
    const m = JSON.parse(await readFile(path.join(dir, f), "utf8"));
    if (m.to === invited) { mail = m; break; }
  }
  expect(mail).not.toBeNull();
  expect(mail!.from).toContain("Robôs da Escola");
  expect(mail!.replyTo).toBe(`suporte-${run}@escola.test`);
  expect(mail!.subject).toContain(`Robôs ${run}`);
  expect(mail!.html).toContain("#b91c1c");
  expect(mail!.html).toContain(`http://${slug}.localhost:3000/marca/arquivo/`);
});

test("certificado de trilha concluída para o aluno e o professor", async ({ browser }) => {
  // conclui as lições obrigatórias do Mundo 1 para o Bruno direto no banco
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows } = await db.query(`
    select l.id as lesson, u.id as student, t.id as track from "Lesson" l
    join "Module" m on m.id = l."moduleId" join "Track" t on t.id = m."trackId"
    join "Organization" o on o.slug = 'escola-demo' join "User" u on u."organizationId" = o.id and u.username = 'bruno'
    where t.slug = (select slug from "Track" where "organizationId" is null and published order by level, "order" limit 1)
      and t."organizationId" is null and not l.draft and not l.optional`);
  for (const r of rows) {
    await db.query(
      `insert into "Progress" (id, "userId", "lessonId", status, stars, attempts, "updatedAt") values (gen_random_uuid()::text, $1, $2, 'CONCLUIDO', 3, 1, now())
       on conflict ("userId", "lessonId") do update set status = 'CONCLUIDO', stars = 3`,
      [r.student, r.lesson],
    );
  }
  await db.end();
  const trackId = rows[0].track;

  const kid = await (await browser.newContext()).newPage();
  await kid.goto(`${ESCOLA}/entrar-aluno`);
  await kid.getByLabel("Código da turma").fill("ROBO42");
  await kid.getByLabel("Seu usuário").fill("bruno");
  await kid.getByLabel("Sua senha").fill("gato123");
  await kid.getByRole("button", { name: /Vamos lá/ }).click();
  await kid.waitForURL(/\/aluno/);
  const link = kid.getByRole("link", { name: "Certificado da trilha Mundo 1 · Vila do Palco" });
  await expect(link).toBeVisible();
  const res = await kid.evaluate(async (u) => {
    const r = await fetch(u!);
    const b = new Uint8Array(await r.arrayBuffer());
    return { status: r.status, type: r.headers.get("content-type"), magic: String.fromCharCode(...b.slice(0, 5)) };
  }, await link.getAttribute("href"));
  expect(res).toEqual({ status: 200, type: "application/pdf", magic: "%PDF-" });

  // outro aluno não consegue o certificado do Bruno (o parâmetro é ignorado para alunos)
  const clara = await (await browser.newContext()).newPage();
  await clara.goto(`${ESCOLA}/entrar-aluno`);
  await clara.getByLabel("Código da turma").fill("ROBO42");
  await clara.getByLabel("Seu usuário").fill("clara");
  await clara.getByLabel("Sua senha").fill("gato123");
  await clara.getByRole("button", { name: /Vamos lá/ }).click();
  await clara.waitForURL(/\/aluno/);
  const brunoId = rows[0].student;
  const status = await clara.evaluate(async (u) => (await fetch(u)).status, `/certificados/${trackId}?aluno=${brunoId}`);
  expect(status).toBe(404);

  // o professor baixa pelo mapa da turma
  const prof = await (await browser.newContext()).newPage();
  await loginStaff(prof, ESCOLA, "prof@aurora.dev", "senha123");
  await prof.getByRole("link", { name: /5º ano A/ }).first().click();
  const cert = prof.getByRole("link", { name: "Certificado de Bruno" });
  await expect(cert).toBeVisible();
  const st = await prof.evaluate(async (u) => (await fetch(u!)).headers.get("content-type"), await cert.getAttribute("href"));
  expect(st).toBe("application/pdf");
});
