"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { createTeacherInvite, revokeInvite, setTeacherActive } from "@/lib/dal/team";
import { emailBrandFor, sendEmail } from "@/lib/email";
import { tenantUrl } from "@/lib/url";

export type InviteState = { error?: string; link?: string; email?: string; emailed?: boolean } | undefined;

export async function inviteTeacherAction(_: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser(["ORG_ADMIN"]);
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Informe um email válido." };
  try {
    const result = await createTeacherInvite(user, email.data);
    if (!result.ok) return { error: result.reason };
    revalidatePath("/escola/equipe");
    const link = `${tenantUrl(result.slug)}/convite/${result.token}`;
    const brand = await emailBrandFor(user.organizationId!);
    const { sent } = await sendEmail(email.data, brand, {
      subject: `Convite para dar aulas em ${brand.name}`,
      heading: "Você foi convidado(a) para ser professor(a)!",
      paragraphs: [`${user.name} convidou você para a equipe de ${brand.name}.`, "Crie sua conta pelo botão abaixo para montar turmas e acompanhar seus alunos."],
      button: { label: "Criar minha conta", url: link },
      footnote: "O convite vale por 7 dias. Se você não esperava este email, pode ignorá-lo.",
    });
    // O link continua visível para copiar (útil se o email cair no spam).
    return { link, email: email.data, emailed: sent };
  } catch (err) {
    if (err instanceof AccessError) return { error: err.message };
    throw err;
  }
}

export async function revokeInviteAction(inviteId: string) {
  const user = await requireUser(["ORG_ADMIN"]);
  await revokeInvite(user, inviteId);
  revalidatePath("/escola/equipe");
}

export async function setTeacherActiveAction(teacherId: string, active: boolean) {
  const user = await requireUser(["ORG_ADMIN"]);
  await setTeacherActive(user, teacherId, active);
  revalidatePath("/escola/equipe");
}
