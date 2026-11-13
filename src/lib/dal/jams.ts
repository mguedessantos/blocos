import "server-only";
import bcrypt from "bcryptjs";
import type { JamScope, PrizeRecipient } from "@/generated/prisma/enums";
import { DEFAULT_STAFF_PASSWORD } from "../credentials";
import { db } from "../db";
import { docExtOf, FileError, findIdentityLeaks, MAX_DOC_BYTES, MAX_PROJECT_BYTES, sanitizeDocx, sanitizePdf, sanitizeSb3 } from "../jam-files";
import {
  canJudge,
  canRegisterTeams,
  categoryFor,
  canSubmit,
  jamOpenTo,
  jamPhase,
  newAnonCode,
  parseYouTube,
  rankEntries,
  resultsPublic,
  slugifyJam,
  validateCategories,
  validateJamDates,
  type CategoryRange,
  type JamPhase,
} from "../jams";
import { deleteFile, getFile, putFile } from "../storage";
import { readSb3 } from "../sb3/project";
import type { CurrentUser } from "./auth";
import { AccessError } from "./classes";

// ─────────────────────────────────────────────────────────────────────────────
// JULGAMENTO CEGO — regra de ouro deste arquivo:
// tudo que um JURADO recebe vem de JamEntry (código anônimo, título, descrição,
// vídeo, critérios). Nunca selecione `origin`, equipe, escola, alunos ou nomes de
// arquivo nas funções do jurado. O vínculo entrega → equipe/escola só aparece em
// `getJamResults` quando a jam está ENCERRADA.
// ─────────────────────────────────────────────────────────────────────────────

export const isJamManager = (u: CurrentUser) => u.role === "SUPER_ADMIN" || u.canOrganizeJams;

async function audit(actor: CurrentUser, action: string, target: string, metadata?: Record<string, unknown>) {
  await db.auditLog.create({ data: { actorId: actor.id, organizationId: actor.organizationId, action, target, metadata: metadata as object | undefined } });
}

async function orgOf(user: CurrentUser) {
  return user.organizationId ? db.organization.findUnique({ where: { id: user.organizationId }, select: { id: true, name: true, state: true, city: true } }) : null;
}

const jamListSelect = {
  id: true, slug: true, title: true, theme: true, scope: true, states: true, cities: true, orgIds: true,
  startsAt: true, endsAt: true, judgingEndsAt: true, published: true, maxTeamSize: true,
  prizes: { orderBy: { place: "asc" as const }, select: { place: true, title: true, recipient: true } },
  _count: { select: { entries: true, teams: true } },
};

// ───────────── Listar / ver ─────────────

export async function listJams(user: CurrentUser) {
  const manager = isJamManager(user);
  const [jams, org, judging] = await Promise.all([
    db.gameJam.findMany({ where: manager ? {} : { published: true }, orderBy: { startsAt: "desc" }, select: jamListSelect }),
    orgOf(user),
    db.jamJudge.findMany({ where: { userId: user.id }, select: { jamId: true } }),
  ]);
  const judged = new Set(judging.map((j) => j.jamId));
  const now = new Date();
  return jams
    .filter((j) => manager || judged.has(j.id) || jamOpenTo(j, org))
    .map((j) => ({ ...j, phase: jamPhase(j, now), isJudge: judged.has(j.id) }));
}

async function loadVisibleJam(user: CurrentUser, slug: string) {
  const jam = await db.gameJam.findUnique({
    where: { slug },
    include: { prizes: { orderBy: { place: "asc" } }, criteria: { orderBy: { order: "asc" } }, categories: { orderBy: { minYear: "asc" } } },
  });
  if (!jam) throw new AccessError("Jam não encontrada.");
  const org = await orgOf(user);
  const judge = await db.jamJudge.findUnique({ where: { jamId_userId: { jamId: jam.id, userId: user.id } } });
  const manager = isJamManager(user);
  if (!manager && (!jam.published || (!judge && !jamOpenTo(jam, org)))) throw new AccessError("Jam não encontrada.");
  return { jam, org, manager, isJudge: Boolean(judge), phase: jamPhase(jam) };
}

/** Página da jam: dados públicos + o que cabe ao papel (equipes do professor, equipe do aluno, resultados). */
export async function getJam(user: CurrentUser, slug: string) {
  const { jam, org, manager, isJudge, phase } = await loadVisibleJam(user, slug);

  const teamWhere =
    user.role === "STUDENT"
      ? { jamId: jam.id, members: { some: { userId: user.id } } }
      : user.role === "TEACHER"
        ? { jamId: jam.id, teacherId: user.id }
        : user.role === "ORG_ADMIN" && org
          ? { jamId: jam.id, organizationId: org.id }
          : null;
  const teams = teamWhere
    ? await db.jamTeam.findMany({
        where: teamWhere,
        orderBy: { createdAt: "asc" },
        select: {
          id: true, name: true, category: { select: { name: true } },
          members: { select: { schoolYear: true, user: { select: { id: true, name: true } } } },
          origin: { select: { entry: { select: { id: true, anonCode: true, title: true, updatedAt: true } } } },
        },
      })
    : [];

  return {
    jam: {
      id: jam.id, slug: jam.slug, title: jam.title, theme: jam.theme, description: jam.description, scope: jam.scope,
      states: jam.states, cities: jam.cities, startsAt: jam.startsAt, endsAt: jam.endsAt, judgingEndsAt: jam.judgingEndsAt,
      maxTeamSize: jam.maxTeamSize, published: jam.published,
      prizes: jam.prizes,
      categories: jam.categories.map((c) => ({ id: c.id, name: c.name, minYear: c.minYear, maxYear: c.maxYear })),
      criteria: jam.criteria.map((c) => ({ name: c.name, weight: c.weight, maxScore: c.maxScore })),
    },
    phase,
    manager,
    isJudge,
    canCreateTeams: (user.role === "TEACHER" || user.role === "ORG_ADMIN") && canRegisterTeams(phase) && Boolean(org),
    teams: teams.map((t) => ({
      id: t.id, name: t.name, category: t.category?.name ?? null,
      members: t.members.map((m) => ({ ...m.user, schoolYear: m.schoolYear })),
      entry: t.origin?.entry ?? null,
    })),
    results: resultsPublic(phase) ? await getJamResults(jam.id, teams.map((t) => t.id)) : null,
  };
}

/** Resultados com a origem revelada — SÓ depois do fim do julgamento. Ranking e prêmios por categoria. */
async function getJamResults(jamId: string, myTeamIds: string[]) {
  const jam = await db.gameJam.findUniqueOrThrow({
    where: { id: jamId },
    include: { criteria: true, prizes: { orderBy: { place: "asc" } }, categories: { orderBy: { minYear: "asc" } } },
  });
  if (!resultsPublic(jamPhase(jam))) throw new AccessError("Os resultados ainda não foram revelados.");
  const entries = await db.jamEntry.findMany({
    where: { jamId },
    select: {
      id: true, anonCode: true, title: true, youtubeId: true, categoryId: true,
      origin: { select: { team: { select: { id: true, name: true, organization: { select: { name: true, city: true, state: true } } } } } },
      feedbacks: { select: { text: true } },
    },
  });
  const scores = await db.jamScore.findMany({ where: { entry: { jamId } }, select: { entryId: true, criterionId: true, judgeId: true, value: true } });
  const byId = new Map(entries.map((e) => [e.id, e]));
  const mine = new Set(myTeamIds);
  const groups = [...jam.categories.map((c) => ({ id: c.id as string | null, name: c.name })), { id: null, name: "Sem categoria" }];
  return groups
    .map((g) => {
      const ids = entries.filter((e) => e.categoryId === g.id).map((e) => e.id);
      const ranking = rankEntries(ids, jam.criteria, scores.filter((sc) => ids.includes(sc.entryId)));
      return {
        category: g.name,
        entries: ranking.map((r) => {
          const e = byId.get(r.entryId)!;
          const team = e.origin?.team;
          const isMine = team ? mine.has(team.id) : false;
          return {
            ...r,
            anonCode: e.anonCode, title: e.title, youtubeId: e.youtubeId,
            team: team?.name ?? "—",
            school: team ? `${team.organization.name} · ${team.organization.city}/${team.organization.state}` : "—",
            prize: r.place ? jam.prizes.find((p) => p.place === r.place) ?? null : null,
            isMine,
            feedback: isMine ? e.feedbacks.map((f) => f.text) : [],
          };
        }),
      };
    })
    .filter((g) => g.entries.length > 0);
}

// ───────────── Criar / editar (dono e organizadores) ─────────────

export type JamInput = {
  title: string; theme: string; description: string;
  scope: JamScope; states: string[]; cities: string[]; orgIds: string[];
  startsAt: Date; endsAt: Date; judgingEndsAt: Date; maxTeamSize: number;
  criteria: { name: string; weight: number; maxScore: number }[];
  prizes: { place: number; title: string; description: string; recipient: PrizeRecipient }[];
  categories: CategoryRange[];
};

function checkInput(i: JamInput) {
  const dates = validateJamDates(i.startsAt, i.endsAt, i.judgingEndsAt);
  if (dates) throw new AccessError(dates);
  if (i.criteria.length === 0) throw new AccessError("Inclua pelo menos um critério de avaliação.");
  const cats = validateCategories(i.categories);
  if (cats) throw new AccessError(cats);
  if (i.scope === "ESTADOS" && !i.states.length) throw new AccessError("Escolha pelo menos um estado.");
  if (i.scope === "CIDADES" && !i.cities.length) throw new AccessError("Informe pelo menos uma cidade.");
  if (i.scope === "ESCOLAS" && !i.orgIds.length) throw new AccessError("Escolha pelo menos uma escola.");
}

function requireManager(user: CurrentUser) {
  if (!isJamManager(user)) throw new AccessError("Só a organização da plataforma cria game jams.");
}

export async function createJam(user: CurrentUser, input: JamInput) {
  requireManager(user);
  checkInput(input);
  const raw = slugifyJam(input.title);
  const base = ["nova", "gerenciar", "arquivo"].includes(raw) ? `${raw}-jam` : raw; // rotas fixas de /jams
  let slug = base;
  for (let n = 2; await db.gameJam.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`;
  const { criteria, prizes, categories, ...data } = input;
  const jam = await db.gameJam.create({
    data: {
      ...data, slug, createdById: user.id,
      criteria: { create: criteria.map((c, order) => ({ ...c, order })) },
      prizes: { create: prizes },
      categories: { create: categories.map((c, order) => ({ ...c, order })) },
    },
  });
  await audit(user, "jam.criar", jam.slug);
  return jam;
}

export async function updateJam(user: CurrentUser, jamId: string, input: JamInput) {
  requireManager(user);
  checkInput(input);
  const jam = await db.gameJam.findUniqueOrThrow({ where: { id: jamId } });
  const phase = jamPhase(jam);
  const [scored, teams] = await Promise.all([db.jamScore.count({ where: { entry: { jamId } } }), db.jamTeam.count({ where: { jamId } })]);
  const { criteria, prizes, categories, ...data } = input;
  await db.$transaction(async (tx) => {
    await tx.gameJam.update({ where: { id: jamId }, data });
    // critérios não mudam depois que alguém já deu nota (mudaria o ranking)
    if (scored === 0 && phase !== "ENCERRADA") {
      await tx.jamCriterion.deleteMany({ where: { jamId } });
      await tx.jamCriterion.createMany({ data: criteria.map((c, order) => ({ ...c, order, jamId })) });
    }
    // categorias não mudam depois que há equipes inscritas (cada equipe já tem a sua)
    if (teams === 0) {
      await tx.jamCategory.deleteMany({ where: { jamId } });
      await tx.jamCategory.createMany({ data: categories.map((c, order) => ({ ...c, order, jamId })) });
    }
    await tx.jamPrize.deleteMany({ where: { jamId } });
    await tx.jamPrize.createMany({ data: prizes.map((p) => ({ ...p, jamId })) });
  });
  await audit(user, "jam.editar", jam.slug);
}

export async function setJamPublished(user: CurrentUser, jamId: string, published: boolean) {
  requireManager(user);
  const jam = await db.gameJam.update({ where: { id: jamId }, data: { published } });
  await audit(user, published ? "jam.publicar" : "jam.despublicar", jam.slug);
}

export async function getJamForManager(user: CurrentUser, jamId: string) {
  requireManager(user);
  const jam = await db.gameJam.findUnique({
    where: { id: jamId },
    include: {
      prizes: { orderBy: { place: "asc" } },
      criteria: { orderBy: { order: "asc" } },
      categories: { orderBy: { minYear: "asc" }, include: { _count: { select: { teams: true, entries: true } } } },
      judges: { select: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { teams: true, entries: true } },
    },
  });
  if (!jam) throw new AccessError("Jam não encontrada.");
  const entries = await db.jamEntry.findMany({ where: { jamId }, select: { id: true, anonCode: true, category: { select: { name: true } }, _count: { select: { feedbacks: true } }, scores: { select: { judgeId: true }, distinct: ["judgeId"] } } });
  return {
    jam,
    phase: jamPhase(jam),
    // progresso do julgamento sem revelar origem
    entries: entries.map((e) => ({ anonCode: e.anonCode, category: e.category?.name ?? null, judgesScored: e.scores.length, feedbacks: e._count.feedbacks })),
  };
}

/** Convida jurado: conta existente pelo email, ou cria uma conta de JURADO com senha temporária. */
export async function addJudge(user: CurrentUser, jamId: string, name: string, email: string) {
  requireManager(user);
  const existing = await db.user.findUnique({ where: { email } });
  let password: string | null = null;
  let judgeId: string;
  if (existing) {
    if (existing.role === "STUDENT" || existing.deletedAt) throw new AccessError("Esta conta não pode ser jurada.");
    judgeId = existing.id;
  } else {
    password = DEFAULT_STAFF_PASSWORD; // troca obrigatória no primeiro login
    const u = await db.user.create({ data: { role: "JUDGE", name, email, passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true } });
    judgeId = u.id;
  }
  await db.jamJudge.upsert({ where: { jamId_userId: { jamId, userId: judgeId } }, create: { jamId, userId: judgeId }, update: {} });
  await audit(user, "jam.jurado.adicionar", jamId, { email });
  return { password };
}

export async function removeJudge(user: CurrentUser, jamId: string, judgeId: string) {
  requireManager(user);
  await db.jamJudge.deleteMany({ where: { jamId, userId: judgeId } });
  await audit(user, "jam.jurado.remover", jamId, { judgeId });
}

/** Dono concede/retira a permissão de organizar jams. */
export async function setJamOrganizer(user: CurrentUser, userId: string, allow: boolean) {
  if (user.role !== "SUPER_ADMIN") throw new AccessError("Acesso negado.");
  const u = await db.user.update({ where: { id: userId }, data: { canOrganizeJams: allow }, select: { organizationId: true } });
  await db.auditLog.create({ data: { actorId: user.id, organizationId: u.organizationId, action: allow ? "jam.organizador.conceder" : "jam.organizador.retirar", target: userId } });
}

// ───────────── Equipes (professor/coordenação) ─────────────

async function jamForTeams(user: CurrentUser, jamId: string) {
  if (user.role !== "TEACHER" && user.role !== "ORG_ADMIN") throw new AccessError("Só professores inscrevem equipes.");
  const jam = await db.gameJam.findUnique({ where: { id: jamId } });
  const org = await orgOf(user);
  if (!jam || !jam.published || !jamOpenTo(jam, org)) throw new AccessError("Jam não encontrada.");
  return { jam, org: org! };
}

/** Alunos que o professor pode colocar em equipes (das suas turmas; coordenação: da escola). */
export async function listTeamCandidates(user: CurrentUser, jamId: string) {
  const { org } = await jamForTeams(user, jamId);
  const [students, taken] = await Promise.all([
    db.user.findMany({
      where: {
        role: "STUDENT", organizationId: org.id, deletedAt: null, active: true,
        enrollments: { some: { class: { archived: false, ...(user.role === "TEACHER" ? { teacherId: user.id } : {}) } } },
      },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, username: true,
        enrollments: { select: { class: { select: { name: true } } } },
        jamMemberships: { orderBy: { team: { createdAt: "desc" } }, take: 1, select: { schoolYear: true } },
      },
    }),
    db.jamTeamMember.findMany({ where: { team: { jamId } }, select: { userId: true } }),
  ]);
  const busy = new Set(taken.map((t) => t.userId));
  return students.map((s) => ({ id: s.id, name: s.name, username: s.username, classes: s.enrollments.map((e) => e.class.name).join(", "), busy: busy.has(s.id), lastYear: s.jamMemberships[0]?.schoolYear ?? null }));
}

/** Inscreve a equipe. Cada aluno informa o ano escolar; todos precisam caber na mesma categoria. */
export async function createTeam(user: CurrentUser, jamId: string, name: string, members: { id: string; schoolYear: number }[]) {
  const { jam, org } = await jamForTeams(user, jamId);
  if (!canRegisterTeams(jamPhase(jam))) throw new AccessError("As inscrições desta jam estão fechadas.");
  const uniq = [...new Map(members.map((m) => [m.id, m])).values()];
  if (uniq.length === 0) throw new AccessError("Escolha pelo menos um aluno.");
  if (uniq.length > jam.maxTeamSize) throw new AccessError(`Cada equipe pode ter no máximo ${jam.maxTeamSize} alunos.`);
  const allowed = new Map((await listTeamCandidates(user, jamId)).map((c) => [c.id, c]));
  for (const m of uniq) {
    const c = allowed.get(m.id);
    if (!c) throw new AccessError("Aluno não encontrado nas suas turmas.");
    if (c.busy) throw new AccessError(`${c.name} já está em outra equipe desta jam.`);
  }
  const cats = await db.jamCategory.findMany({ where: { jamId }, orderBy: { minYear: "asc" } });
  const fit = categoryFor(uniq.map((m) => m.schoolYear), cats);
  if ("error" in fit) throw new AccessError(fit.error);
  const team = await db.jamTeam.create({
    data: {
      jamId, name, organizationId: org.id, teacherId: user.id, categoryId: fit.category.id,
      members: { create: uniq.map((m) => ({ userId: m.id, schoolYear: m.schoolYear })) },
    },
  });
  await audit(user, "jam.equipe.criar", team.id, { jam: jam.slug, categoria: fit.category.name });
  return team;
}

/** Equipe acessível: aluno membro, professor que inscreveu, ou coordenação da escola. */
async function requireTeam(user: CurrentUser, teamId: string) {
  const team = await db.jamTeam.findUnique({
    where: { id: teamId },
    include: {
      jam: true,
      organization: { select: { name: true, city: true } },
      members: { select: { schoolYear: true, user: { select: { id: true, name: true, username: true } } } },
      category: { select: { name: true } },
      origin: { include: { entry: true } },
    },
  });
  const ok =
    team &&
    ((user.role === "STUDENT" && team.members.some((m) => m.user.id === user.id)) ||
      (user.role === "TEACHER" && team.teacherId === user.id) ||
      (user.role === "ORG_ADMIN" && team.organizationId === user.organizationId));
  if (!ok) throw new AccessError("Equipe não encontrada.");
  return team;
}

export async function getTeam(user: CurrentUser, teamId: string) {
  const team = await requireTeam(user, teamId);
  const phase = jamPhase(team.jam);
  const e = team.origin?.entry ?? null;
  return {
    team: { id: team.id, name: team.name, category: team.category?.name ?? null, members: team.members.map((m) => ({ ...m.user, schoolYear: m.schoolYear })), studioSavedAt: team.studioSavedAt },
    jam: { id: team.jam.id, slug: team.jam.slug, title: team.jam.title, theme: team.jam.theme, endsAt: team.jam.endsAt, startsAt: team.jam.startsAt },
    phase,
    canSubmit: canSubmit(phase),
    canDelete: user.role !== "STUDENT" && !e && canRegisterTeams(phase),
    entry: e && { id: e.id, anonCode: e.anonCode, title: e.title, description: e.description, youtubeId: e.youtubeId, docExt: e.docExt, updatedAt: e.updatedAt },
  };
}

export async function deleteTeam(user: CurrentUser, teamId: string) {
  const team = await requireTeam(user, teamId);
  if (user.role === "STUDENT" || team.origin) throw new AccessError("Equipes com entrega não podem ser apagadas.");
  await db.jamTeam.delete({ where: { id: teamId } });
  await audit(user, "jam.equipe.apagar", teamId);
}

// ───────────── Entrega ─────────────

export const MAX_DESCRIPTION = 600;

export type EntryInput = { title: string; description: string; youtubeUrl: string; project?: File | null; doc?: File | null; fromStudio?: boolean };

/** Grava/atualiza a entrega. Arquivos são limpos (metadados) e guardados com nome aleatório. */
export async function submitEntry(user: CurrentUser, teamId: string, input: EntryInput) {
  const team = await requireTeam(user, teamId);
  if (!canSubmit(jamPhase(team.jam))) throw new AccessError("As entregas só são aceitas enquanto a jam está em andamento.");
  const youtubeId = parseYouTube(input.youtubeUrl);
  if (!youtubeId) throw new AccessError("Cole o link do vídeo do YouTube (youtube.com ou youtu.be).");
  const existing = team.origin?.entry ?? null;
  const project = input.project && input.project.size > 0 ? input.project : null;
  if (input.fromStudio && !team.studioKey) throw new AccessError("O estúdio da equipe ainda não tem um projeto salvo.");
  const studio = input.fromStudio && !project ? await getFile(team.studioKey!) : null;
  const doc = input.doc && input.doc.size > 0 ? input.doc : null;
  if (!existing && ((!project && !studio) || !doc)) throw new AccessError("Envie o projeto (.sb3 ou o do estúdio) e o arquivo de documentação.");

  const texts = [input.title, input.description];
  let projectBytes: Uint8Array | null = null;
  let docBytes: Uint8Array | null = null;
  let docExt = existing?.docExt ?? "pdf";
  try {
    if (studio) {
      const r = await sanitizeSb3(studio);
      projectBytes = r.bytes;
      texts.push(r.text);
    }
    if (project) {
      if (!/\.sb3$/i.test(project.name)) throw new FileError("O projeto precisa ser um arquivo .sb3 (no PictoBlox: Arquivo → Salvar no seu computador).");
      if (project.size > MAX_PROJECT_BYTES) throw new FileError("O projeto é grande demais (máximo 25 MB).");
      const r = await sanitizeSb3(new Uint8Array(await project.arrayBuffer()));
      projectBytes = r.bytes;
      texts.push(r.text);
    }
    if (doc) {
      const ext = docExtOf(doc.name);
      if (!ext) throw new FileError("A documentação precisa ser PDF ou Word (.docx).");
      if (doc.size > MAX_DOC_BYTES) throw new FileError("A documentação é grande demais (máximo 10 MB).");
      const raw = new Uint8Array(await doc.arrayBuffer());
      const r = ext === "pdf" ? await sanitizePdf(raw) : await sanitizeDocx(raw);
      docBytes = r.bytes;
      docExt = ext;
      texts.push(r.text);
    }
  } catch (e) {
    if (e instanceof FileError) throw new AccessError(e.message);
    throw e;
  }

  const [projectKey, docKey] = await Promise.all([projectBytes ? putFile("jams", projectBytes) : null, docBytes ? putFile("jams", docBytes) : null]);
  const data = { title: input.title, description: input.description, youtubeId, docExt };
  let entryId: string;
  if (existing) {
    await db.jamEntry.update({ where: { id: existing.id }, data: { ...data, ...(projectKey ? { projectKey } : {}), ...(docKey ? { docKey } : {}) } });
    await Promise.all([projectKey && deleteFile(existing.projectKey), docKey && deleteFile(existing.docKey)]);
    entryId = existing.id;
  } else {
    const taken = new Set((await db.jamEntry.findMany({ where: { jamId: team.jamId }, select: { anonCode: true } })).map((e) => e.anonCode));
    const entry = await db.jamEntry.create({
      data: { ...data, jamId: team.jamId, categoryId: team.categoryId, anonCode: newAnonCode(taken), projectKey: projectKey!, docKey: docKey!, origin: { create: { teamId: team.id } } },
    });
    entryId = entry.id;
  }
  await audit(user, existing ? "jam.entrega.atualizar" : "jam.entrega.enviar", entryId);

  // aviso (não bloqueia): nomes que revelariam a origem dentro do jogo/descrição/documento
  const names = [team.organization.name, team.organization.city, team.name, ...team.members.map((m) => m.user.name)];
  return { entryId, leaks: findIdentityLeaks(texts, names) };
}

// ───────────── Jurado (somente dados anônimos) ─────────────

async function requireJudgeOf(user: CurrentUser, jamId: string) {
  const j = await db.jamJudge.findUnique({ where: { jamId_userId: { jamId, userId: user.id } }, include: { jam: { include: { criteria: { orderBy: { order: "asc" } } } } } });
  if (!j) throw new AccessError("Você não é jurado(a) desta jam.");
  return j.jam;
}

/** Entregas que o jurado NÃO pode avaliar (conflito de interesse: mesma escola). */
async function conflictedEntryIds(user: CurrentUser, jamId: string) {
  if (!user.organizationId) return new Set<string>();
  const rows = await db.jamEntryOrigin.findMany({ where: { entry: { jamId }, team: { organizationId: user.organizationId } }, select: { entryId: true } });
  return new Set(rows.map((r) => r.entryId));
}

export async function listJudgeJams(user: CurrentUser) {
  const rows = await db.jamJudge.findMany({
    where: { userId: user.id },
    select: { jam: { select: { id: true, title: true, theme: true, published: true, startsAt: true, endsAt: true, judgingEndsAt: true, _count: { select: { entries: true } } } } },
  });
  return rows.map((r) => ({ ...r.jam, phase: jamPhase(r.jam) }));
}

export async function getJudgeJam(user: CurrentUser, jamId: string) {
  const jam = await requireJudgeOf(user, jamId);
  const phase = jamPhase(jam);
  const blocked = await conflictedEntryIds(user, jamId);
  const entries = canJudge(phase) || phase === "ENCERRADA"
    ? await db.jamEntry.findMany({
        where: { jamId, id: { notIn: [...blocked] } },
        orderBy: { anonCode: "asc" },
        select: { id: true, anonCode: true, title: true, category: { select: { name: true } }, scores: { where: { judgeId: user.id }, select: { id: true } } },
      })
    : [];
  return {
    jam: { id: jam.id, title: jam.title, theme: jam.theme, judgingEndsAt: jam.judgingEndsAt, endsAt: jam.endsAt },
    phase,
    conflicts: blocked.size,
    entries: entries.map((e) => ({ id: e.id, anonCode: e.anonCode, title: e.title, category: e.category?.name ?? "Sem categoria", scored: e.scores.length > 0 })),
  };
}

export async function getJudgeEntry(user: CurrentUser, jamId: string, anonCode: string) {
  const jam = await requireJudgeOf(user, jamId);
  const phase = jamPhase(jam);
  if (!canJudge(phase) && phase !== "ENCERRADA") throw new AccessError("O julgamento ainda não começou.");
  const entry = await db.jamEntry.findUnique({
    where: { jamId_anonCode: { jamId, anonCode } },
    select: {
      id: true, anonCode: true, title: true, description: true, youtubeId: true, docExt: true, category: { select: { name: true } },
      scores: { where: { judgeId: user.id }, select: { criterionId: true, value: true } },
      feedbacks: { where: { judgeId: user.id }, select: { text: true } },
    },
  });
  if (!entry || (await conflictedEntryIds(user, jamId)).has(entry.id)) throw new AccessError("Entrega não encontrada.");
  await audit(user, "jam.entrega.abrir", entry.id, { anonCode });
  return {
    jam: { id: jam.id, title: jam.title, theme: jam.theme },
    phase,
    canScore: canJudge(phase),
    criteria: jam.criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight, maxScore: c.maxScore })),
    entry: {
      id: entry.id, anonCode: entry.anonCode, title: entry.title, category: entry.category?.name ?? null, description: entry.description, youtubeId: entry.youtubeId, docExt: entry.docExt,
      scores: Object.fromEntries(entry.scores.map((s) => [s.criterionId, s.value])) as Record<string, number>,
      feedback: entry.feedbacks[0]?.text ?? "",
    },
  };
}

export async function saveJudgement(user: CurrentUser, entryId: string, values: Record<string, number>, feedback: string) {
  const entry = await db.jamEntry.findUnique({ where: { id: entryId }, select: { id: true, jamId: true } });
  if (!entry) throw new AccessError("Entrega não encontrada.");
  const jam = await requireJudgeOf(user, entry.jamId);
  if (!canJudge(jamPhase(jam))) throw new AccessError("O período de julgamento está fechado.");
  if ((await conflictedEntryIds(user, jam.id)).has(entryId)) throw new AccessError("Entrega não encontrada.");
  for (const c of jam.criteria) {
    const v = values[c.id];
    if (!Number.isInteger(v) || v < 0 || v > c.maxScore) throw new AccessError(`Dê uma nota de 0 a ${c.maxScore} em “${c.name}”.`);
  }
  const text = feedback.trim().slice(0, 2000);
  await db.$transaction(async (tx) => {
    for (const c of jam.criteria) {
      await tx.jamScore.upsert({
        where: { entryId_criterionId_judgeId: { entryId, criterionId: c.id, judgeId: user.id } },
        create: { entryId, criterionId: c.id, judgeId: user.id, value: values[c.id] },
        update: { value: values[c.id] },
      });
    }
    if (text) await tx.jamFeedback.upsert({ where: { entryId_judgeId: { entryId, judgeId: user.id } }, create: { entryId, judgeId: user.id, text }, update: { text } });
    else await tx.jamFeedback.deleteMany({ where: { entryId, judgeId: user.id } });
  });
  await audit(user, "jam.entrega.avaliar", entryId);
}

// ───────────── Download (arquivos com nome anônimo) ─────────────

/** Quem pode baixar: jurado da jam (sem conflito, a partir do julgamento), organização, ou a própria equipe. */
export async function authorizeDownload(user: CurrentUser, entryId: string) {
  const entry = await db.jamEntry.findUnique({
    where: { id: entryId },
    select: { id: true, jamId: true, anonCode: true, projectKey: true, docKey: true, docExt: true, jam: true, origin: { select: { teamId: true } } },
  });
  if (!entry) throw new AccessError("Arquivo não encontrado.");
  const phase: JamPhase = jamPhase(entry.jam);
  let ok = isJamManager(user);
  let asJudge = false;
  if (!ok) {
    const judge = await db.jamJudge.findUnique({ where: { jamId_userId: { jamId: entry.jamId, userId: user.id } } });
    if (judge && (canJudge(phase) || phase === "ENCERRADA") && !(await conflictedEntryIds(user, entry.jamId)).has(entry.id)) ok = asJudge = true;
  }
  if (!ok && entry.origin) ok = await requireTeam(user, entry.origin.teamId).then(() => true, () => false);
  if (!ok) throw new AccessError("Arquivo não encontrado.");
  return { entry, asJudge };
}

export { audit as auditJam };

/** Escolas para o alcance "escolas convidadas" (só organização). */
export async function listSchoolsForJam(user: CurrentUser) {
  requireManager(user);
  return db.organization.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, city: true, state: true } });
}

// ───────────── Estúdio da equipe (o jogo feito no editor do site) ─────────────

/** Último projeto do estúdio da equipe, ou null. Qualquer membro, o professor e a coordenação podem abrir. */
export async function getTeamStudio(user: CurrentUser, teamId: string) {
  const team = await requireTeam(user, teamId);
  if (!team.studioKey || !team.studioSavedAt) return null;
  return { bytes: await getFile(team.studioKey), savedAt: team.studioSavedAt };
}

/** Guarda o projeto do estúdio (substitui o anterior; vale o último que salvou). */
export async function saveTeamStudio(user: CurrentUser, teamId: string, bytes: Uint8Array) {
  const team = await requireTeam(user, teamId);
  if (jamPhase(team.jam) === "ENCERRADA") throw new AccessError("A jam já terminou.");
  await readSb3(bytes); // valida: zip com project.json, dentro do limite
  const key = await putFile("projetos", bytes);
  const savedAt = new Date();
  await db.jamTeam.update({ where: { id: team.id }, data: { studioKey: key, studioSavedAt: savedAt } });
  if (team.studioKey) await deleteFile(team.studioKey).catch(() => {});
  return savedAt;
}
