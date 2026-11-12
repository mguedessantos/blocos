// Dados de demonstração. Rode: npx prisma db seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // Planos
  // Preços provisórios (centavos, BRL/mês). Ajuste aqui e rode `npm run stripe:setup`.
  const plans = [
    { id: "professor", name: "Professor", order: 1, orgType: "PROFESSOR_INDEPENDENTE" as const, priceCents: 4900, perSeat: false, minSeats: 1,
      description: "Para professores e tutores independentes.", maxStudents: 40, maxClasses: 3, features: [], aiMonthlyQuota: 0 },
    { id: "escola", name: "Escola", order: 2, orgType: "ESCOLA" as const, priceCents: 800, perSeat: true, minSeats: 30,
      description: "Professores ilimitados, cobrança por aluno.", maxStudents: null, maxClasses: null, features: ["unlimited_jams"], aiMonthlyQuota: 0 },
    { id: "escola_plus", name: "Escola+", order: 3, orgType: "ESCOLA" as const, priceCents: 1200, perSeat: true, minSeats: 30,
      description: "Tudo do Escola + marca própria, domínio próprio e tutor com IA.", maxStudents: null, maxClasses: null,
      features: ["white_label", "ai_tutor", "unlimited_jams"], aiMonthlyQuota: 5000 },
  ];
  for (const p of plans) {
    // não sobrescreve o stripePriceId gravado pelo stripe:setup
    await db.plan.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // Super admin
  await db.user.upsert({
    where: { email: "admin@blocos.dev" },
    update: {},
    create: { role: "SUPER_ADMIN", name: "Admin da Plataforma", email: "admin@blocos.dev", passwordHash: await hash("admin123") },
  });

  // Escola com white-label (Escola+)
  const escola = await db.organization.upsert({
    where: { slug: "escola-demo" },
    update: {},
    create: {
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

  const turma = await db.class.upsert({
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
    update: {},
    create: {
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

  console.log("Seed concluído ✔");
}

main().finally(() => db.$disconnect());
