"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import {
  addStaffAsOwner,
  createAnnouncement,
  createSchoolAsOwner,
  resetPasswordAsOwner,
  deleteAnnouncement,
  purgeOrganization,
  purgeUser,
  removeOrganization,
  removeUser,
  restoreOrganization,
  restoreUser,
} from "@/lib/dal/platform";

export type FormState = { error?: string; ok?: string; login?: string; password?: string; href?: string } | undefined;

const owner = () => requireUser(["SUPER_ADMIN"]);
const reasonSchema = z.string().trim().min(3, "Escreva o motivo (fica registrado no histórico).").max(300);

function friendly(err: unknown): FormState {
  if (err instanceof AccessError) return { error: err.message };
  console.error(err);
  return { error: "Algo deu errado. Tente de novo." };
}

function refresh() {
  revalidatePath("/plataforma", "layout");
}

export async function removeOrgAction(orgId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await owner();
  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) return { error: reason.error.issues[0].message };
  try {
    await removeOrganization(user, orgId, reason.data);
  } catch (e) {
    return friendly(e);
  }
  refresh();
  return { ok: "Escola movida para a lixeira. Ninguém dela consegue entrar até ser restaurada." };
}

export async function removeUserAction(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await owner();
  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) return { error: reason.error.issues[0].message };
  try {
    await removeUser(user, userId, reason.data);
  } catch (e) {
    return friendly(e);
  }
  refresh();
  return { ok: "Conta movida para a lixeira." };
}

export async function restoreOrgAction(orgId: string) {
  await restoreOrganization(await owner(), orgId);
  refresh();
}

export async function restoreUserAction(userId: string) {
  await restoreUser(await owner(), userId);
  refresh();
}

export async function purgeOrgAction(orgId: string) {
  await purgeOrganization(await owner(), orgId);
  refresh();
}

export async function purgeUserAction(userId: string) {
  await purgeUser(await owner(), userId);
  refresh();
}

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Dê um título ao aviso.").max(120),
  body: z.string().trim().min(3, "Escreva o texto do aviso.").max(5000),
  expiresAt: z.string().optional(),
});

export async function createAnnouncementAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await owner();
  const parsed = announcementSchema.safeParse({ title: formData.get("title"), body: formData.get("body"), expiresAt: formData.get("expiresAt") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const expires = parsed.data.expiresAt ? new Date(`${parsed.data.expiresAt}T23:59:59-03:00`) : null;
  if (expires && (Number.isNaN(expires.getTime()) || expires < new Date())) return { error: "A data de expiração precisa ser no futuro." };
  const roles = formData.getAll("roles").map(String) as Role[];
  try {
    await createAnnouncement(user, {
      title: parsed.data.title,
      body: parsed.data.body,
      states: formData.getAll("states").map(String),
      cities: list(formData.get("cities")),
      orgIds: formData.getAll("orgIds").map(String),
      roles,
      expiresAt: expires,
    });
  } catch (e) {
    return friendly(e);
  }
  refresh();
  return { ok: "Aviso publicado." };
}

export async function deleteAnnouncementAction(id: string) {
  await deleteAnnouncement(await owner(), id);
  refresh();
}

const email = z.string().trim().toLowerCase().email("Email inválido.");
const personName = z.string().trim().min(2, "Informe o nome.").max(80);

export async function createSchoolAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await owner();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Informe o nome da escola.").max(80),
      slug: z.string().trim().toLowerCase(),
      type: z.enum(["ESCOLA", "PROFESSOR_INDEPENDENTE"]),
      city: z.string().trim().min(2, "Informe a cidade.").max(80),
      state: z.string(),
      planId: z.string().min(1),
      adminName: personName,
      adminEmail: email,
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const r = await createSchoolAsOwner(user, parsed.data);
    refresh();
    return { ok: `Conta criada: ${parsed.data.name}.`, login: r.email, password: r.password, href: `/plataforma/escolas/${r.orgId}` };
  } catch (e) {
    return friendly(e);
  }
}

export async function addStaffAction(orgId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await owner();
  const parsed = z.object({ role: z.enum(["ORG_ADMIN", "TEACHER"]), name: personName, email }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const r = await addStaffAsOwner(user, orgId, parsed.data.role, parsed.data.name, parsed.data.email);
    refresh();
    return { ok: `${parsed.data.role === "TEACHER" ? "Professor(a)" : "Coordenação"} adicionado(a).`, login: r.email, password: r.password };
  } catch (e) {
    return friendly(e);
  }
}

export async function resetPasswordAction(userId: string): Promise<FormState> {
  const user = await owner();
  try {
    const r = await resetPasswordAsOwner(user, userId);
    return { ok: "Nova senha criada.", login: r.login, password: r.password };
  } catch (e) {
    return friendly(e);
  }
}

