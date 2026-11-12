"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { acceptInvite } from "@/lib/dal/team";
import { createSession } from "@/lib/session";
import { getTenant } from "@/lib/tenant";

export type AcceptState = { error?: string; name?: string } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200),
});

export async function acceptInviteAction(token: string, _: AcceptState, formData: FormData): Promise<AcceptState> {
  const name = String(formData.get("name") ?? "");
  const parsed = schema.safeParse({ name, password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, name };

  const tenant = await getTenant();
  const result = await acceptInvite(token, tenant?.id ?? null, parsed.data.name, parsed.data.password);
  if (!result.ok) return { error: result.reason, name };

  await createSession({ userId: result.user.id, role: result.user.role, orgId: result.user.organizationId });
  redirect("/professor");
}
