import "dotenv/config";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { Client } from "pg";
import { sb3Bytes } from "../unit/sb3-builder";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);

async function loginStaff(page: Page, base: string, email: string, password: string) {
  await page.goto(`${base}/entrar`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"));
}

async function loginStudent(page: Page, username: string) {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill(username);
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(/\/aluno/);
}

/** Move as datas da jam para simular as fases (o servidor decide a fase pelo relógio). */
async function shiftJam(jamId: string, phase: "EM_ANDAMENTO" | "JULGAMENTO" | "ENCERRADA") {
  const h = (n: number) => `now() + interval '${n} hours'`;
  const [s, e, j] = phase === "EM_ANDAMENTO" ? [h(-1), h(48), h(96)] : phase === "JULGAMENTO" ? [h(-48), h(-1), h(48)] : [h(-96), h(-48), h(-1)];
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`update "GameJam" set "startsAt" = ${s}, "endsAt" = ${e}, "judgingEndsAt" = ${j} where id = $1`, [jamId]);
  await db.end();
}

async function newPage(browser: Browser) {
  return (await browser.newContext()).newPage();
}

test("game jam completa: criação, equipe, entrega, julgamento cego e resultado", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Jam Teste ${run}`;
  const team = `Os Pixels ${run}`;

  // ── dono cria a jam com prêmio, publica e convida jurados
  const owner = await newPage(browser);
  await loginStaff(owner, ROOT, "admin@blocos.dev", "admin123");
  await owner.goto(`${ROOT}/jams/nova`);
  await owner.getByLabel("Nome da jam").fill(title);
  await owner.getByLabel("Tema").fill("Mundo de cabeça para baixo");
  await owner.getByLabel(/^Regras e informações/).fill("Crie um jogo em equipe sobre o tema. Boa sorte!");
  await owner.getByLabel("Prêmio do 1º lugar").fill("Kit de robótica para a escola");
  await owner.getByLabel("Quem recebe o prêmio 1").selectOption("ESCOLA");
  await owner.getByRole("button", { name: "Criar jam (como rascunho)" }).click();
  await owner.waitForURL(/\/jams\/gerenciar\//);
  const jamId = owner.url().split("/").pop()!.split("?")[0];

  const judgeEmail = `juiz-${run}@teste.dev`;
  await owner.getByLabel("Nome do jurado").fill("Júlia Jurada");
  await owner.getByLabel("Email do jurado").fill(judgeEmail);
  await owner.getByRole("button", { name: "Adicionar jurado" }).click();
  const password = (await owner.locator("code").innerText()).trim();
  // professor da mesma escola das equipes também é jurado → conflito de interesse
  await owner.getByLabel("Nome do jurado").fill("Paulo");
  await owner.getByLabel("Email do jurado").fill("prof@aurora.dev");
  await owner.getByRole("button", { name: "Adicionar jurado" }).click();
  await expect(owner.getByText("prof@aurora.dev")).toBeVisible();
  await owner.getByRole("button", { name: "Publicar jam" }).click();
  await expect(owner.getByRole("button", { name: "Despublicar" })).toBeVisible();

  // ── inscrições abertas: a página mostra prêmio e contagem regressiva
  const prof = await newPage(browser);
  await loginStaff(prof, ESCOLA, "prof@aurora.dev", "senha123");
  await prof.goto(`${ESCOLA}/jams`);
  await expect(prof.getByRole("heading", { name: title })).toBeVisible();
  await prof.getByRole("article").filter({ hasText: title }).getByRole("link", { name: "Ver jam" }).click();
  await prof.waitForURL(new RegExp(`/jams/jam-teste-${run}$`));
  await expect(prof.getByText("Kit de robótica para a escola", { exact: true })).toBeVisible();
  await expect(prof.getByText("Começa em").filter({ visible: true }).first()).toBeVisible();

  // ── professor inscreve equipe com Ana e Bruno
  await prof.getByText("+ Inscrever nova equipe").click();
  await prof.getByLabel("Nome da equipe").fill(team);
  await prof.getByRole("checkbox", { name: /Ana/ }).check();
  await prof.getByRole("checkbox", { name: /Bruno/ }).check();
  await prof.getByLabel("Ano escolar de Ana").selectOption("5");
  await prof.getByLabel("Ano escolar de Bruno").selectOption("6"); // 5º e 6º: faixas diferentes
  await expect(prof.getByText(/não cabem numa mesma categoria/)).toBeVisible();
  await expect(prof.getByRole("button", { name: "Inscrever equipe" })).toBeDisabled();
  await prof.getByLabel("Ano escolar de Bruno").selectOption("4");
  await expect(prof.getByText("Categoria da equipe: 4º e 5º ano")).toBeVisible();
  await prof.getByRole("button", { name: "Inscrever equipe" }).click();
  await prof.waitForURL(/\/equipes\//);
  await expect(prof.getByText(/As entregas abrem em/)).toBeVisible(); // ainda não abriu
  await expect(prof.getByText("Categoria 4º e 5º ano")).toBeVisible();
  await expect(prof.getByText("Ana (5º ano)", { exact: false })).toBeVisible();

  // ── entregas abertas: Ana envia
  await shiftJam(jamId, "EM_ANDAMENTO");
  const ana = await newPage(browser);
  await loginStudent(ana, "ana");
  await ana.goto(`${ESCOLA}/jams`);
  await ana.getByRole("article").filter({ hasText: title }).getByRole("link", { name: "Ver jam" }).click();
  await ana.waitForURL(new RegExp(`/jams/jam-teste-${run}$`));
  await ana.getByRole("link", { name: "Entregar" }).click();

  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.setAuthor("Ana - Colégio Aurora");
  await ana.getByLabel("Nome do jogo").fill("Gato Invertido");
  await ana.getByLabel("Descrição breve").fill("Um gato que anda no teto. Feito no Colégio Aurora!");
  await ana.getByLabel("Link do vídeo no YouTube").fill("https://youtu.be/dQw4w9WgXcQ");
  await ana.getByLabel(/^Projeto/).setInputFiles({ name: "meu jogo da escola.sb3", mimeType: "application/octet-stream", buffer: Buffer.from(await sb3Bytes({ sprites: [{ name: "Gato" }] })) });
  await ana.getByLabel(/^Documentação/).setInputFiles({ name: "doc Colegio Aurora.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()) });
  await ana.getByRole("button", { name: "Enviar entrega" }).click();
  await expect(ana.getByRole("status")).toContainText("Entrega salva");
  await expect(ana.locator("p[role=alert]")).toContainText("Colégio Aurora"); // aviso de nome que revela a origem

  // corrige a descrição (arquivos ficam os mesmos)
  await ana.getByLabel("Descrição breve").fill("Um gato que anda no teto e pega estrelas.");
  await ana.getByRole("button", { name: "Atualizar entrega" }).click();
  await expect(ana.getByRole("status")).toContainText("Entrega salva");
  await ana.reload();
  const code = (await ana.getByText(/Código anônimo [2-9A-Z]{4}/).innerText()).match(/[2-9A-Z]{4}$/)![0];

  // a equipe baixa o próprio projeto já com nome anônimo
  const disp = await ana.evaluate(async (u) => (await fetch(u)).headers.get("content-disposition"), (await ana.getByRole("link", { name: /Projeto \(\.sb3\)/ }).getAttribute("href"))!);
  expect(disp).toBe(`attachment; filename="projeto-${code}.sb3"`);

  // ── julgamento
  await shiftJam(jamId, "JULGAMENTO");
  await ana.reload();
  await expect(ana.getByText("O prazo de entrega terminou.")).toBeVisible();

  const judge = await newPage(browser);
  await loginStaff(judge, ROOT, judgeEmail, password);
  await judge.goto(`${ROOT}/jurado/${jamId}`);
  await judge.getByRole("link", { name: new RegExp(`Projeto ${code}`) }).click();
  await expect(judge.getByRole("heading", { name: "Gato Invertido" })).toBeVisible();
  await expect(judge.getByText(/Tema da jam: .* · Categoria 4º e 5º ano/)).toBeVisible();

  // nada na página do jurado revela a origem
  const html = await judge.content();
  for (const secret of ["Aurora", "Campinas", team, "Bruno", "5º ano A", "meu jogo da escola", "Colegio"]) expect(html).not.toContain(secret);

  const docDisp = await judge.evaluate(async (u) => {
    const r = await fetch(u);
    return { disp: r.headers.get("content-disposition"), body: await r.text() };
  }, `/jams/arquivo/${(await judge.getByRole("link", { name: /Baixar documentacao/ }).getAttribute("href"))!.split("/jams/arquivo/")[1]}`);
  expect(docDisp.disp).toBe(`attachment; filename="documentacao-${code}.pdf"`);
  expect(docDisp.body).not.toContain("Aurora"); // autor apagado do PDF

  for (const c of ["Criatividade", "Uso do tema", "Jogabilidade", "Programação", "Documentação"]) {
    await judge.getByLabel(new RegExp(`Nota para ${c}`)).fill("8");
  }
  await judge.getByLabel(/Comentário para a equipe/).fill("Adorei o gato no teto!");
  await judge.getByRole("button", { name: "Salvar avaliação" }).click();
  await expect(judge.getByRole("status")).toContainText("Avaliação salva");

  // o professor jurado da mesma escola não vê a entrega
  await prof.goto(`${ESCOLA}/jurado/${jamId}`);
  await expect(prof.getByText(/da sua própria escola não aparecem/)).toBeVisible();
  await expect(prof.getByRole("link", { name: new RegExp(`Projeto ${code}`) })).toHaveCount(0);
  const blocked = await prof.evaluate(async (u) => {
    const r = await fetch(u);
    return { status: r.status, body: await r.text() };
  }, `/jurado/${jamId}/${code}`);
  expect(blocked.status).toBe(404);
  expect(blocked.body).not.toContain("Gato Invertido"); // o conteúdo da entrega nunca aparece

  // ── resultado: origem revelada, prêmio e comentário para a equipe
  await shiftJam(jamId, "ENCERRADA");
  await ana.goto(`${ESCOLA}/jams`);
  await ana.getByRole("article").filter({ hasText: title }).getByRole("link", { name: "Ver jam" }).click();
  await ana.waitForURL(new RegExp(`/jams/jam-teste-${run}$`));
  await expect(ana.getByRole("heading", { name: "Categoria 4º e 5º ano" })).toBeVisible();
  const mine = ana.getByRole("listitem").filter({ hasText: "Gato Invertido" });
  await expect(mine).toContainText("1º");
  await expect(mine).toContainText(team);
  await expect(mine).toContainText("Colégio Aurora");
  await expect(mine).toContainText("Kit de robótica para a escola");
  await expect(mine).toContainText("Adorei o gato no teto!");

  // limpeza: a jam de teste não deve aparecer para as contas de demonstração
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(`delete from "GameJam" where id = $1`, [jamId]);
  await db.end();
});

test("só a organização cria jams", async ({ page }) => {
  await loginStaff(page, ESCOLA, "prof@aurora.dev", "senha123");
  await page.goto(`${ESCOLA}/jams`);
  await expect(page.getByRole("link", { name: "Criar jam" })).toHaveCount(0);
  await page.goto(`${ESCOLA}/jams/nova`);
  await expect(page).toHaveURL(/\/jams$/);
});

test("painel do administrador mostra as game jams e cria uma nova", async ({ page }) => {
  await loginStaff(page, ROOT, "admin@blocos.dev", "admin123");
  await page.goto(`${ROOT}/plataforma`);
  await expect(page.getByRole("heading", { name: "Game Jams" })).toBeVisible();
  await page.getByRole("link", { name: "Criar game jam" }).click();
  await expect(page).toHaveURL(/\/jams\/nova$/);
  await expect(page.getByText("Categorias por ano escolar")).toBeVisible();
  await expect(page.getByLabel("Categoria 4: ano final")).toHaveValue("9");
});
