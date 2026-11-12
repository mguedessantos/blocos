"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/dal/auth";
import { addCustomDomain, removeCustomDomain, updateBranding, verifyCustomDomain } from "@/lib/dal/branding";
import { AccessError } from "@/lib/dal/classes";

export type BrandState = { error?: string; ok?: string } | undefined;

function friendly(err: unknown): BrandState {
  if (err instanceof AccessError) return { error: err.message };
  console.error(err);
  return { error: "Algo deu errado. Tente de novo." };
}

const schema = z.object({
  displayName: z.string().trim().max(60, "O nome exibido pode ter até 60 caracteres."),
  primaryColor: z.string().trim().toLowerCase(),
  secondaryColor: z.string().trim().toLowerCase(),
  emailSenderName: z.string().trim().max(60),
  supportEmail: z.union([z.literal(""), z.string().trim().toLowerCase().email("Email de suporte inválido.")]),
});

async function image(fd: FormData, field: string) {
  if (fd.get(`${field}Remove`) === "on") return "remove" as const;
  const f = fd.get(field);
  if (!(f instanceof File) || f.size === 0) return null;
  return { bytes: new Uint8Array(await f.arrayBuffer()) };
}

export async function saveBrandingAction(_: BrandState, fd: FormData): Promise<BrandState> {
  const user = await requireUser(["ORG_ADMIN"]);
  const parsed = schema.safeParse({
    displayName: fd.get("displayName") ?? "",
    primaryColor: fd.get("primaryColor") ?? "",
    secondaryColor: fd.get("secondaryColor") ?? "",
    emailSenderName: fd.get("emailSenderName") ?? "",
    supportEmail: fd.get("supportEmail") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await updateBranding(user, { ...parsed.data, hidePlatformBrand: fd.get("hidePlatformBrand") === "on" }, await image(fd, "logo"), await image(fd, "favicon"));
  } catch (e) {
    return friendly(e);
  }
  revalidatePath("/", "layout");
  return { ok: "Marca atualizada! Recarregue a página para ver em todo o site." };
}

export async function addDomainAction(_: BrandState, fd: FormData): Promise<BrandState> {
  const user = await requireUser(["ORG_ADMIN"]);
  try {
    const d = await addCustomDomain(user, String(fd.get("hostname") ?? ""));
    revalidatePath("/escola/marca");
    return { ok: `Domínio ${d.hostname} adicionado. Agora configure o DNS e clique em “Verificar”.` };
  } catch (e) {
    return friendly(e);
  }
}

export async function verifyDomainAction(domainId: string): Promise<BrandState> {
  const user = await requireUser(["ORG_ADMIN"]);
  try {
    const r = await verifyCustomDomain(user, domainId);
    revalidatePath("/escola/marca");
    return r.verified ? { ok: `Pronto! ${r.detail}` } : { error: r.detail };
  } catch (e) {
    return friendly(e);
  }
}

export async function removeDomainAction(domainId: string) {
  const user = await requireUser(["ORG_ADMIN"]);
  await removeCustomDomain(user, domainId);
  revalidatePath("/escola/marca");
}
