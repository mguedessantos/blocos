import { chromium } from "@playwright/test";
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  await p.goto("http://escola-demo.localhost:3000/entrar?perfil=equipe");
  await p.getByLabel("Email").fill("coord@aurora.dev");
  await p.getByLabel("Senha").fill("senha123");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  await p.screenshot({ path: `${out}/t-coord.png` });
  await p.goto("http://escola-demo.localhost:3000/professor/trilhas");
  await p.screenshot({ path: `${out}/t-mundos.png` });
  await p.locator('a[href^="/professor/trilhas/"]').first().click();
  await p.getByRole("link", { name: /Começar a aula/ }).click();
  await p.waitForURL(/\/professor\/licoes\//);
  for (let i = 0; i < 6 && !(await p.locator("iframe[title='Editor de blocos']").count()); i++) { await p.getByRole("link", { name: "Próxima lição" }).first().click(); await p.waitForTimeout(2500); }
  await p.getByText("Abrindo o editor").waitFor({ state: "hidden", timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Verificar" }).click();
  await p.getByRole("dialog").waitFor();
  console.log("resultado:", (await p.getByRole("dialog").innerText()).slice(0, 80).replace(/\n/g, " "));
  await p.keyboard.press("Escape");
  await p.screenshot({ path: `${out}/t-aula.png` });
  await b.close();
})();
