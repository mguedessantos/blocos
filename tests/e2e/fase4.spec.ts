import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { changeX, flag, project, whenKey } from "../../src/lib/blocks/build";
import { sb3Bytes } from "../unit/sb3-builder";

const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);

const n = (v: number) => ({ shadow: { type: "math_number", fields: { NUM: v } } });
const program = (...body: object[]) => {
  const all: Record<string, unknown>[] = [{ type: "event_whenflagclicked", x: 220, y: 40 }, ...body.map((b) => ({ ...b }))];
  for (let i = all.length - 2; i >= 0; i--) all[i].next = { block: all[i + 1] };
  return { blocks: { languageVersion: 0, blocks: [all[0]] } };
};
const move = (s: number) => ({ type: "motion_movesteps", inputs: { STEPS: n(s) } });

/** Coloca um programa no rascunho local da lição (o editor carrega o rascunho ao abrir). */
async function openWithProgram(page: Page, state: object) {
  const lessonId = new URL(page.url()).pathname.split("/").pop()!;
  await page.evaluate(async ([k, v]) => {
    localStorage.setItem(k, v);
    await new Promise((r) => { const req = indexedDB.deleteDatabase("blocos-rascunhos"); req.onsuccess = req.onerror = req.onblocked = r; });
    await fetch(`/api/licoes/${location.pathname.split("/").pop()}/projeto`, { method: "DELETE" }); // cópia do servidor
  }, [`blocos:licao:${lessonId}`, JSON.stringify(state)]);
  await page.reload();
  await editorReady(page);
}

/** O editor de blocos (iframe) abriu com o projeto. */
const editorFrame = (page: Page) => page.frameLocator("iframe[title='Editor de blocos']");
async function editorReady(page: Page) {
  await expect(editorFrame(page).locator(".blocklySvg").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Abrindo o editor de blocos")).toBeHidden({ timeout: 30_000 });
  await page.waitForTimeout(800); // a área de blocos termina de redesenhar o projeto recém-carregado
}
/** Posição x do ator selecionado, como aparece no painel do ator. */
const spriteX = (page: Page) => editorFrame(page).locator('[class*="sprite-info_sprite-info"] input').nth(1);
const greenFlag = (page: Page) => editorFrame(page).locator('[class*="green-flag_green-flag"]').first();

async function loginStudent(page: Page, code: string, user: string, pass: string) {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill(code);
  await page.getByLabel("Seu usuário").fill(user);
  await page.getByLabel("Sua senha").fill(pass);
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(`${ESCOLA}/aluno`);
}

async function teacherCreatesStudent(page: Page, className: string, studentName: string, world: string) {
  await page.goto(`${ESCOLA}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  await page.getByLabel("Nome da nova turma").fill(className);
  await page.getByRole("button", { name: "+ Criar turma" }).click();
  await expect(page.getByRole("heading", { name: className })).toBeVisible();
  await page.getByLabel(/Nomes dos alunos/).fill(studentName);
  await page.getByRole("button", { name: "Criar alunos e gerar senhas" }).click();
  const card = page.locator(".print-area > div", { hasText: `Oi, ${studentName}!` }).first();
  const cred = {
    code: await card.locator("dt:has-text('Turma') + dd").innerText(),
    username: await card.locator("dt:has-text('Usuário') + dd").innerText(),
    password: await card.locator("dt:has-text('Senha') + dd").innerText(),
  };
  const row = page.locator("li", { hasText: world });
  await expect(page.locator("li", { hasText: "Arduino e PictoBlox" })).toContainText("Em breve");
  await row.getByRole("button", { name: "Liberar curso" }).click();
  await expect(row.getByRole("button", { name: /Liberado/ })).toBeVisible();
  return cred;
}

/** Abre a 1ª lição de exercício do Mundo 1 (“Ande 100 passos”), concluindo as teorias se preciso. */
async function openFirstExercise(page: Page) {
  await page.getByRole("link", { name: "Ver trilha Mundo 1 · Vila do Palco" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Vila do Palco/ })).toBeVisible();
  if (await page.getByLabel("Ande 100 passos (trancada)").count()) {
    const conheca = page.getByRole("link", { name: /Conheça o Bloquinho/ });
    await ((await conheca.count()) ? conheca : page.getByRole("link", { name: /A Grande Pane/ })).click();
    const heading = page.getByRole("heading", { level: 1 });
    while (!(await heading.innerText()).includes("Ande 100 passos")) {
      await page.getByRole("button", { name: /Entendi|Continuar/ }).click();
      await page.waitForLoadState("networkidle");
    }
    return;
  }
  await page.getByRole("link", { name: /Ande 100 passos/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ande 100 passos" })).toBeVisible();
}

test("aluno faz a trilha no site: teoria, erra, acerta, ganha XP e libera a próxima", async ({ page, browser }) => {
  test.setTimeout(60_000); // fluxo longo; sob carga do conjunto completo passa de 30 s
  const cred = await teacherCreatesStudent(page, `Trilha ${run}`, "Iara", "Introdução à Programação de Blocos");

  const ctx = await browser.newContext();
  const kid = await ctx.newPage();
  await loginStudent(kid, cred.code, cred.username, cred.password);
  await expect(kid.getByRole("heading", { name: "PictoBlox e Introdução à Programação de Blocos" })).toBeVisible();
  await expect(kid.getByText(/0 de 8 lições · \+2 extras/)).toBeVisible();

  await kid.getByRole("link", { name: "Ver trilha Mundo 1 · Vila do Palco" }).click();
  await expect(kid.getByLabel("Ande 100 passos (trancada)")).toBeVisible();
  await kid.getByRole("link", { name: /A Grande Pane/ }).click();
  await kid.getByRole("button", { name: /Entendi/ }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Conheça o Bloquinho" })).toBeVisible();
  await kid.getByRole("button", { name: /Entendi/ }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Ande 100 passos" })).toBeVisible();

  // programa errado → sem estrelas e dica amigável
  const result = kid.getByRole("status", { name: "Resultado da verificação" });
  await openWithProgram(kid, program(move(10)));
  await kid.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(result).toContainText("Quase lá");
  await expect(result).toContainText("x: 100");

  // programa certo → 3 estrelas, XP e botão para a próxima
  await openWithProgram(kid, program(move(100)));
  await kid.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(result).toContainText("Perfeito");
  await expect(result.getByLabel("3 de 3 estrelas")).toBeVisible();
  await expect(kid.getByText("+10 XP!")).toBeVisible();
  await kid.getByRole("link", { name: "Próxima lição" }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Virando a esquina" })).toBeVisible();

  await kid.goto(`${ESCOLA}/aluno`);
  await expect(kid.getByText(/3 de 8 lições/)).toBeVisible();
  await expect(kid.getByText("20 XP", { exact: true })).toBeVisible();
  await ctx.close();
});

test("lição inexistente ou fora das trilhas do aluno dá 404", async ({ page }) => {
  await loginStudent(page, "ROBO42", "ana", "gato123");
  await page.goto(`${ESCOLA}/aluno/licoes/nao-existe`);
  await expect(page.getByText(/could not be found|não encontrad/i)).toBeVisible();
});

test("arrastar um bloco de verdade e clicar na bandeira move o personagem", async ({ page }) => {
  test.setTimeout(60_000);
  await loginStudent(page, "ROBO42", "bruno", "gato123");
  await openFirstExercise(page);
  await editorReady(page);
  // o projeto salvo pode ter blocos de execuções anteriores: volta ao inicial
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Recomeçar" }).click();
  await editorReady(page);

  const ed = editorFrame(page);
  const hat = ed.locator(".blocklyBlockCanvas .blocklyDraggable", { hasText: "quando" }).first();
  await expect(hat).toBeVisible();
  // a paleta só mostra os blocos liberados na lição
  await expect(ed.locator(".blocklyFlyout .blocklyDraggable", { hasText: "mude x para" })).toHaveCount(0);
  const src = ed.locator(".blocklyFlyout .blocklyDraggable", { hasText: "mova" }).first();
  await expect(src).toBeVisible();
  // arrasta até encaixar embaixo da bandeira (sob carga o editor pode perder o primeiro arraste)
  await expect(async () => {
    const sb = (await src.boundingBox())!;
    const hb = (await hat.boundingBox())!;
    await page.mouse.move(sb.x + 8, sb.y + 8);
    await page.mouse.down();
    await page.mouse.move(hb.x + 10, hb.y + hb.height + 6, { steps: 15 });
    await page.mouse.up();
    await expect(hat).toContainText("mova", { timeout: 1500 });
  }).toPass({ timeout: 20_000 });

  await greenFlag(page).click();
  await expect(spriteX(page)).toHaveValue("10");

  // ao verificar, o projeto completo (.sb3) fica guardado no servidor para abrir em outro computador
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(page.getByRole("status", { name: "Resultado da verificação" })).toBeVisible();
  const lessonId = new URL(page.url()).pathname.split("/").pop();
  await expect.poll(() => page.evaluate(async (u) => (await fetch(u)).status, `/api/licoes/${lessonId}/projeto`)).toBe(200);
});

test("jogo no site: controlar o Bloquinho com o teclado e verificar", async ({ page }) => {
  await loginStudent(page, "ROBO42", "clara", "gato123");
  await page.getByRole("link", { name: "Ver trilha Mundo 5 · Cidade dos Comandos" }).click();
  const setas = page.getByRole("link", { name: /Setas do teclado/ });
  if (!(await setas.isVisible())) {
    await page.getByRole("link", { name: /Quem começa o código/ }).click();
    await page.getByRole("button", { name: /Entendi|Continuar/ }).click();
  } else {
    await setas.click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Setas do teclado" })).toBeVisible();

  const game = project({ sprites: [{ name: "Bloquinho", code: [[whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)], [flag()]] }] });
  await openWithProgram(page, game);
  await greenFlag(page).click();
  await editorFrame(page).locator('[class*="stage_stage"] canvas').first().click({ position: { x: 20, y: 20 } }); // o palco recebe o teclado
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await expect(spriteX(page)).toHaveValue("30");

  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(page.getByRole("status", { name: "Resultado da verificação" })).toContainText("Perfeito");
});

test("missão opcional no PictoBlox: envio do .sb3 errado e depois certo", async ({ page, browser }) => {
  const cred = await teacherCreatesStudent(page, `PictoBlox ${run}`, "Caio", "Introdução à Programação de Blocos");
  // o aluno já terminou as lições obrigatórias do Mundo 1 (a missão opcional fica no fim)
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(
    `INSERT INTO "Progress" (id, "userId", "lessonId", status, stars, attempts, "updatedAt")
     SELECT 'p' || l.id || u.id, u.id, l.id, 'CONCLUIDO', 3, 1, now()
     FROM "Lesson" l JOIN "Module" m ON m.id = l."moduleId" JOIN "Track" t ON t.id = m."trackId",
          "User" u JOIN "Enrollment" e ON e."userId" = u.id JOIN "Class" c ON c.id = e."classId"
     WHERE t.slug = 'mundo-1-vila-do-palco' AND l.optional = false AND l.draft = false AND c.code = $1`,
    [cred.code],
  );
  await db.end();

  const ctx = await browser.newContext();
  const kid = await ctx.newPage();
  await loginStudent(kid, cred.code, cred.username, cred.password);
  await kid.getByRole("link", { name: "Ver trilha Mundo 1 · Vila do Palco" }).click();
  await kid.getByRole("link", { name: /Olá, mundo! no PictoBlox/ }).click();
  await expect(kid.getByText("Extra opcional").first()).toBeVisible();

  const result = kid.getByRole("status", { name: "Resultado da verificação" });
  const upload = async (buffer: Buffer, name = "ola.sb3") => {
    await kid.getByLabel("Arquivo .sb3 do projeto").setInputFiles({ name, mimeType: "application/octet-stream", buffer });
    await kid.getByRole("button", { name: "Verificar projeto" }).click();
  };
  // projeto sem a fala → não passa
  await upload(Buffer.from(await sb3Bytes({ sprites: [{ scripts: [["event_whenflagclicked", "motion_movesteps"]] }] })));
  await expect(result).toContainText("diga");
  // arquivo que não é .sb3 de verdade → erro amigável
  await upload(Buffer.from("isso não é um zip"), "falso.sb3");
  await expect(kid.getByRole("alert").filter({ hasText: "não parece um projeto .sb3" })).toBeVisible();
  // projeto certo → 3 estrelas
  await upload(Buffer.from(await sb3Bytes({ sprites: [{ scripts: [["event_whenflagclicked", "motion_movesteps", { op: "looks_sayforsecs", inputs: { MESSAGE: "Olá, mundo!", SECS: 2 } }]] }] })));
  await expect(result).toContainText("Perfeito");
  await expect(result.getByLabel("3 de 3 estrelas")).toBeVisible();
  await ctx.close();
});

test("professor vê o currículo com o guia do professor; aluno não", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  await page.getByRole("link", { name: "Mundos e aulas" }).first().click();
  await expect(page.getByRole("heading", { name: "Nível Básico" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nível Avançado" })).toBeVisible();
  await page.getByRole("link", { name: /Grande Torneio/ }).click();
  await page.getByText("Projeto final: o jogo da equipe", { exact: true }).click();
  await expect(page.getByText("Guia do professor").filter({ visible: true })).toBeVisible();
  await expect(page.getByText(/Anuncie o tema e o tempo total/)).toBeVisible();

  await page.context().clearCookies();
  await loginStudent(page, "ROBO42", "ana", "gato123");
  await page.goto(`${ESCOLA}/professor/trilhas`);
  await expect(page).toHaveURL(`${ESCOLA}/sem-acesso`);
});
