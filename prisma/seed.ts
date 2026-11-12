// Dados iniciais. Rode: npx prisma db seed
// - Sempre: planos, cursos/trilhas/lições oficiais e medalhas (idempotente, não apaga progresso).
// - Demonstração (contas de teste): só com SEED_DEMO diferente de "false". NUNCA em produção.
// - Dono da plataforma em produção: ADMIN_EMAIL + ADMIN_PASSWORD (+ ADMIN_NAME) criam a conta SUPER_ADMIN.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { OFFICIAL_COURSES } from "../content/cursos";
import { BADGES } from "../src/lib/gamification";
import { FLAG_STARTER, OFFICIAL_TRACKS, guideMarkdown } from "../content/trilhas";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);
  // SEED_DEMO: (vazio) = demonstração completa (dev/testes) · "minimal" = 1 conta de teste por papel · "false" = nenhuma
  const mode = process.env.SEED_DEMO ?? "full";
  const demo = mode !== "false" && mode !== "minimal";

  // Planos
  // Preços provisórios (centavos, BRL/mês). Ajuste aqui e rode `npm run stripe:setup`.
  const plans = [
    { id: "professor", name: "Professor", order: 1, orgType: "PROFESSOR_INDEPENDENTE" as const, priceCents: 4900, perSeat: false, minSeats: 1,
      description: "Para professores e tutores independentes.", maxStudents: 40, maxClasses: 3, features: [], aiMonthlyQuota: 0 },
    { id: "escola", name: "Escola", order: 2, orgType: "ESCOLA" as const, priceCents: 800, perSeat: true, minSeats: 30,
      description: "Professores ilimitados, cobrança por aluno.", maxStudents: null, maxClasses: null, features: ["unlimited_jams"], aiMonthlyQuota: 0 },
    { id: "escola_plus", name: "Escola+", order: 3, orgType: "ESCOLA" as const, priceCents: 1200, perSeat: true, minSeats: 30,
      description: "Tudo do Escola + marca própria, domínio próprio e certificados com a marca da escola.", maxStudents: null, maxClasses: null,
      features: ["white_label", "unlimited_jams"], aiMonthlyQuota: 0 },
  ];
  for (const p of plans) {
    // não sobrescreve o stripePriceId gravado pelo stripe:setup
    await db.plan.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // Dono da plataforma (produção): conta criada a partir das variáveis de ambiente.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.");
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    await db.user.upsert({
      where: { email },
      update: { role: "SUPER_ADMIN" },
      create: { role: "SUPER_ADMIN", name: process.env.ADMIN_NAME ?? "Dono da plataforma", email, passwordHash: await hash(process.env.ADMIN_PASSWORD) },
    });
    console.log(`Conta do dono: ${email}`);
  }

  let turma: { id: string } | null = null;

  // Produção: UMA conta de teste por papel numa escola de demonstração (senha em DEMO_PASSWORD).
  if (mode === "minimal") {
    const pw = process.env.DEMO_PASSWORD;
    if (!pw || pw.length < 10) throw new Error("SEED_DEMO=minimal precisa de DEMO_PASSWORD com pelo menos 10 caracteres.");
    const passwordHash = await hash(pw);
    const org = await db.organization.upsert({
      where: { slug: "demo" },
      update: {},
      create: {
        name: "Escola Demonstração", slug: "demo", type: "ESCOLA", city: "São Paulo", state: "SP",
        subscription: { create: { planId: "escola_plus", status: "ACTIVE", seats: 50, currentPeriodEnd: new Date(Date.now() + 3650 * DAY) } },
      },
    });
    const staff = [
      { role: "ORG_ADMIN" as const, name: "Coordenação Teste", email: "coordenacao@demo.blocos" },
      { role: "TEACHER" as const, name: "Professor Teste", email: "professor@demo.blocos" },
    ];
    const ids: Record<string, string> = {};
    for (const u of staff) {
      ids[u.role] = (await db.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash, organizationId: org.id } })).id;
    }
    turma = await db.class.upsert({ where: { code: "TESTE1" }, update: {}, create: { name: "Turma de Teste", code: "TESTE1", organizationId: org.id, teacherId: ids.TEACHER } });
    const aluno = await db.user.upsert({
      where: { organizationId_username: { organizationId: org.id, username: "aluno" } },
      update: {},
      create: { role: "STUDENT", name: "Aluno Teste", username: "aluno", passwordHash, organizationId: org.id },
    });
    await db.enrollment.upsert({ where: { classId_userId: { classId: turma.id, userId: aluno.id } }, update: {}, create: { classId: turma.id, userId: aluno.id } });
    console.log("Contas de teste: coordenacao@demo.blocos, professor@demo.blocos, aluno (turma TESTE1) — senha em DEMO_PASSWORD");
  }

  if (demo) {
    // Super admin
    await db.user.upsert({
      where: { email: "admin@blocos.dev" },
      update: {},
      create: { role: "SUPER_ADMIN", name: "Admin da Plataforma", email: "admin@blocos.dev", passwordHash: await hash("admin123") },
    });

    // Escola com white-label (Escola+)
    const escola = await db.organization.upsert({
      where: { slug: "escola-demo" },
      update: { city: "Campinas", state: "SP" },
      create: {
        city: "Campinas",
        state: "SP",
        name: "Colégio Aurora",
        slug: "escola-demo",
        type: "ESCOLA",
        branding: { create: { displayName: "Aurora Code", primaryColor: "#0f766e", secondaryColor: "#facc15", hidePlatformBrand: false } },
        subscription: { create: { planId: "escola_plus", status: "ACTIVE", seats: 300, currentPeriodEnd: new Date(Date.now() + 30 * DAY) } },
      },
    });

    const coord = await db.user.upsert({
      where: { email: "coord@aurora.dev" },
      update: {},
      create: { role: "ORG_ADMIN", name: "Carla Coordenadora", email: "coord@aurora.dev", passwordHash: await hash("senha123"), organizationId: escola.id },
    });
    const prof = await db.user.upsert({
      where: { email: "prof@aurora.dev" },
      update: {},
      create: { role: "TEACHER", name: "Paulo Professor", email: "prof@aurora.dev", passwordHash: await hash("senha123"), organizationId: escola.id },
    });
    void coord;

    turma = await db.class.upsert({
      where: { code: "ROBO42" },
      update: {},
      create: { name: "5º ano A", code: "ROBO42", organizationId: escola.id, teacherId: prof.id },
    });

    for (const [name, username] of [["Ana", "ana"], ["Bruno", "bruno"], ["Clara", "clara"]]) {
      const aluno = await db.user.upsert({
        where: { organizationId_username: { organizationId: escola.id, username } },
        update: {},
        create: { role: "STUDENT", name, username, passwordHash: await hash("gato123"), organizationId: escola.id },
      });
      await db.enrollment.upsert({
        where: { classId_userId: { classId: turma.id, userId: aluno.id } },
        update: {},
        create: { classId: turma.id, userId: aluno.id },
      });
    }

    // Professora independente (plano Professor, sem white-label — mesmo tendo branding salvo)
    const indep = await db.organization.upsert({
      where: { slug: "prof-marina" },
      update: { city: "Belo Horizonte", state: "MG" },
      create: {
        city: "Belo Horizonte",
        state: "MG",
        name: "Turmas da Marina",
        slug: "prof-marina",
        type: "PROFESSOR_INDEPENDENTE",
        branding: { create: { displayName: "Marina Kids", primaryColor: "#dc2626" } },
        subscription: { create: { planId: "professor", status: "TRIAL", trialEndsAt: new Date(Date.now() + 14 * DAY) } },
      },
    });
    const marina = await db.user.upsert({
      where: { email: "marina@prof.dev" },
      update: {},
      create: { role: "TEACHER", name: "Marina", email: "marina@prof.dev", passwordHash: await hash("senha123"), organizationId: indep.id },
    });
    await db.class.upsert({
      where: { code: "GATO77" },
      update: {},
      create: { name: "Turma de sábado", code: "GATO77", organizationId: indep.id, teacherId: marina.id },
    });

  }

  // Trilhas oficiais (conteúdo em content/trilhas). Idempotente: atualiza sem apagar progresso.
  // Trilhas oficiais que saíram do currículo ficam despublicadas (o progresso dos alunos é mantido).
  await db.track.updateMany({
    where: { organizationId: null, slug: { notIn: OFFICIAL_TRACKS.map((t) => t.slug) } },
    data: { published: false },
  });
  // Cursos oficiais: o professor libera o curso inteiro para a turma.
  const courseOf = new Map<string, string>();
  for (const c of OFFICIAL_COURSES) {
    const data = { title: c.title, description: c.description, order: c.order, published: true, comingSoon: c.comingSoon ?? false };
    const existing = await db.course.findFirst({ where: { organizationId: null, slug: c.slug } });
    const course = existing ? await db.course.update({ where: { id: existing.id }, data }) : await db.course.create({ data: { ...data, slug: c.slug } });
    for (const t of c.tracks) courseOf.set(t.slug, course.id);
    // Turma demo já começa com o curso liberado (cursos “em breve” não podem ser liberados)
    if (!c.comingSoon && turma) {
      await db.courseAssignment.upsert({
        where: { classId_courseId: { classId: turma.id, courseId: course.id } },
        update: {},
        create: { classId: turma.id, courseId: course.id },
      });
    }
  }

  for (const t of OFFICIAL_TRACKS) {
    const data = { title: t.title, description: t.description, story: t.story ?? null, level: t.level, order: t.order, published: true, courseId: courseOf.get(t.slug) ?? null };
    const existing = await db.track.findFirst({ where: { organizationId: null, slug: t.slug } });
    const track = existing
      ? await db.track.update({ where: { id: existing.id }, data })
      : await db.track.create({ data: { ...data, slug: t.slug } });
    const kept: string[] = [];
    for (const [mi, m] of t.modules.entries()) {
      const mod =
        (await db.module.findFirst({ where: { trackId: track.id, order: mi } })) ??
        (await db.module.create({ data: { trackId: track.id, title: m.title, order: mi } }));
      if (mod.title !== m.title) await db.module.update({ where: { id: mod.id }, data: { title: m.title } });
      for (const [li, l] of m.lessons.entries()) {
        const lesson = {
          title: l.title, type: l.type, mode: l.mode ?? "EDITOR", order: li, content: l.content, xp: l.xp ?? 10,
          teacherGuide: l.guide ? guideMarkdown(l.guide) : null,
          extra: l.extra ?? null,
          allowedBlocks: l.allowedBlocks ?? [],
          starterWorkspace: l.starter ?? (l.startWithFlag ? FLAG_STARTER : Prisma.DbNull),
          optional: l.optional ?? false,
          checks: l.checks ?? Prisma.DbNull,
          draft: false,
        };
        const saved = await db.lesson.upsert({
          where: { moduleId_slug: { moduleId: mod.id, slug: l.slug } },
          update: lesson,
          create: { ...lesson, slug: l.slug, moduleId: mod.id },
        });
        kept.push(saved.id);
      }
    }
    // Lições que saíram do currículo ficam ocultas (draft), sem apagar o progresso dos alunos.
    await db.lesson.updateMany({ where: { module: { trackId: track.id }, id: { notIn: kept } }, data: { draft: true } });
  }

  // Catálogo de medalhas (regras em src/lib/gamification.ts)
  for (const { id, name, description, icon } of BADGES) {
    await db.badge.upsert({ where: { id }, update: { name, description, icon }, create: { id, name, description, icon } });
  }

  console.log("Seed concluído ✔");
}

main().finally(() => db.$disconnect());
