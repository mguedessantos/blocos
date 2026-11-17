import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { changeX, project, whenKey } from "../../src/lib/blocks/build";

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
// só o visível: o Next guarda a lição anterior escondida (para o voltar), com o editor dela
const editorFrame = (page: Page) => page.locator("iframe[title='Editor de blocos']").filter({ visible: true }).first().contentFrame();
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

/**
 * Abre uma lição oficial pelo slug, como o aluno. As lições anteriores da mesma trilha ficam concluídas direto no banco:
 * estes testes são sobre o editor, não sobre a ordem do currículo (essa é coberta em "aluno faz a trilha").
 */
async function openLesson(page: Page, username: string, slug: string) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows } = await db.query(
    `select l.id, l.slug, u.id student from "Lesson" l
       join "Module" m on m.id = l."moduleId" join "Track" t on t.id = m."trackId"
       join "User" u on u.username = $1 and u."organizationId" = (select id from "Organization" where slug = 'escola-demo')
     where t."organizationId" is null and t.published and not l.draft
       and t.id = (select m2."trackId" from "Lesson" l2 join "Module" m2 on m2.id = l2."moduleId" join "Track" t2 on t2.id = m2."trackId"
                   where l2.slug = $2 and not l2.draft and t2."organizationId" is null and t2.published limit 1)
     order by m."order", l."order"`,
    [username, slug],
  );
  const target = rows.findIndex((r) => r.slug === slug);
  for (const r of rows.slice(0, target)) {
    await db.query(
      `insert into "Progress" (id, "userId", "lessonId", status, stars, attempts, "updatedAt") values (gen_random_uuid()::text, $1, $2, 'CONCLUIDO', 3, 1, now())
       on conflict ("userId", "lessonId") do update set status = 'CONCLUIDO'`,
      [r.student, r.id],
    );
  }
  await db.end();
  await page.goto(`${ESCOLA}/aluno/licoes/${rows[target].id}`);
}

/** Verifica no site e espera o resultado (o Verificar só libera depois de rodar o programa). */
async function runAndVerify(page: Page) {
  await greenFlag(page).click();
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
}

test("aluno faz a trilha no site: teorias, ator, cenário, erra, acerta, ganha XP e libera a próxima", async ({ page, browser }) => {
  test.setTimeout(120_000); // fluxo longo; sob carga do conjunto completo passa de 60 s
  const cred = await teacherCreatesStudent(page, `Trilha ${run}`, "Iara", "Introdução à Programação de Blocos");

  const ctx = await browser.newContext();
  const kid = await ctx.newPage();
  await loginStudent(kid, cred.code, cred.username, cred.password);
  await expect(kid.getByRole("heading", { name: "Introdução à Programação de Blocos" })).toBeVisible();
  await expect(kid.getByText(/0 de 17 lições/)).toBeVisible();

  // teorias: "Entendi" leva à próxima lição
  await kid.getByRole("link", { name: "Ver trilha Mundo 1 · Vila do Palco" }).click();
  await expect(kid.getByLabel("Um novo ator (trancada)")).toBeVisible();
  await kid.getByRole("link", { name: /A Grande Pane/ }).click();
  for (const next of ["Conheça o Bloquinho", "Conheça o editor", "Um novo ator"]) {
    await kid.getByRole("button", { name: /Entendi/ }).click();
    await expect(kid.getByRole("heading", { level: 1, name: next })).toBeVisible();
  }

  // colocar um ator e um cenário pelos botões da biblioteca, como o texto da missão ensina
  const result = kid.getByRole("status", { name: "Resultado da verificação" });
  const ed = editorFrame(kid);
  await editorReady(kid);
  await ed.locator('[class*="sprite-selector"] [class*="action-menu_main-button"]').first().click();
  await ed.getByText("Estrela", { exact: true }).first().click();
  await expect(ed.locator('[class*="sprite-selector-item_sprite-name"]', { hasText: "Estrela" })).toBeVisible();
  await runAndVerify(kid);
  await expect(result).toContainText("Perfeito");
  await kid.getByRole("link", { name: "Próxima lição" }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Um novo cenário" })).toBeVisible();

  await editorReady(kid);
  await ed.locator('[class*="stage-selector"] [class*="action-menu_main-button"]').first().click();
  await ed.getByText("Floresta", { exact: true }).first().click();
  await runAndVerify(kid);
  await expect(result).toContainText("Perfeito");
  await kid.getByRole("link", { name: "Próxima lição" }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Ande 100 passos" })).toBeVisible();

  // programa errado → sem estrelas e dica amigável
  await openWithProgram(kid, program(move(10)));
  await runAndVerify(kid);
  await expect(result).toContainText("Quase lá");
  await expect(result).toContainText("x: 100");

  // programa certo → 3 estrelas, XP e botão para a próxima
  await openWithProgram(kid, program(move(100)));
  await runAndVerify(kid);
  await expect(result).toContainText("Perfeito");
  await expect(result.getByLabel("3 de 3 estrelas")).toBeVisible();
  await expect(kid.getByText("+10 XP!")).toBeVisible();
  await kid.getByRole("link", { name: "Próxima lição" }).click();
  await expect(kid.getByRole("heading", { level: 1, name: "Virando a esquina" })).toBeVisible();

  // 3 teorias (5 XP cada) + 3 exercícios (10 XP cada)
  await kid.goto(`${ESCOLA}/aluno`);
  await expect(kid.getByText(/6 de 17 lições/)).toBeVisible();
  await expect(kid.getByText("45 XP", { exact: true })).toBeVisible();
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
  await openLesson(page, "bruno", "primeiros-passos"); // "Ande 100 passos"
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
  await runAndVerify(page);
  await expect(page.getByRole("status", { name: "Resultado da verificação" })).toBeVisible();
  const lessonId = new URL(page.url()).pathname.split("/").pop();
  await expect.poll(() => page.evaluate(async (u) => (await fetch(u)).status, `/api/licoes/${lessonId}/projeto`)).toBe(200);
});

test("jogo no site: controlar o Bloquinho com o teclado e verificar", async ({ page }) => {
  await loginStudent(page, "ROBO42", "clara", "gato123");
  await openLesson(page, "clara", "glitch-para-a-direita"); // Mundo 4: "Fuja para a direita"
  await expect(page.getByRole("heading", { level: 1, name: "Fuja para a direita" })).toBeVisible();

  const game = project({ sprites: [{ name: "Bloquinho", code: [[whenKey("right arrow"), changeX(20)]] }] });
  await openWithProgram(page, game);
  await greenFlag(page).click();
  await editorFrame(page).locator('[class*="stage_stage"] canvas').first().click({ position: { x: 20, y: 20 } }); // o palco recebe o teclado
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await expect(spriteX(page)).toHaveValue("60");

  await runAndVerify(page);
  await expect(page.getByRole("status", { name: "Resultado da verificação" })).toContainText("Perfeito");
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
