import "dotenv/config";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

const ESCOLA = "http://escola-demo.localhost:3000";

async function setStatus(status: "TRIAL" | "ACTIVE") {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const r = await db.query(`update "Subscription" s set status = $1 from "Organization" o where o.id = s."organizationId" and o.slug = 'escola-demo' returning (select status from "Subscription" where id = s.id) as old`, [status]);
  await db.end();
  return r.rowCount;
}

test("teste grátis: aluno só abre o nível Básico; com acesso completo abre tudo; editor livre funciona", async ({ page }) => {
  await setStatus("TRIAL");
  try {
    await page.goto(`${ESCOLA}/entrar-aluno`);
    await page.getByLabel("Código da turma").fill("ROBO42");
    await page.getByLabel("Seu usuário").fill("bruno");
    await page.getByLabel("Sua senha").fill("gato123");
    await page.getByRole("button", { name: /Vamos lá/ }).click();
    await page.waitForURL(/\/aluno/);
    await expect(page.getByText(/Disponível no acesso completo/).first()).toBeVisible();
    await expect(page.getByText("Acesso completo", { exact: true }).first()).toBeVisible();

    // editor livre: todos os blocos, sem missão, com download do .sb3
    await page.getByRole("link", { name: "Editor livre" }).first().click();
    await page.waitForURL(/\/editor-livre$/);
    await expect(page.frameLocator("iframe[title='Editor de blocos']").locator("canvas").first()).toBeVisible({ timeout: 30_000 });
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Baixar projeto/ }).click()]);
    expect(download.suggestedFilename()).toBe("meu-projeto.sb3");
  } finally {
    await setStatus("ACTIVE");
  }
  await page.goto(`${ESCOLA}/aluno`);
  await expect(page.getByText(/Disponível no acesso completo/)).toHaveCount(0);
});
