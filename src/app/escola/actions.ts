"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cleanCity, isUF } from "@/lib/br";
import { requireUser } from "@/lib/dal/auth";
import { updateOrgLocation } from "@/lib/dal/org";

export type LocationState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  city: z.string().transform(cleanCity).pipe(z.string().min(2, "Informe a cidade.").max(80)),
  state: z.string().refine(isUF, "Escolha o estado."),
});

export async function updateLocationAction(_: LocationState, formData: FormData): Promise<LocationState> {
  const user = await requireUser(["ORG_ADMIN"]);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await updateOrgLocation(user, parsed.data.city, parsed.data.state);
  revalidatePath("/escola");
  return { ok: true };
}
