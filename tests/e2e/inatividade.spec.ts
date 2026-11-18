import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

const ESCOLA = "http://escola-demo.localhost:3000";
const run = Date.now().toString(36);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

test("1 ano sem uso: avisa o professor, o link mantém o aluno e o inativo é apagado", async ({ page, request }) => {
  // dois alunos novos na turma ROBO42 (prof@aurora.dev): um perto de 1 ano sem uso, outro com mais de 1 ano
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows: [cls] } = await db.query(`select c.id, c."organizationId" from "Class" c where c.code = 'ROBO42'`);
  const make = async (name: string, last: Date) => {
    const { rows: [u] } = await db.query(
      `insert into "User" (id, role, name, username, "passwordHash", "organizationId", "createdAt", "lastLoginAt")
       values (gen_random_uuid()::text, 'STUDENT', $1, $1, 'x', $2, $3, $3) returning id`,
      [name, cls.organizationId, last],
    );
    await db.query(`insert into "Enrollment" (id, "classId", "userId") values (gen_random_uuid()::text, $1, $2)`, [cls.id, u.id]);
    return u.id as string;
  };
  const avisado = await make(`aviso${run}`, daysAgo(340));
  const sumido = await make(`sumido${run}`, daysAgo(400));

  // sem o segredo, a tarefa não roda
  expect((await request.get(`http://localhost:3000/api/cron/inatividade`)).status()).toBe(401);
  const since = Date.now();
  const res = await request.get(`http://localhost:3000/api/cron/inatividade`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(res.status()).toBe(200);

  // o inativo há mais de 1 ano foi apagado; o outro continua e foi avisado
  const left = await db.query(`select id, "inactivityNoticeAt" from "User" where id = any($1)`, [[avisado, sumido]]);
  expect(left.rows.map((r) => r.id)).toEqual([avisado]);
  expect(left.rows[0].inactivityNoticeAt).not.toBeNull();

  // email ao professor da turma com o nome do aluno e o link
  const dir = path.resolve(".data/outbox");
  const files = (await readdir(dir)).filter((f) => Number(f.split("-")[0]) >= since);
  const mails = await Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8"))));
  const mail = mails.find((m) => m.to === "prof@aurora.dev" && m.text.includes(`aviso${run}`));
  expect(mail).toBeTruthy();
  expect(mail.text).not.toContain(`sumido${run}`);
  const link = mail.text.match(/https?:\/\/\S+\/manter-ativo\?t=[\w.-]+/)![0];

  // rodar de novo não repete o aviso
  await request.get(`http://localhost:3000/api/cron/inatividade`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const again = (await readdir(dir)).filter((f) => !files.includes(f) && Number(f.split("-")[0]) >= since);
  const repeated = await Promise.all(again.map(async (f) => (await readFile(path.join(dir, f), "utf8")).includes(`aviso${run}`)));
  expect(repeated.some(Boolean)).toBe(false);

  // abrir o link não muda nada; só o botão mantém a conta
  await page.goto(link);
  await expect(page.getByText(`aviso${run}`)).toBeVisible();
  expect((await db.query(`select "keptActiveAt" from "User" where id = $1`, [avisado])).rows[0].keptActiveAt).toBeNull();
  await page.getByRole("button", { name: "Manter ativas" }).click();
  await expect(page.getByRole("heading", { name: "Pronto!" })).toBeVisible(); // a contagem pode incluir aluno de execução anterior
  const kept = (await db.query(`select "keptActiveAt", "inactivityNoticeAt" from "User" where id = $1`, [avisado])).rows[0];
  expect(kept.keptActiveAt).not.toBeNull();
  expect(kept.inactivityNoticeAt).toBeNull();

  // link adulterado não funciona
  await page.goto(`${ESCOLA}/manter-ativo?t=${link.split("t=")[1].replace(/.$/, "x")}`);
  await expect(page.getByText("Link inválido ou vencido")).toBeVisible();

  await db.query(`delete from "User" where id = $1`, [avisado]);
  await db.end();
});
