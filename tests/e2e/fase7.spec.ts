import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"));
}

test("dono filtra escolas por estado e cidade, ordena e exporta", async ({ page }) => {
  await loginStaff(page, ROOT, "admin@blocos.dev", "admin123");
  await page.goto(`${ROOT}/plataforma?uf=SP`);
  await expect(page.getByRole("link", { name: "Colégio Aurora" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Turmas da Marina" })).toHaveCount(0);

  await page.goto(`${ROOT}/plataforma?cidade=belo%20horizonte`);
  await expect(page.getByRole("link", { name: "Turmas da Marina" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Colégio Aurora" })).toHaveCount(0);

  await page.goto(`${ROOT}/plataforma`);
  await page.getByRole("link", { name: "Alunos" }).click();
  await expect(page).toHaveURL(/ordem=alunos&dir=desc/);
  await expect(page.getByRole("heading", { name: "Progresso por trilha" })).toBeVisible();

  const res = await page.request.get(`${ROOT}/plataforma/exportar?uf=SP`);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const csv = await res.text();
  expect(csv).toContain("Colégio Aurora");
  expect(csv).not.toContain("Turmas da Marina");
});

test("só o dono acessa o painel e a exportação", async ({ page }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.goto(`${ESCOLA}/plataforma`);
  await expect(page).toHaveURL(/sem-acesso/);
  const status = await page.evaluate(() => fetch("/plataforma/exportar", { redirect: "manual" }).then((r) => r.status));
  expect(status).not.toBe(200);
});

test("remover escola derruba o acesso; restaurar devolve; aviso chega à escola", async ({ browser }) => {
  // nova escola em PE
  const school = await browser.newContext();
  const sp = await school.newPage();
  const email = `pe-${run}@teste.dev`;
  const name = `Escola PE ${run}`;
  await sp.goto(`${ROOT}/cadastro`);
  await sp.getByLabel("Nome da escola").fill(name);
  await sp.getByLabel("Cidade", { exact: true }).fill("Recife");
  await sp.getByLabel("Estado").selectOption("PE");
  await sp.getByLabel("Seu nome").fill("Rui");
  await sp.getByLabel("Seu email").fill(email);
  await sp.getByLabel(/Crie uma senha/).fill("senhaforte123");
  await sp.getByRole("checkbox").check();
  await sp.getByRole("button", { name: /Começar teste grátis|Criar conta/ }).click();
  await sp.waitForURL(/\/escola/);

  const owner = await browser.newContext();
  const op = await owner.newPage();
  await loginStaff(op, ROOT, "admin@blocos.dev", "admin123");

  // aviso só para PE
  await op.goto(`${ROOT}/plataforma/avisos`);
  await op.getByLabel("Título").fill(`Jam regional ${run}`);
  await op.getByLabel(/^Texto/).fill("Inscrições abertas para a **game jam** de Pernambuco!");
  await op.getByText("Estados").click();
  await op.getByRole("checkbox", { name: "PE", exact: true }).check();
  await op.getByRole("button", { name: "Publicar aviso" }).click();
  await expect(op.getByRole("status")).toContainText("Aviso publicado");

  await sp.goto(`${ROOT}/escola`);
  await expect(sp.getByText(`Novo aviso: Jam regional ${run}`)).toBeVisible();
  await sp.getByRole("button", { name: /Avisos \(\d+ novos?\)/ }).click();
  await expect(sp.getByRole("dialog", { name: "Avisos" })).toContainText("game jam");
  await sp.waitForLoadState("networkidle"); // espera o "marcar como lido" terminar
  await sp.reload();
  await expect(sp.getByText(`Novo aviso: Jam regional ${run}`)).toHaveCount(0); // marcado como lido

  // professor de SP não recebe
  const sao = await browser.newContext();
  const sap = await sao.newPage();
  await loginStaff(sap, ESCOLA, "prof@aurora.dev", "senha123");
  await expect(sap.getByText(`Jam regional ${run}`)).toHaveCount(0);

  // remover
  await op.goto(`${ROOT}/plataforma?q=${encodeURIComponent(name)}`);
  await op.getByRole("link", { name }).click();
  await op.getByRole("button", { name: `Remover ${name}` }).click();
  await op.getByLabel(`Motivo para remover ${name}`).fill("Teste automático");
  await op.getByRole("button", { name: "Confirmar remoção" }).click();
  await expect(op.getByRole("status")).toContainText("lixeira");

  await sp.goto(`${ROOT}/escola`);
  await expect(sp).toHaveURL(/\/entrar/);

  await op.goto(`${ROOT}/plataforma/lixeira`);
  const item = op.getByRole("listitem").filter({ hasText: name });
  await item.getByRole("button", { name: "Restaurar" }).click();
  await expect(op.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);

  await loginStaff(sp, ROOT, email, "senhaforte123");
  await expect(sp).toHaveURL(/\/escola/);

  await Promise.all([school.close(), owner.close(), sao.close()]);
});

test("professor vê o mapa de progresso da turma", async ({ page }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByRole("link", { name: /5º ano A/ }).first().click();
  await expect(page.getByRole("heading", { name: "Progresso da turma" })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: /Ana/ })).toBeVisible();
  await page.getByRole("navigation", { name: "Trilhas" }).getByRole("link").nth(1).click();
  await expect(page).toHaveURL(/trilha=/);
});

test("aluno vê nível e medalhas", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("ana");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(/\/aluno/);
  await expect(page.getByRole("heading", { name: /^Nível \d+:/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Minhas medalhas \(\d+\/\d+\)/ })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso até o próximo nível" })).toBeVisible();
});

test("coordenação vê conclusão por turma e atividade da equipe", async ({ page }) => {
  await loginStaff(page, ESCOLA, "coord@aurora.dev", "senha123");
  await page.goto(`${ESCOLA}/escola`);
  await expect(page.getByText("Ativos nos últimos 7 dias")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Conclusão da turma 5º ano A" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Paulo Professor" }).first()).toBeVisible();
});

test("dono cria escola e professor(a) com senha temporária", async ({ page, browser }) => {
  await loginStaff(page, ROOT, "admin@blocos.dev", "admin123");
  await page.goto(`${ROOT}/plataforma`);
  await page.getByRole("button", { name: "Nova escola" }).click();
  await page.getByLabel("Nome da escola").fill(`Escola Dono ${run}`);
  await expect(page.getByLabel("Endereço (subdomínio)")).toHaveValue(`escola-dono-${run}`);
  await page.getByLabel("Cidade da escola").fill("Salvador");
  await page.getByLabel("Estado da escola").selectOption("BA");
  await page.getByLabel("Nome da coordenação").fill("Bia");
  await page.getByLabel("Email da pessoa responsável").fill(`bia-${run}@teste.dev`);
  await page.getByRole("button", { name: "Criar conta" }).click();
  const box = page.getByRole("status").filter({ hasText: "Senha temporária" });
  await expect(box).toBeVisible();
  const coordPw = (await box.locator("code").nth(1).innerText()).trim();

  // a coordenação entra com a senha temporária
  const coord = await (await browser.newContext()).newPage();
  await loginStaff(coord, ROOT, `bia-${run}@teste.dev`, coordPw);
  await expect(coord).toHaveURL(/\/escola/);

  // o dono adiciona um professor na página da escola
  await box.getByRole("link", { name: "Abrir a escola" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Teo");
  await page.getByLabel("Email", { exact: true }).fill(`teo-${run}@teste.dev`);
  await page.getByRole("button", { name: "Adicionar pessoa" }).click();
  const tbox = page.getByRole("status").filter({ hasText: "Senha temporária" });
  const teoPw = (await tbox.locator("code").nth(1).innerText()).trim();
  const teo = await (await browser.newContext()).newPage();
  await loginStaff(teo, ROOT, `teo-${run}@teste.dev`, teoPw);
  await expect(teo).toHaveURL(/\/professor/);

  // nova senha invalida a anterior
  await page.reload();
  await page.getByRole("button", { name: "Nova senha para Teo" }).click();
  const nbox = page.getByRole("status").filter({ hasText: "Senha temporária" });
  const newPw = (await nbox.locator("code").nth(1).innerText()).trim();
  expect(newPw).not.toBe(teoPw);
  const again = await (await browser.newContext()).newPage();
  await loginStaff(again, ROOT, `teo-${run}@teste.dev`, newPw);
  await expect(again).toHaveURL(/\/professor/);
});
