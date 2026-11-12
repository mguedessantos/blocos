import "server-only";
import { db } from "../db";
import { tenantUrl } from "../url";
import type { CurrentUser } from "./auth";

// Todas as consultas recebem o usuário e filtram pela organização dele.
function orgOf(user: CurrentUser) {
  if (!user.organizationId) throw new Error("Usuário sem organização.");
  return user.organizationId;
}

export async function getOrgOverview(user: CurrentUser) {
  const organizationId = orgOf(user);
  const [org, students, teachers, classes] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: { subscription: { include: { plan: true } } },
    }),
    db.user.count({ where: { organizationId, role: "STUDENT" } }),
    db.user.findMany({
      where: { organizationId, role: { in: ["TEACHER", "ORG_ADMIN"] } },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    }),
    db.class.count({ where: { organizationId, archived: false } }),
  ]);
  return { org, students, teachers, classes };
}

export async function listTeacherClasses(user: CurrentUser) {
  const organizationId = orgOf(user);
  return db.class.findMany({
    where: {
      organizationId,
      archived: false,
      ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
    },
    include: { _count: { select: { enrollments: true } }, teacher: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listStudentClasses(user: CurrentUser) {
  return db.class.findMany({
    where: { organizationId: orgOf(user), enrollments: { some: { userId: user.id } } },
    select: { id: true, name: true, teacher: { select: { name: true } } },
  });
}

/** Endereço de login dos alunos (domínio próprio verificado, senão o subdomínio). */
export async function getStudentLoginUrl(user: CurrentUser) {
  const org = await db.organization.findUniqueOrThrow({
    where: { id: orgOf(user) },
    select: { slug: true, domains: { where: { type: "CUSTOM", status: "VERIFICADO" }, take: 1 } },
  });
  const base = org.domains[0] ? `https://${org.domains[0].hostname}` : tenantUrl(org.slug);
  return `${base}/entrar-aluno`;
}
