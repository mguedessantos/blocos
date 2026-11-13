// Capturas do manual (public/manual/<id>.png) a partir do site local com o seed de demonstração.
// Uso: `npm run dev` em outro terminal e depois `npm run manual:capturas`.
// Cria uma turma e uma jam de exemplo e apaga as duas no fim.
import "dotenv/config";
import { mkdirSync } from "node:fs";
import { chromium, type Browser, type Locator, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { Client } from "pg";
import { sb3Bytes } from "../tests/unit/sb3-builder";

const ROOT = "http://localhost:3000";
const ESCOLA = "http://escola-demo.localhost:3000";
const OUT = "public/manual";
const run = Date.now().toString(36);
const started = new Date();

const sql = async (q: string, params: unknown[] = []) => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    return (await db.query(q, params)).rows;
  } finally {
    await db.end();
  }
};

async function ctx(browser: Browser) {
  return (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
}

async function staff(browser: Browser, base: string, email: string, password: string) {
  const page = await ctx(browser);
  await page.goto(`${base}/entrar?perfil=equipe`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  return page;
}

async function student(browser: Browser, username: string) {
  const page = await ctx(browser);
  await page.goto(`${ESCOLA}/entrar-aluno`);
  await page.getByLabel("Código da turma").fill("ROBO42");
  await page.getByLabel("Seu usuário").fill(username);
  await page.getByLabel("Sua senha").fill("gato123");
  await page.getByRole("button", { name: /Vamos lá/ }).click();
  await page.waitForURL(/\/aluno/);
  return page;
}

/** Captura a tela; com `focus`, rola até o elemento e o contorna (o botão citado no passo). */
async function shot(page: Page, id: string, focus?: Locator) {
  await page.waitForLoadState("networkidle").catch(() => {});
  if (focus) {
    await focus.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await focus.evaluate((el) => { (el as HTMLElement).style.outline = "4px solid #ff5c8a"; (el as HTMLElement).style.outlineOffset = "3px"; });
  }
  // sem o botão de desenvolvimento do Next e com um quadro neutro no lugar do vídeo do YouTube
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(() => document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube"]').forEach((f) => {
    f.removeAttribute("src");
    f.srcdoc = '<body style="margin:0;display:grid;place-items:center;height:100vh;background:#1b1745;color:#fff;font:700 22px sans-serif">▶ Vídeo da equipe</body>';
  }));
  await page.waitForTimeout(400); // animações de entrada
  await page.screenshot({ path: `${OUT}/${id}.png` });
  if (focus) await focus.evaluate((el) => { (el as HTMLElement).style.outline = ""; });
  console.log("✓", id);
}

async function shiftJam(jamId: string, phase: "EM_ANDAMENTO" | "JULGAMENTO") {
  const h = (n: number) => `now() + interval '${n} hours'`;
  const [s, e, j] = phase === "EM_ANDAMENTO" ? [h(-1), h(48), h(96)] : [h(-48), h(-1), h(48)];
  await sql(`update "GameJam" set "startsAt" = ${s}, "endsAt" = ${e}, "judgingEndsAt" = ${j} where id = $1`, [jamId]);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let classId: string | null = null;
  let jamId: string | null = null;
  const judgeEmail = `jurado-manual-${run}@teste.dev`;
  try {
    // ── entrada
    const anon = await ctx(browser);
    await anon.goto(`${ESCOLA}/entrar`);
    await shot(anon, "login", anon.getByRole("button", { name: /Sou professor/ }));

    // ── professor
    const prof = await staff(browser, ESCOLA, "prof@aurora.dev", "senha123");
    await shot(prof, "prof-inicio");
    await prof.getByLabel("Nome da nova turma").fill("5º ano B");
    await prof.getByRole("button", { name: "+ Criar turma" }).click();
    await prof.getByRole("heading", { name: "5º ano B" }).waitFor();
    classId = prof.url().split("/").pop()!.split("?")[0];
    await shot(prof, "prof-turma");
    await prof.getByLabel(/Nomes dos alunos/).fill("Lia\nTomé\nDuda\nCaio");
    await prof.getByRole("button", { name: "Criar alunos e gerar senhas" }).click();
    await prof.getByRole("button", { name: /Imprimir cartões/ }).waitFor();
    await shot(prof, "prof-cartoes", prof.getByRole("button", { name: /Imprimir cartões/ }));
    await prof.reload();
    await shot(prof, "prof-cursos", prof.getByRole("button", { name: "Liberar curso" }).first());

    await prof.goto(`${ESCOLA}/professor/trilhas`);
    await shot(prof, "prof-curriculo");
    await prof.locator('a[href^="/professor/trilhas/"]').first().click();
    await prof.waitForURL(/\/professor\/trilhas\/.+/);
    await shot(prof, "prof-guia");

    const [robo] = await sql(`select id from "Class" where code = 'ROBO42'`);
    await prof.goto(`${ESCOLA}/professor/turmas/${robo.id}`);
    await shot(prof, "prof-progresso", prof.getByRole("heading", { name: /progresso/i }).first());

    // ── aluno
    const bruno = await student(browser, "bruno");
    await shot(bruno, "aluno-trilhas");
    // uma lição de exercício que o Bruno já fez (está liberada para ele)
    const [lesson] = await sql(
      `select l.id from "Lesson" l join "Progress" p on p."lessonId" = l.id join "User" u on u.id = p."userId"
       join "Module" m on m.id = l."moduleId"
       where u.username = 'bruno' and l.type = 'EXERCICIO' and l.mode = 'EDITOR' order by m."order", l."order" limit 1`,
    );
    await bruno.goto(`${ESCOLA}/aluno/licoes/${lesson.id}`);
    await bruno.frameLocator("iframe[title='Editor de blocos']").locator(".blocklySvg").first().waitFor({ timeout: 60_000 });
    await bruno.getByText("Abrindo o editor de blocos").waitFor({ state: "hidden", timeout: 60_000 });
    await bruno.waitForTimeout(1500);
    await shot(bruno, "aluno-licao");
    await bruno.getByRole("button", { name: /Como funciona/ }).first().click();
    await shot(bruno, "aluno-ajuda");
    await bruno.getByRole("button", { name: "Fechar ajuda dos blocos" }).click();
    await bruno.getByRole("button", { name: "Verificar" }).click();
    await bruno.getByRole("dialog").waitFor();
    await shot(bruno, "aluno-resultado");

    // ── coordenação
    const coord = await staff(browser, ESCOLA, "coord@aurora.dev", "senha123");
    await shot(coord, "coord-painel");
    await coord.goto(`${ESCOLA}/escola/equipe`);
    await shot(coord, "coord-equipe");
    await coord.goto(`${ESCOLA}/escola/marca`);
    await shot(coord, "coord-marca");

    // ── game jam de exemplo
    const owner = await staff(browser, ROOT, "admin@blocos.dev", "admin123");
    await owner.goto(`${ROOT}/jams/nova`);
    const title = "Jam de Primavera";
    await owner.getByLabel("Nome da jam").fill(title);
    await owner.getByLabel("Tema").fill("Mundo de cabeça para baixo");
    await owner.getByLabel(/^Regras e informações/).fill("Crie um jogo em equipe sobre o tema. Boa sorte!");
    await owner.getByLabel("Prêmio do 1º lugar").fill("Troféu e medalhas para a equipe");
    await owner.getByRole("button", { name: "Criar jam (como rascunho)" }).click();
    await owner.waitForURL(/\/jams\/gerenciar\//);
    jamId = owner.url().split("/").pop()!.split("?")[0];
    await owner.getByLabel("Nome do jurado").fill("Júlia Jurada");
    await owner.getByLabel("Email do jurado").fill(judgeEmail);
    await owner.getByRole("button", { name: "Adicionar jurado" }).click();
    const judgePassword = (await owner.locator("code").innerText()).trim();
    await owner.getByRole("button", { name: "Publicar jam" }).click();
    await owner.getByRole("button", { name: "Despublicar" }).waitFor();

    await prof.goto(`${ESCOLA}/jams`);
    await prof.getByRole("article").filter({ hasText: title }).getByRole("link", { name: "Ver jam" }).click();
    await prof.waitForURL(/\/jams\/[^/]+$/);
    await shot(prof, "jam-pagina");
    await prof.getByText("+ Inscrever nova equipe").click();
    await prof.getByLabel("Nome da equipe").fill("Os Pixels");
    await prof.getByRole("checkbox", { name: /Ana/ }).check();
    await prof.getByRole("checkbox", { name: /Bruno/ }).check();
    await prof.getByLabel("Ano escolar de Ana").selectOption("5");
    await prof.getByLabel("Ano escolar de Bruno").selectOption("4");
    await shot(prof, "jam-equipe", prof.getByRole("button", { name: "Inscrever equipe" }));
    await prof.getByRole("button", { name: "Inscrever equipe" }).click();
    await prof.waitForURL(/\/equipes\//);

    await shiftJam(jamId, "EM_ANDAMENTO");
    const ana = await student(browser, "ana");
    await ana.goto(`${ESCOLA}/jams`);
    await ana.getByRole("article").filter({ hasText: title }).getByRole("link", { name: "Ver jam" }).click();
    await ana.getByRole("link", { name: "Entregar" }).click();
    await ana.getByLabel("Nome do jogo").fill("Gato no Teto");
    await ana.getByLabel("Descrição breve").fill("Um gato que anda no teto e pega estrelas antes do tempo acabar.");
    await ana.getByLabel("Link do vídeo no YouTube").fill("https://youtu.be/dQw4w9WgXcQ");
    await ana.getByLabel(/^Projeto/).setInputFiles({ name: "gato.sb3", mimeType: "application/octet-stream", buffer: Buffer.from(await sb3Bytes({ sprites: [{ name: "Gato" }] })) });
    const doc = await PDFDocument.create();
    doc.addPage();
    await ana.getByLabel(/^Documentação/).setInputFiles({ name: "documentacao.pdf", mimeType: "application/pdf", buffer: Buffer.from(await doc.save()) });
    await ana.getByRole("button", { name: "Enviar entrega" }).click();
    await ana.getByRole("status").filter({ hasText: "Entrega salva" }).waitFor();
    await ana.reload();
    await shot(ana, "jam-entrega");

    await shiftJam(jamId, "JULGAMENTO");
    const judge = await staff(browser, ROOT, judgeEmail, judgePassword);
    // jurado novo entra com a senha padrão e cria a própria senha (também vira captura)
    await judge.waitForURL(/\/trocar-senha/);
    await shot(judge, "trocar-senha");
    await judge.getByLabel(/^Nova senha/).fill("jurada-senha-1");
    await judge.getByLabel("Repita a nova senha").fill("jurada-senha-1");
    await judge.getByRole("button", { name: "Salvar e continuar" }).click();
    await judge.waitForURL(/\/jurado/);
    await judge.goto(`${ROOT}/jurado/${jamId}`);
    await shot(judge, "jurado-lista");
    await judge.getByRole("link", { name: /Projeto [2-9A-Z]{4}/ }).first().click();
    await judge.getByRole("heading", { name: "Gato no Teto" }).waitFor();
    for (const label of await judge.getByLabel(/Nota para/).all()) await label.fill("8");
    await judge.getByLabel(/Comentário para a equipe/).fill("Adorei a ideia do gato no teto! Dica: mostre o placar na tela.");
    await shot(judge, "jurado-avaliar", judge.getByRole("button", { name: "Salvar avaliação" }));
  } finally {
    await browser.close();
    // limpeza: jam (apaga equipes, entregas e notas em cascata), jurado, turma e alunos criados aqui
    if (jamId) await sql(`delete from "GameJam" where id = $1`, [jamId]).catch((e) => console.error("limpeza jam:", e.message));
    await sql(`delete from "User" where email = $1`, [judgeEmail]).catch((e) => console.error("limpeza jurado:", e.message));
    if (classId) {
      await sql(`delete from "User" where role = 'STUDENT' and "createdAt" >= $1 and id in (select "userId" from "Enrollment" where "classId" = $2)`, [started, classId]).catch((e) => console.error("limpeza alunos:", e.message));
      await sql(`delete from "Class" where id = $1`, [classId]).catch((e) => console.error("limpeza turma:", e.message));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
