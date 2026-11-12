import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";

const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar")); // espera o cookie de sessão
}

async function readCard(page: Page, name: string) {
  const card = page.locator(".print-area > div", { hasText: `Oi, ${name}!` }).first();
  const code = await card.locator("dt:has-text('Turma') + dd").innerText();
  const username = await card.locator("dt:has-text('Usuário') + dd").innerText();
  const password = await card.locator("dt:has-text('Senha') + dd").innerText();
  return { code, username, password };
}

async function loginStudent(page: Page, base: string, c: { code: string; username: string; password: string }) {
  await page.goto(`${base}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill(c.code);
  await page.getByLabel("Seu usuário").fill(c.username);
  await page.getByLabel("Sua senha").fill(c.password);
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForLoadState("networkidle");
}

test("professor cria turma, cadastra alunos e o aluno entra com o cartão", async ({ page, browser }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByLabel("Nome da nova turma").fill(`Turma ${run}`);
  await page.getByRole("button", { name: "+ Criar turma" }).click();
  await expect(page.getByRole("heading", { name: `Turma ${run}` })).toBeVisible();

  await page.getByLabel(/Nomes dos alunos/).fill("Lia Souza\nLia\nTomé");
  await page.getByRole("button", { name: "Criar alunos e gerar senhas" }).click();
  await expect(page.getByText("3 aluno(s) criado(s)!")).toBeVisible();
  await expect(page.getByRole("button", { name: /Imprimir cartões/ })).toBeVisible();

  const tome = await readCard(page, "Tomé");
  expect(tome.username).toMatch(/^tome\d*$/);
  expect(tome.password).toMatch(/^[a-z]+\d{3}$/);
  const lias = await page.locator(".print-area dt:has-text('Usuário') + dd").allInnerTexts();
  expect(new Set(lias).size).toBe(3); // usuários únicos mesmo com nomes repetidos

  const kid = await browser.newContext();
  const kidPage = await kid.newPage();
  await loginStudent(kidPage, ESCOLA, tome);
  await expect(kidPage.getByRole("heading", { name: /Olá, Tomé/ })).toBeVisible();
  await kid.close();

  // nova senha invalida a antiga
  await page.reload();
  await page.getByLabel("Selecionar Tomé").check();
  await page.getByRole("button", { name: /Gerar novas senhas/ }).click();
  const fresh = await readCard(page, "Tomé");
  expect(fresh.password).not.toBe(tome.password);

  const kid2 = await browser.newContext();
  const kidPage2 = await kid2.newPage();
  await loginStudent(kidPage2, ESCOLA, tome);
  await expect(kidPage2.locator("p[role=alert]")).toBeVisible();
  await loginStudent(kidPage2, ESCOLA, fresh);
  await expect(kidPage2).toHaveURL(`${ESCOLA}/aluno`);
  await kid2.close();

  // desativar bloqueia o login; excluir remove da turma
  page.on("dialog", (d) => d.accept());
  const row = page.locator("tr", { hasText: "Tomé" });
  await row.getByRole("button", { name: "Desativar" }).click();
  await expect(row.getByText("Desativado")).toBeVisible();
  const kid3 = await browser.newContext();
  const kidPage3 = await kid3.newPage();
  await loginStudent(kidPage3, ESCOLA, fresh);
  await expect(kidPage3.locator("p[role=alert]")).toBeVisible();
  await kid3.close();

  await row.getByRole("button", { name: "Excluir" }).click();
  await expect(page.locator("tr", { hasText: "Tomé" })).toHaveCount(0);
});

test("CSV com cabeçalho é importado", async ({ page }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByLabel("Nome da nova turma").fill(`CSV ${run}`);
  await page.getByRole("button", { name: "+ Criar turma" }).click();
  await page.getByLabel("Arquivo CSV").setInputFiles({
    name: "alunos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("nome;idade\nRafa;9\nDuda;10\n"),
  });
  await expect(page.getByLabel(/Nomes dos alunos/)).toHaveValue(/Rafa/);
  await page.getByRole("button", { name: "Criar alunos e gerar senhas" }).click();
  await expect(page.getByText("2 aluno(s) criado(s)!")).toBeVisible();
});

test("professor não vê turma de outro professor nem de outra escola", async ({ page }) => {
  // turma do Paulo (escola-demo)
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByRole("link", { name: /ROBO42/ }).click();
  await page.waitForURL(/\/professor\/turmas\//);
  const pauloClassUrl = page.url().replace(ESCOLA, "");

  // Marina (outra organização) tenta abrir pela própria escola
  const marina = "http://prof-marina.localhost:3000";
  await page.context().clearCookies();
  await loginStaff(page, marina, "marina@prof.dev", "senha123");
  await page.goto(`${marina}${pauloClassUrl}`);
  expect(pauloClassUrl).toMatch(/^\/professor\/turmas\/\w+/);
  await expect(page.getByText(/could not be found|não encontrad/i)).toBeVisible();
  await expect(page.getByText("ROBO42")).toHaveCount(0);
  // exportar dados de um aluno da Aurora pela conta da Marina → 404
  const res = await page.goto(`${marina}/professor/alunos/qualquer/exportar`);
  expect(res?.status()).toBe(404);
});

test("plano Professor bloqueia a 4ª turma", async ({ page }) => {
  test.skip(process.env.BILLING_ENABLED !== "true", "limites de plano só valem com a cobrança ligada");
  await page.goto("/cadastro");
  await page.getByText("🍎 Professor(a)").click();
  await page.getByLabel(/Nome da sua conta/).fill(`Limite ${run}`);
  await page.getByLabel("Seu nome").fill("Lu");
  await page.getByLabel("Seu email").fill(`limite-${run}@teste.dev`);
  await page.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
  await page.waitForURL(/\/escola/);

  for (let i = 1; i <= 4; i++) {
    await page.goto("/professor");
    await page.getByLabel("Nome da nova turma").fill(`T${i}`);
    await page.getByRole("button", { name: "+ Criar turma" }).click();
    if (i < 4) await expect(page.getByRole("heading", { name: `T${i}` })).toBeVisible();
  }
  await expect(page.locator("p[role=alert]")).toContainText("permite 3 turmas");
});

test("coordenação convida professor e ele cria a conta pelo link", async ({ page, browser }) => {
  await loginStaff(page, ESCOLA, "coord@aurora.dev", "senha123");
  await page.goto(`${ESCOLA}/escola/equipe`);
  const email = `novo-prof-${run}@aurora.dev`;
  await page.getByLabel("Email do(a) professor(a)").fill(email);
  await page.getByRole("button", { name: "Convidar" }).click();
  const link = await page.getByLabel("Link do convite").inputValue();
  expect(link).toMatch(/^http:\/\/escola-demo\.localhost:3000\/convite\//);
  await expect(page.getByText(email).first()).toBeVisible();

  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(link);
  await expect(p.getByText(email)).toBeVisible();
  await p.getByLabel("Seu nome").fill("Nina Nova");
  await p.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await p.getByRole("button", { name: "Criar conta" }).click();
  await expect(p).toHaveURL(`${ESCOLA}/professor`);
  await expect(p.getByText("Nina Nova")).toBeVisible();

  // o link não serve duas vezes
  await p.goto(link);
  await expect(p.getByText("Convite inválido ou expirado")).toBeVisible();
  await ctx.close();
});
