import "server-only";
import { db } from "../db";
import { emailBrandFor, sendEmail } from "../email";
import { createKeepToken, lastActivity, noticeDue, readKeepToken, removalDate, shouldRemove } from "../retention";
import { deleteFile } from "../storage";
import { tenantUrl } from "../url";

// Tarefa diária (rota /api/cron/inatividade): avisa os professores e apaga de vez quem está 1 ano sem uso.

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurado.");
  return s;
};
const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(d);

type Person = Awaited<ReturnType<typeof loadPeople>>[number];

// shortcut: carrega todas as contas de uma vez; paginar se passar de ~50 mil usuários.
function loadPeople() {
  return db.user.findMany({
    where: { organizationId: { not: null }, deletedAt: null, role: { in: ["STUDENT", "TEACHER", "ORG_ADMIN"] } },
    select: {
      id: true, role: true, name: true, email: true, organizationId: true, active: true,
      createdAt: true, lastLoginAt: true, keptActiveAt: true, inactivityNoticeAt: true,
      enrollments: { select: { class: { select: { teacherId: true } } } },
      _count: { select: { teachingClasses: true } },
    },
  });
}

export async function runInactivityJob(now = new Date()) {
  const people = await loadPeople();
  const byId = new Map(people.map((p) => [p.id, p]));
  const staffOf = (orgId: string) => people.filter((p) => p.organizationId === orgId && p.role !== "STUDENT" && p.email);

  const removed: string[] = [];
  const noticed: string[] = [];
  // professor → alunos a avisar
  const studentsByTeacher = new Map<string, Person[]>();

  for (const p of people) {
    const last = lastActivity(p);
    if (shouldRemove(last, now)) {
      if (await removePerson(p, people, now)) removed.push(p.id);
      continue;
    }
    if (!noticeDue(last, p.inactivityNoticeAt, now)) continue;
    if (p.role === "STUDENT") {
      // avisa os professores das turmas do aluno; sem turma, a coordenação da escola
      const teachers = [...new Set(p.enrollments.map((e) => e.class.teacherId))].map((id) => byId.get(id)).filter((t) => t?.email);
      const to = teachers.length ? teachers : staffOf(p.organizationId!).filter((s) => s.role === "ORG_ADMIN");
      for (const t of to) studentsByTeacher.set(t!.id, [...(studentsByTeacher.get(t!.id) ?? []), p]);
    } else {
      await noticeStaff(p, staffOf(p.organizationId!).filter((s) => s.role === "ORG_ADMIN" && s.id !== p.id));
    }
    noticed.push(p.id);
  }

  for (const [teacherId, students] of studentsByTeacher) {
    await noticeStudents(byId.get(teacherId)!, students);
  }
  if (noticed.length) await db.user.updateMany({ where: { id: { in: noticed } }, data: { inactivityNoticeAt: now } });
  return { removed: removed.length, noticed: noticed.length, emails: studentsByTeacher.size };
}

async function orgLink(orgId: string) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId }, select: { slug: true } });
  return tenantUrl(org.slug);
}

async function noticeStudents(teacher: Person, students: Person[]) {
  const brand = await emailBrandFor(teacher.organizationId!);
  const when = new Date(Math.min(...students.map((s) => removalDate(lastActivity(s)).getTime())));
  const url = `${await orgLink(teacher.organizationId!)}/manter-ativo?t=${createKeepToken(students.map((s) => s.id), secret())}`;
  await sendEmail(teacher.email!, brand, {
    subject: `${students.length === 1 ? "1 aluno" : `${students.length} alunos`} sem acesso há quase 1 ano`,
    heading: "Alunos que serão removidos por falta de uso",
    paragraphs: [
      `Olá, ${teacher.name}. Para proteger os dados dos alunos, contas sem nenhum acesso por 1 ano são apagadas, com todo o progresso.`,
      `Estes alunos ainda não entraram e serão removidos a partir de ${fmt(when)}: ${students.map((s) => s.name).join(", ")}.`,
      "Se eles ainda vão usar a plataforma, clique no botão abaixo para mantê-los ativos por mais 1 ano.",
    ],
    button: { label: "Manter alunos ativos", url },
    footnote: "Se não fizer nada, as contas serão apagadas na data indicada. O link vale por 30 dias.",
  });
}

async function noticeStaff(person: Person, coordinators: Person[]) {
  if (!person.email) return;
  const brand = await emailBrandFor(person.organizationId!);
  const when = removalDate(lastActivity(person));
  const url = `${await orgLink(person.organizationId!)}/manter-ativo?t=${createKeepToken([person.id], secret())}`;
  const content = (forSelf: boolean) => ({
    subject: forSelf ? "Sua conta será removida por falta de uso" : `A conta de ${person.name} será removida por falta de uso`,
    heading: forSelf ? "Sua conta está sem acesso há quase 1 ano" : `${person.name} está sem acesso há quase 1 ano`,
    paragraphs: [
      `${forSelf ? "Sua conta" : `A conta de ${person.name}`} em ${brand.name} será apagada a partir de ${fmt(when)}, porque contas sem nenhum acesso por 1 ano são removidas.`,
      forSelf ? "Para continuar, basta entrar na plataforma ou clicar no botão abaixo." : "Se a pessoa ainda faz parte da equipe, clique no botão abaixo para manter a conta.",
    ],
    button: { label: forSelf ? "Manter minha conta ativa" : "Manter a conta ativa", url },
    footnote: "O link vale por 30 dias.",
  });
  await sendEmail(person.email, brand, content(true));
  for (const c of coordinators) await sendEmail(c.email!, brand, content(false));
}

/** Apaga de vez. Professor com turmas: passa as turmas a outra pessoa da equipe; se for a última, só sai se a escola toda estiver inativa. */
async function removePerson(p: Person, people: Person[], now: Date): Promise<boolean> {
  if (p.role !== "STUDENT") {
    const orgPeople = people.filter((o) => o.organizationId === p.organizationId);
    const heir = orgPeople.find((o) => o.id !== p.id && o.role !== "STUDENT" && o.active && !shouldRemove(lastActivity(o), now));
    if (!heir) {
      if (orgPeople.some((o) => !shouldRemove(lastActivity(o), now))) return false; // alunos ainda usam: mantém o professor
      await deleteProjectFiles(orgPeople.map((o) => o.id));
      await db.organization.delete({ where: { id: p.organizationId! } });
      await db.auditLog.create({ data: { action: "inatividade.remover-escola", target: p.organizationId! } });
      return true;
    }
    if (p._count.teachingClasses) await db.class.updateMany({ where: { teacherId: p.id }, data: { teacherId: heir.id } });
  }
  await deleteProjectFiles([p.id]);
  await db.user.delete({ where: { id: p.id } });
  await db.auditLog.create({ data: { organizationId: p.organizationId, action: "inatividade.remover", target: p.id, metadata: { role: p.role } } });
  return true;
}

/** Projetos salvos dos alunos no armazenamento privado (o banco apaga em cascata, os arquivos não). */
async function deleteProjectFiles(userIds: string[]) {
  const files = await db.progress.findMany({ where: { userId: { in: userIds }, projectKey: { not: null } }, select: { projectKey: true } });
  for (const f of files) await deleteFile(f.projectKey!).catch(() => undefined);
}

// ───────── Link do email ─────────

/** Nomes das contas do link (para a página de confirmação). null = link inválido ou vencido. */
export async function peekKeepToken(token: string) {
  const ids = readKeepToken(token, secret());
  if (!ids) return null;
  return db.user.findMany({ where: { id: { in: ids }, deletedAt: null }, select: { name: true }, orderBy: { name: "asc" } });
}

/** Mantém as contas ativas por mais 1 ano. Retorna quantas, ou null se o link é inválido. */
export async function keepActive(token: string) {
  const ids = readKeepToken(token, secret());
  if (!ids) return null;
  const res = await db.user.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { keptActiveAt: new Date(), inactivityNoticeAt: null } });
  await db.auditLog.create({ data: { action: "inatividade.manter", metadata: { count: res.count } } });
  return res.count;
}
