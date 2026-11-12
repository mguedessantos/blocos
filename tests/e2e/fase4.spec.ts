import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";

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
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [`blocos:licao:${lessonId}`, JSON.stringify(state)]);
  await page.reload();
  await expect(page.locator(".blocklySvg").first()).toBeVisible();
}

test("aluno faz a trilha: teoria, erra, acerta, ganha XP e libera a próxima", async ({ page, browser }) => {
  // professor cria turma, um aluno e libera a trilha
  await page.goto(`${ESCOLA}/entrar`);
  await page.getByLabel("Email").fill("prof@aurora.dev");
  await page.getByLabel("Senha").fill("senha123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  await page.getByLabel("Nome da nova turma").fill(`Trilha ${run}`);
  await page.getByRole("button", { name: "+ Criar turma" }).click();
  await expect(page.getByRole("heading", { name: `Trilha ${run}` })).toBeVisible();
  await page.getByLabel(/Nomes dos alunos/).fill("Iara");
  await page.getByRole("button", { name: "Criar alunos e gerar senhas" }).click();
  const card = page.locator(".print-area > div", { hasText: "Oi, Iara!" }).first();
  const cred = {
    code: await card.locator("dt:has-text('Turma') + dd").innerText(),
    username: await card.locator("dt:has-text('Usuário') + dd").innerText(),
    password: await card.locator("dt:has-text('Senha') + dd").innerText(),
  };
  const trackRow = page.locator("li", { hasText: "Primeiros Passos" });
  await trackRow.getByRole("button", { name: "Liberar para a turma" }).click();
  await expect(trackRow.getByRole("button", { name: /Liberada/ })).toBeVisible();

  // aluno
  const ctx = await browser.newContext();
  const kid = await ctx.newPage();
  await kid.goto(`${ESCOLA}/entrar-aluno`);
  await kid.getByLabel("Código da turma").fill(cred.code);
  await kid.getByLabel("Seu usuário").fill(cred.username);
  await kid.getByLabel("Sua senha").fill(cred.password);
  await kid.getByRole("button", { name: /Vamos lá/ }).click();
  await kid.waitForURL(`${ESCOLA}/aluno`);
  await expect(kid.getByText("0 de 5 lições")).toBeVisible();

  // a 2ª lição começa trancada
  await kid.getByRole("link", { name: "Ver trilha" }).click();
  await expect(kid.getByLabel("Ande 100 passos (trancada)")).toBeVisible();

  await kid.getByRole("link", { name: /Conheça o Bloquinho/ }).click();
  await kid.getByRole("button", { name: /Entendi/ }).click();
  await kid.waitForURL(/\/aluno\/licoes\//);
  await expect(kid.getByRole("heading", { name: "Ande 100 passos" })).toBeVisible();

  // programa errado → sem estrelas e dica amigável
  await openWithProgram(kid, program(move(10)));
  await kid.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(kid.getByRole("status", { name: "Resultado da verificação" })).toContainText("Quase lá");
  await expect(kid.getByRole("status", { name: "Resultado da verificação" })).toContainText("x: 100");

  // programa certo → 3 estrelas, XP e botão para a próxima
  await openWithProgram(kid, program(move(100)));
  await kid.getByRole("button", { name: "Verificar", exact: true }).click();
  await expect(kid.getByRole("status", { name: "Resultado da verificação" })).toContainText("Perfeito");
  await expect(kid.getByLabel("3 de 3 estrelas")).toBeVisible();
  await expect(kid.getByText("+10 XP!")).toBeVisible();
  await kid.getByRole("link", { name: "Próxima lição" }).click();
  await expect(kid.getByRole("heading", { name: "Virando a esquina" })).toBeVisible();

  await kid.goto(`${ESCOLA}/aluno`);
  await expect(kid.getByText("2 de 5 lições")).toBeVisible();
  await expect(kid.getByText("15 XP", { exact: true })).toBeVisible();
  await ctx.close();
});

test("lição inexistente ou fora das trilhas do aluno dá 404", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("ana");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(`${ESCOLA}/aluno`);
  await page.goto(`${ESCOLA}/aluno/licoes/nao-existe`);
  await expect(page.getByText(/could not be found|não encontrad/i)).toBeVisible();
});

test("arrastar um bloco de verdade e executar move o personagem", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("bruno");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(`${ESCOLA}/aluno`);
  await page.getByRole("link", { name: "Ver trilha" }).click();
  // garante a 1ª lição concluída para liberar a 2ª
  await expect(page.getByRole("link", { name: /Conheça o Bloquinho/ })).toBeVisible();
  const ande = page.getByRole("link", { name: /Ande 100 passos/ });
  if (await ande.isVisible()) {
    await ande.click();
  } else {
    await page.getByRole("link", { name: /Conheça o Bloquinho/ }).click();
    await page.getByRole("button", { name: /Entendi|Continuar/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Ande 100 passos" })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".blocklyBlockCanvas .blocklyDraggable", { hasText: "quando" }).first()).toBeVisible();

  await page.getByRole("treeitem", { name: "Movimento" }).click();
  const src = page.locator(".blocklyFlyout .blocklyDraggable").first();
  await expect(src).toBeVisible();
  const sb = (await src.boundingBox())!;
  const hat = (await page.locator(".blocklyBlockCanvas .blocklyDraggable", { hasText: "quando" }).first().boundingBox())!;
  await page.mouse.move(sb.x + 10, sb.y + 10);
  await page.mouse.down();
  await page.mouse.move(hat.x + 12, hat.y + hat.height + 12, { steps: 15 });
  await page.mouse.up();

  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await expect(page.getByRole("img", { name: /personagem em x 10, y 0/ })).toBeVisible();
});

test("fechar a categoria esconde a gaveta de blocos e a barra de rolagem", async ({ page }) => {
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill("bruno");
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(`${ESCOLA}/aluno`);
  await page.getByRole("link", { name: "Ver trilha" }).click();
  await page.getByRole("link", { name: /Ande 100 passos/ }).click();
  await expect(page.locator(".blocklyBlockCanvas .blocklyDraggable", { hasText: "quando" }).first()).toBeVisible();

  const cat = page.getByRole("treeitem", { name: "Movimento" });
  await cat.click();
  await expect(page.locator(".blocklyFlyout").first()).toBeVisible();
  await cat.click(); // fecha
  await expect(page.locator("svg.blocklyToolboxFlyout")).toBeHidden();
  await expect(page.locator(".blocklyFlyoutScrollbar[height]")).toBeHidden(); // barra da gaveta da caixa de blocos
  await page.screenshot({ path: "test-results/categoria-fechada.png", clip: { x: 0, y: 380, width: 900, height: 560 } });
});
