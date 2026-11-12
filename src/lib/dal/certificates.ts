import "server-only";
import { createHash } from "node:crypto";
import { sniffImage } from "../brand-assets";
import { brandFor } from "../branding";
import type { CertificateData } from "../certificate";
import { db } from "../db";
import { getFile } from "../storage";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

/** Código curto e estável para conferir o certificado (não revela ids). */
export function certificateCode(studentId: string, trackId: string) {
  return createHash("sha256").update(`${studentId}:${trackId}:${process.env.SESSION_SECRET ?? ""}`).digest("hex").slice(0, 10).toUpperCase();
}

/**
 * Dados do certificado. Aluno: o próprio. Professor: alunos das suas turmas. Coordenação: alunos da escola.
 * Só sai se TODAS as lições obrigatórias da trilha estiverem concluídas.
 */
export async function getCertificate(user: CurrentUser, trackId: string, studentId?: string): Promise<CertificateData> {
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

  const track = await db.track.findFirst({
    where: {
      id: trackId, published: true,
      course: { published: true, comingSoon: false, assignments: { some: { class: { archived: false, enrollments: { some: { userId: student.id } } } } } },
    },
    select: { title: true, course: { select: { title: true } }, modules: { select: { lessons: { where: { draft: false, optional: false }, select: { id: true } } } } },
  });
  if (!track) throw new AccessError("Certificado não encontrado.");
  const lessonIds = track.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const done = await db.progress.findMany({ where: { userId: student.id, lessonId: { in: lessonIds }, status: "CONCLUIDO" }, select: { updatedAt: true } });
  if (lessonIds.length === 0 || done.length < lessonIds.length) throw new AccessError("A trilha ainda não foi concluída.");

  const org = student.organization;
  const brand = brandFor(org);
  let logo: CertificateData["logo"] = null;
  if (brand.logoUrl?.startsWith("/marca/arquivo/")) {
    const bytes = await getFile(`marca/${brand.logoUrl.split("/").pop()}`).catch(() => null);
    const kind = bytes && sniffImage(bytes);
    if (bytes && kind) logo = { bytes, kind };
  }
  return {
    studentName: student.name,
    trackTitle: track.title,
    courseTitle: track.course?.title ?? "",
    lessons: lessonIds.length,
    schoolName: org.name,
    brandName: brand.name,
    primary: brand.primary,
    secondary: brand.secondary,
    completedAt: new Date(Math.max(...done.map((d) => d.updatedAt.getTime()))),
    code: certificateCode(student.id, trackId),
    logo,
  };
}
