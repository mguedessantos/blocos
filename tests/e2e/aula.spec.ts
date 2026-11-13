import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
}

test("professor dá aula: abre a lição como o aluno, verifica e nada é gravado", async ({ page }) => {
  test.setTimeout(90_000);
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByRole("link", { name: "Mundos e aulas" }).first().click();
  await page.getByRole("link", { name: /Vila do Palco/ }).click();
  await page.getByRole("link", { name: "Dar aula" }).nth(2).click(); // 3ª lição: exercício no editor
  await expect(page.getByText("Modo aula")).toBeVisible();
  await expect(page.frameLocator("iframe[title='Editor de blocos']").locator(".blocklySvg").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Abrindo o editor de blocos")).toBeHidden({ timeout: 30_000 });

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const count = async () => Number((await db.query(`select count(*) from "Progress" p join "User" u on u.id = p."userId" where u.email = 'prof@aurora.dev'`)).rows[0].count);
  const before = await count();
  await page.frameLocator("iframe[title='Editor de blocos']").locator("[class*='green-flag_green-flag']").click(); // Verificar só depois de rodar
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByRole("status", { name: "Resultado da verificação" })).toBeVisible();
  expect(await count()).toBe(before);
  await db.end();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Próxima lição" }).first().click();
  await expect(page).toHaveURL(/\/professor\/licoes\//);
});

test("conta criada pelo dono usa a senha padrão e precisa trocar no primeiro login", async ({ browser }) => {
  const owner = await (await browser.newContext()).newPage();
  await loginStaff(owner, ROOT, "admin@blocos.dev", "admin123");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const org = (await db.query(`select id from "Organization" where slug = 'escola-demo'`)).rows[0].id;
  await owner.goto(`${ROOT}/plataforma/escolas/${org}`);
  const email = `nova-${run}@teste.dev`;
  await owner.getByLabel("Nome", { exact: true }).fill("Nova Professora");
  await owner.getByLabel("Email", { exact: true }).fill(email);
  await owner.getByRole("button", { name: "Adicionar pessoa" }).click();
  await expect(owner.getByText("blocos123").first()).toBeVisible();

  const prof = await (await browser.newContext()).newPage();
  await loginStaff(prof, ESCOLA, email, "blocos123");
  await expect(prof).toHaveURL(/\/trocar-senha/);
  await prof.goto(`${ESCOLA}/professor`);
  await expect(prof).toHaveURL(/\/trocar-senha/); // não passa sem trocar
  await prof.getByLabel(/^Nova senha/).fill("blocos123");
  await prof.getByLabel("Repita a nova senha").fill("blocos123");
  await prof.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(prof.getByText("Escolha uma senha diferente da senha padrão.")).toBeVisible();
  await prof.getByLabel(/^Nova senha/).fill("minhasenha9");
  await prof.getByLabel("Repita a nova senha").fill("minhasenha9");
  await prof.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(prof).toHaveURL(`${ESCOLA}/professor`);
  await db.query(`delete from "User" where email = $1`, [email]);
  await db.end();
});
