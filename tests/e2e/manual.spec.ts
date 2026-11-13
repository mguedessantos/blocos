import { expect, test, type Page } from "@playwright/test";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"));
}

test("professor abre o manual pelo ícone, busca e baixa o PDF", async ({ page }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.getByRole("link", { name: "Manual da plataforma" }).click();
  await page.waitForURL(/\/manual\/professor$/);
  await expect(page.getByRole("heading", { name: "Guia do(a) professor(a)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Guia da coordenação" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Cartões de login gerados para a turma" })).toBeVisible();

  await page.getByPlaceholder("Buscar no manual…").fill("cartões de login");
  await expect(page.locator("section#alunos")).toBeVisible();
  await expect(page.locator("section#primeiro-acesso")).toBeHidden();
  await page.getByPlaceholder("Buscar no manual…").fill("palavra que não existe");
  await expect(page.getByText("Nenhum capítulo encontrado.")).toBeVisible();

  // pela própria página (o Node não resolve *.localhost)
  const get = (u: string) => page.evaluate(async (url) => {
    const r = await fetch(url);
    const head = new TextDecoder().decode((await r.arrayBuffer()).slice(0, 4));
    return { type: r.headers.get("content-type"), disp: r.headers.get("content-disposition"), head };
  }, u);
  const pdf = await get("/manual/pdf?guia=professor");
  expect(pdf.type).toBe("application/pdf");
  expect(pdf.head).toBe("%PDF");
  // o guia da coordenação não sai para o professor (cai no guia dele)
  expect((await get("/manual/pdf?guia=coordenacao")).disp).toContain("manual-professor.pdf");
});

test("coordenação vê os dois guias; jurado vê o dele", async ({ browser }) => {
  const coord = await (await browser.newContext()).newPage();
  await loginStaff(coord, ESCOLA, "coord@aurora.dev", "senha123");
  await coord.goto(`${ESCOLA}/manual`);
  await coord.waitForURL(/\/manual\/coordenacao$/);
  await coord.getByRole("link", { name: "Guia do(a) professor(a)" }).click();
  await expect(coord.getByRole("heading", { name: "Guia do(a) professor(a)" })).toBeVisible();

  const owner = await (await browser.newContext()).newPage();
  await loginStaff(owner, ROOT, "admin@blocos.dev", "admin123");
  await owner.goto(`${ROOT}/manual/jurado`);
  await expect(owner.getByRole("heading", { name: "Guia do(a) jurado(a)" })).toBeVisible();
});

test("aluno não acessa o manual", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("clara");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(/\/aluno/);
  await expect(page.getByRole("link", { name: "Manual da plataforma" })).toHaveCount(0);
  await page.goto(`${ESCOLA}/manual/professor`);
  await expect(page).not.toHaveURL(/\/manual/);
});
