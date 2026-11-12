import { expect, test } from "@playwright/test";

const ESCOLA = "http://escola-demo.localhost:3000";
const MARINA = "http://prof-marina.localhost:3000";

test("aluno entra com código da turma e vê seu painel", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("robo42");
  await page.getByLabel("Seu usuário").fill("ana");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await expect(page).toHaveURL(`${ESCOLA}/aluno`);
  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await expect(page.getByText("5º ano A")).toBeVisible();
});

test("senha errada mostra erro amigável", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("ana");
  await page.getByLabel("Sua senha").fill("errada");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Peça ajuda ao seu professor");
  await expect(page.getByLabel("Seu usuário")).toHaveValue("ana"); // não apaga o que a criança digitou
});

test("turma de outra escola não funciona no domínio da escola", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("GATO77");
  await page.getByLabel("Seu usuário").fill("ana");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
});

test("professor vê suas turmas com a marca da escola (white-label)", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar?perfil=equipe`);
  await expect(page).toHaveTitle(/Aurora Code/);
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(`${ESCOLA}/professor`);
  await expect(page.getByText("ROBO42")).toBeVisible();
  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand-primary"));
  expect(primary.trim()).toBe("#0f766e");
});

test("professor da Aurora não entra pelo domínio de outro cliente", async ({ page }) => {
  await page.goto(`${MARINA}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("não pertence a esta escola");
});

test("aluno não acessa a área do professor", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("bruno");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await expect(page).toHaveURL(`${ESCOLA}/aluno`);
  await page.goto(`${ESCOLA}/professor`);
  await expect(page).toHaveURL(`${ESCOLA}/sem-acesso`);
});

test("super admin vê todos os clientes na raiz", async ({ page }) => {
  await page.goto("/entrar?perfil=equipe");
  await page.getByLabel("Email").fill("admin@blocos.dev");
  await page.getByLabel("Senha").fill("admin123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/plataforma");
  await expect(page.getByRole("cell", { name: "Colégio Aurora" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Turmas da Marina" })).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL("/");
});

test("login mostra o aluno primeiro e troca para a equipe", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar`);
  await expect(page.getByLabel("Código da turma")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveCount(0);
  await page.getByRole("button", { name: /Sou professor\(a\), coordenação ou jurado\(a\)/ }).click();
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByRole("button", { name: "Sou aluno(a)" }).click();
  await expect(page.getByLabel("Código da turma")).toBeVisible();
  // vindo de uma área da equipe, abre direto o login da equipe
  await page.goto(`${ESCOLA}/professor`);
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("no endereço principal, depois do login vale a marca da escola", async ({ page }) => {
  await page.goto("/entrar?perfil=equipe");
  await expect(page.getByRole("banner").or(page.locator("body"))).not.toContainText("Aurora Code");
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/professor/);
  await expect(page.getByRole("banner")).toContainText("Aurora Code");
  await expect(page).toHaveTitle(/Aurora Code/);
  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand-primary"));
  expect(primary.trim()).toBe("#0f766e");
});
