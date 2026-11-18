import "server-only";
import { createHash } from "node:crypto";
import { sniffImage } from "../brand-assets";
import { brandFor } from "../branding";
import type { CertificateData } from "../certificate";
import { JAM_SKILLS, LEVELS } from "../levels";
import { db } from "../db";
import { jamPhase } from "../jams";
import { getFile } from "../storage";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";
import { requireTeam } from "./jams";

/** Código curto e estável para conferir o certificado (não revela ids). */
export function certificateCode(studentId: string, key: string) {
  return createHash("sha256").update(`${studentId}:${key}:${process.env.SESSION_SECRET ?? ""}`).digest("hex").slice(0, 10).toUpperCase();
}

/** Aluno: o próprio. Professor: alunos das suas turmas. Coordenação: alunos da escola. */
async function findStudent(user: CurrentUser, studentId?: string) {
  const targetId = user.role === "STUDENT" ? user.id : studentId;
  if (!targetId || !user.organizationId || !["STUDENT", "TEACHER", "ORG_ADMIN"].includes(user.role)) throw new AccessError("Certificado não encontrado.");
  const student = await db.user.findFirst({
    where: {
      id: targetId, role: "STUDENT", deletedAt: null, organizationId: user.organizationId,
      ...(user.role === "TEACHER" ? { enrollments: { some: { class: { teacherId: user.id } } } } : {}),
    },
    select: { id: true, name: true, organization: { include: { branding: true, subscription: { include: { plan: true } } } } },
  });
  if (!student?.organization) throw new AccessError("Certificado não encontrado.");
  return { ...student, organization: student.organization };
}

async function withBrand(student: Awaited<ReturnType<typeof findStudent>>, key: string, d: Pick<CertificateData, "kind" | "title" | "achievement" | "detail" | "skills" | "completedAt">): Promise<CertificateData> {
  const org = student.organization;
  const brand = brandFor(org);
  let logo: CertificateData["logo"] = null;
  if (brand.logoUrl?.startsWith("/marca/arquivo/")) {
    const bytes = await getFile(`marca/${brand.logoUrl.split("/").pop()}`).catch(() => null);
    const kind = bytes && sniffImage(bytes);
    if (bytes && kind) logo = { bytes, kind };
  }
  return {
    ...d, platformName: process.env.PLATFORM_NAME ?? "Blockin Lab", studentName: student.name, schoolName: org.name, brandName: brand.name,
    primary: brand.primary, secondary: brand.secondary, code: certificateCode(student.id, key), logo,
  };
}

/** Conclusão de um nível do curso: só sai com TODAS as lições de todos os mundos daquele nível concluídas. */
export async function getLevelCertificate(user: CurrentUser, courseId: string, level: number, studentId?: string): Promise<CertificateData> {
  const levelName = LEVELS[level]?.name;
  if (!levelName) throw new AccessError("Certificado não encontrado.");
  const student = await findStudent(user, studentId);
  const course = await db.course.findFirst({
    where: { id: courseId, published: true, comingSoon: false, assignments: { some: { class: { archived: false, enrollments: { some: { userId: student.id } } } } } },
    select: { title: true, tracks: { where: { published: true, level }, select: { modules: { select: { lessons: { where: { draft: false }, select: { id: true } } } } } } },
  });
  if (!course) throw new AccessError("Certificado não encontrado.");
  const lessonIds = course.tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const done = await db.progress.findMany({ where: { userId: student.id, lessonId: { in: lessonIds }, status: "CONCLUIDO" }, select: { updatedAt: true } });
  if (lessonIds.length === 0 || done.length < lessonIds.length) throw new AccessError("O nível ainda não foi concluído.");

  const worlds = course.tracks.length;
  return withBrand(student, `nivel:${courseId}:${level}`, {
    kind: "conclusão",
    title: `${course.title} - ${levelName}`,
    achievement: `concluiu o nível ${levelName}`,
    detail: `do curso ${course.title}, com ${worlds} ${worlds === 1 ? "mundo" : "mundos"} e ${lessonIds.length} lições de programação.`,
    skills: LEVELS[level].skills,
    completedAt: new Date(Math.max(...done.map((d) => d.updatedAt.getTime()))),
  });
}

/** Participação em Game Jam: a equipe entregou o jogo e a jam terminou (resultado público). */
export async function getJamCertificate(user: CurrentUser, teamId: string, studentId?: string): Promise<CertificateData> {
  const team = await requireTeam(user, teamId).catch(() => null);
  const memberId = user.role === "STUDENT" ? user.id : studentId;
  if (!team || !team.members.some((m) => m.user.id === memberId)) throw new AccessError("Certificado não encontrado.");
  if (!team.origin || jamPhase(team.jam) !== "ENCERRADA") throw new AccessError("O certificado sai quando a Game Jam termina.");
  const student = await findStudent(user, memberId);
  return withBrand(student, `jam:${teamId}`, {
    kind: "participação",
    title: team.jam.title,
    achievement: `participou da Game Jam “${team.jam.title}”`,
    detail: `com a equipe ${team.name} e o jogo “${team.origin.entry.title}”, no tema “${team.jam.theme}”.`,
    skills: JAM_SKILLS,
    completedAt: team.jam.judgingEndsAt,
  });
}
