import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const run = Date.now().toString(36);
const BILLING = process.env.BILLING_ENABLED === "true";

async function signup(page: Page, opts: { type?: "Escola" | "Professor"; org: string; email: string }) {
  await page.goto("/cadastro");
  if (opts.type === "Professor") await page.getByText("🍎 Professor(a)").click();
  await page.getByLabel(/Nome da (escola|sua conta)/).fill(opts.org);
  await page.getByLabel("Cidade", { exact: true }).fill("Campinas");
  await page.getByLabel("Estado").selectOption("SP");
  await page.getByLabel("Seu nome").fill("Rita Responsável");
  await page.getByLabel("Seu email").fill(opts.email);
  await page.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
}

test("página de preços lista os planos em reais", async ({ page }) => {
  test.skip(!BILLING, "cobrança desativada (BILLING_ENABLED)");
  await page.goto("/precos");
  await expect(page.getByRole("heading", { name: "Escola+" })).toBeVisible();
  await expect(page.getByText("R$ 49,00")).toBeVisible();
  await expect(page.getByText("R$ 12,00")).toBeVisible();
});

test("preços e cadastro não aparecem no domínio de uma escola", async ({ page }) => {
  const res = await page.goto("http://escola-demo.localhost:3000/precos");
  if (BILLING) await expect(page).toHaveURL("http://escola-demo.localhost:3000/");
  else expect(res?.status()).toBe(404);
  await page.goto("http://escola-demo.localhost:3000/cadastro");
  await expect(page).toHaveURL("http://escola-demo.localhost:3000/entrar");
});

test("escola se cadastra, começa o teste e vê a assinatura", async ({ page }) => {
  test.skip(!BILLING, "cobrança desativada (BILLING_ENABLED)");
  const slug = `escola-${run}`;
  await signup(page, { org: `Escola ${run}`, email: `rita-${run}@teste.dev` });

  await expect(page).toHaveURL(/\/escola\?bem-vindo=1/);
  await expect(page.getByText("Conta criada!")).toBeVisible();
  await expect(page.getByText("Teste grátis: faltam 14 dias.")).toBeVisible();
  await expect(page.getByRole("link", { name: `http://${slug}.localhost:3000` })).toBeVisible();

  await page.getByRole("link", { name: "Assinar agora" }).click();
  await expect(page).toHaveURL("/escola/assinatura");
  await expect(page.getByText("Teste grátis", { exact: true })).toBeVisible();
  // planos da escola (não o de professor)
  await expect(page.getByRole("heading", { name: "Escola+" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Professor" })).toHaveCount(0);
  // total por aluno recalcula
  const card = page.locator("form", { has: page.getByRole("heading", { name: "Escola+" }) });
  await card.getByLabel("Número de alunos").fill("50");
  await expect(card.getByText("R$ 600,00/mês")).toBeVisible();

  if (!process.env.STRIPE_SECRET_KEY) {
    await expect(page.getByText(/não estão configurados/)).toBeVisible();
    await expect(card.getByRole("button", { name: "Assinar" })).toBeDisabled();
  }

  // a nova escola já funciona no próprio subdomínio
  await page.goto(`http://${slug}.localhost:3000/entrar`);
  await page.getByLabel("Email").fill(`rita-${run}@teste.dev`);
  await page.getByLabel("Senha").fill("senhaforte123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(`http://${slug}.localhost:3000/escola`);
  // no teste a escola usa o Escola+, então o domínio já aparece com a marca dela (nome no título)
  await expect(page).toHaveTitle(new RegExp(`Escola ${run}`));
});

test("endereço ou email já usados mostram erro", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome da escola").fill("Outra");
  await page.getByLabel("Endereço").fill("escola-demo");
  await page.getByLabel("Cidade", { exact: true }).fill("Campinas");
  await page.getByLabel("Estado").selectOption("SP");
  await page.getByLabel("Seu nome").fill("Fulano");
  await page.getByLabel("Seu email").fill(`novo-${run}@teste.dev`);
  await page.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
  await expect(page.locator("p[role=alert]")).toContainText("já está em uso");
  // o que foi digitado continua lá (só a senha precisa ser redigitada)
  await expect(page.getByLabel("Seu nome")).toHaveValue("Fulano");
  await expect(page.getByLabel("Seu email")).toHaveValue(`novo-${run}@teste.dev`);
  await expect(page.getByRole("checkbox")).toBeChecked();

  await page.getByLabel("Endereço").fill(`livre-${run}`);
  await page.getByLabel("Seu email").fill("prof@aurora.dev");
  await page.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await page.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Já existe uma conta com este email");
});

test("teste expirado deixa a conta somente leitura", async ({ page }) => {
  test.skip(!BILLING, "cobrança desativada (BILLING_ENABLED)");
  const email = `exp-${run}@teste.dev`;
  await signup(page, { type: "Professor", org: `Prof Exp ${run}`, email });
  await expect(page).toHaveURL(/\/escola/);

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(
    `UPDATE "Subscription" SET "trialEndsAt" = now() - interval '1 day'
     WHERE "organizationId" = (SELECT "organizationId" FROM "User" WHERE email = $1)`,
    [email],
  );
  await db.end();

  await page.goto("/professor");
  await expect(page.getByText("somente leitura")).toBeVisible();
  await page.getByRole("link", { name: "Resolver" }).click();
  await expect(page.getByText(/terminou em/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Professor" })).toBeVisible();
});

test("com a cobrança desativada não há preços, assinatura nem limites", async ({ page }) => {
  test.skip(BILLING, "só vale com a cobrança desativada");
  expect((await page.goto("/precos"))?.status()).toBe(404);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Preços" })).toHaveCount(0);
  await signup(page, { org: `Sem cobrança ${run}`, email: `semcobranca-${run}@teste.dev` });
  await expect(page).toHaveURL(/\/escola/);
  await expect(page.getByText(/Teste grátis/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Assinatura" })).toHaveCount(0);
  expect((await page.goto("/escola/assinatura"))?.status()).toBe(404);
});
