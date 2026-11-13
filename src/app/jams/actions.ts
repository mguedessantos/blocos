"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { JamScope, PrizeRecipient } from "@/generated/prisma/enums";
import { cleanCity, isUF } from "@/lib/br";
import { requireUser } from "@/lib/dal/auth";
import { rangeName } from "@/lib/jams";
import { AccessError } from "@/lib/dal/classes";
import {
  addJudge,
  createJam,
  createTeam,
  deleteTeam,
  MAX_DESCRIPTION,
  removeJudge,
  saveJudgement,
  setJamOrganizer,
  setJamPublished,
  submitEntry,
  updateJam,
  type JamInput,
} from "@/lib/dal/jams";

export type JamFormState = { error?: string; ok?: string; leaks?: string[]; password?: string | null } | undefined;

function friendly(err: unknown): JamFormState {
  if (err instanceof AccessError) return { error: err.message };
  console.error(err);
  return { error: "Algo deu errado. Tente de novo." };
}

/** "2026-12-01T09:00" digitado no horário de Brasília. */
function brasilia(v: FormDataEntryValue | null) {
  return new Date(`${String(v ?? "")}:00-03:00`);
}

const all = (fd: FormData, k: string) => fd.getAll(k).map((v) => String(v).trim());

function parseJam(fd: FormData): JamInput | string {
  const base = z
    .object({
      title: z.string().trim().min(3, "Dê um nome para a jam.").max(80),
      theme: z.string().trim().min(2, "Qual é o tema?").max(120),
      description: z.string().trim().min(10, "Escreva as regras e informações da jam.").max(10000),
      scope: z.enum(["PLATAFORMA", "ESTADOS", "CIDADES", "ESCOLAS"]),
      maxTeamSize: z.coerce.number().int().min(1).max(10),
    })
    .safeParse(Object.fromEntries(fd));
  if (!base.success) return base.error.issues[0].message;

  const names = all(fd, "critName");
  const weights = all(fd, "critWeight");
  const maxes = all(fd, "critMax");
  const criteria = names
    .map((name, i) => ({ name, weight: Number(weights[i] || 1), maxScore: Number(maxes[i] || 10) }))
    .filter((c) => c.name);
  if (criteria.some((c) => !(c.weight > 0 && c.weight <= 10) || !Number.isInteger(c.maxScore) || c.maxScore < 1 || c.maxScore > 100)) {
    return "Pesos vão de 0,1 a 10 e notas máximas de 1 a 100.";
  }

  const pt = all(fd, "prizeTitle");
  const pd = all(fd, "prizeDescription");
  const pr = all(fd, "prizeRecipient");
  const prizes = pt
    .map((title, i) => ({ place: i + 1, title, description: pd[i] ?? "", recipient: (pr[i] === "ESCOLA" ? "ESCOLA" : "EQUIPE") as PrizeRecipient }))
    .filter((p) => p.title);

  const cmin = all(fd, "catMin");
  const cmax = all(fd, "catMax");
  const categories = cmin
    .map((v, i) => ({ minYear: Number(v), maxYear: Number(cmax[i]) }))
    .filter((c) => c.minYear && c.maxYear)
    .map((c) => ({ ...c, name: rangeName(c.minYear, c.maxYear) }));

  return {
    ...base.data,
    categories,
    scope: base.data.scope as JamScope,
    states: fd.getAll("states").map(String).filter(isUF),
    cities: String(fd.get("cities") ?? "").split(/[,;\n]/).map(cleanCity).filter(Boolean),
    orgIds: fd.getAll("orgIds").map(String),
    startsAt: brasilia(fd.get("startsAt")),
    endsAt: brasilia(fd.get("endsAt")),
    judgingEndsAt: brasilia(fd.get("judgingEndsAt")),
    criteria,
    prizes,
  };
}

export async function saveJamAction(jamId: string | null, _: JamFormState, fd: FormData): Promise<JamFormState> {
  const user = await requireUser();
  const input = parseJam(fd);
  if (typeof input === "string") return { error: input };
  let id = jamId;
  try {
    if (jamId) await updateJam(user, jamId, input);
    else id = (await createJam(user, input)).id;
  } catch (e) {
    return friendly(e);
  }
  revalidatePath("/jams", "layout");
  if (!jamId) redirect(`/jams/gerenciar/${id}?criada=1`);
  return { ok: "Alterações salvas." };
}

export async function setPublishedAction(jamId: string, published: boolean) {
  await setJamPublished(await requireUser(), jamId, published);
  revalidatePath("/jams", "layout");
}

export async function addJudgeAction(jamId: string, _: JamFormState, fd: FormData): Promise<JamFormState> {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2, "Informe o nome.").max(80), email: z.string().trim().toLowerCase().email("Email inválido.") })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { password } = await addJudge(user, jamId, parsed.data.name, parsed.data.email);
    revalidatePath(`/jams/gerenciar/${jamId}`);
    return { ok: password ? `Conta de jurado criada para ${parsed.data.email}.` : "Jurado(a) adicionado(a).", password };
  } catch (e) {
    return friendly(e);
  }
}

export async function removeJudgeAction(jamId: string, judgeId: string) {
  await removeJudge(await requireUser(), jamId, judgeId);
  revalidatePath(`/jams/gerenciar/${jamId}`);
}

export async function setOrganizerAction(userId: string, allow: boolean) {
  await setJamOrganizer(await requireUser(["SUPER_ADMIN"]), userId, allow);
  revalidatePath("/plataforma", "layout");
}

export async function createTeamAction(jamId: string, slug: string, _: JamFormState, fd: FormData): Promise<JamFormState> {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const name = z.string().trim().min(2, "Dê um nome para a equipe.").max(40).safeParse(fd.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  let teamId: string;
  try {
    const members = fd.getAll("students").map(String).map((id) => ({ id, schoolYear: Number(fd.get(`year_${id}`)) }));
    teamId = (await createTeam(user, jamId, name.data, members)).id;
  } catch (e) {
    return friendly(e);
  }
  revalidatePath(`/jams/${slug}`);
  redirect(`/jams/${slug}/equipes/${teamId}`);
}

export async function deleteTeamAction(teamId: string, slug: string) {
  await deleteTeam(await requireUser(["TEACHER", "ORG_ADMIN"]), teamId);
  revalidatePath(`/jams/${slug}`);
  redirect(`/jams/${slug}`);
}

export async function submitEntryAction(teamId: string, _: JamFormState, fd: FormData): Promise<JamFormState> {
  const user = await requireUser(["STUDENT", "TEACHER", "ORG_ADMIN"]);
  const parsed = z
    .object({
      title: z.string().trim().min(2, "Qual é o nome do jogo?").max(60),
      description: z.string().trim().min(10, "Conte em poucas frases como é o jogo.").max(MAX_DESCRIPTION, `A descrição pode ter até ${MAX_DESCRIPTION} caracteres.`),
      youtubeUrl: z.string().trim().min(5, "Cole o link do vídeo do YouTube."),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const r = await submitEntry(user, teamId, { ...parsed.data, project: fd.get("source") === "estudio" ? null : (fd.get("project") as File | null), doc: fd.get("doc") as File | null, fromStudio: fd.get("source") === "estudio" });
    revalidatePath("/jams", "layout");
    return { ok: "Entrega salva! Você pode atualizar até o fim do prazo.", leaks: r.leaks };
  } catch (e) {
    return friendly(e);
  }
}

export async function saveJudgementAction(entryId: string, criteriaIds: string[], _: JamFormState, fd: FormData): Promise<JamFormState> {
  const user = await requireUser();
  const values = Object.fromEntries(criteriaIds.map((id) => [id, Number(fd.get(`c_${id}`))]));
  try {
    await saveJudgement(user, entryId, values, String(fd.get("feedback") ?? ""));
  } catch (e) {
    return friendly(e);
  }
  revalidatePath("/jurado", "layout");
  return { ok: "Avaliação salva." };
}
