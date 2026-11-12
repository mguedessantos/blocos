"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { createTeacherInvite, revokeInvite, setTeacherActive } from "@/lib/dal/team";
import { tenantUrl } from "@/lib/url";

export type InviteState = { error?: string; link?: string; email?: string } | undefined;

export async function inviteTeacherAction(_: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser(["ORG_ADMIN"]);
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Informe um email válido." };
  try {
    const result = await createTeacherInvite(user, email.data);
    if (!result.ok) return { error: result.reason };
    revalidatePath("/escola/equipe");
    // Até o envio de emails (Resend) estar configurado, o link é exibido para copiar.
    return { link: `${tenantUrl(result.slug)}/convite/${result.token}`, email: email.data };
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
