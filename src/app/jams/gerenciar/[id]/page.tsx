import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhaseBadge } from "@/components/jams";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getJamForManager, isJamManager, listSchoolsForJam } from "@/lib/dal/jams";
import { toBrasiliaInput } from "@/lib/jams";
import { ROLE_LABEL } from "@/lib/roles";
import { removeJudgeAction, setPublishedAction } from "../../actions";
import { JamForm } from "../../jam-form";
import { AddJudgeForm } from "./judge-form";

export const metadata = { title: "Gerenciar jam" };

export default async function GerenciarJamPage(props: PageProps<"/jams/gerenciar/[id]">) {
  const user = await requireUser();
  if (!isJamManager(user)) redirect("/jams");
  const { id } = await props.params;
  const created = (await props.searchParams).criada === "1";
  const [{ jam, phase, entries }, schools] = await Promise.all([
    getJamForManager(user, id).catch((e) => {
      if (e instanceof AccessError) notFound();
      throw e;
    }),
    listSchoolsForJam(user),
  ]);
  const scored = entries.some((e) => e.judgesScored > 0);

  return (
    <div className="space-y-6">
      <Link href="/jams" className="text-sm font-semibold text-brand">← Game Jam</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader icon={<Settings className="h-7 w-7" />} title={jam.title} subtitle={`${jam._count.teams} equipes inscritas · ${jam._count.entries} entregas`} />
        <div className="flex flex-wrap items-center gap-3">
          <PhaseBadge phase={phase} />
          {jam.published && <Link href={`/jams/${jam.slug}`} className="btn btn-secondary btn-sm">Ver página</Link>}
          <form action={setPublishedAction.bind(null, jam.id, !jam.published)}>
            <button className={`btn btn-sm ${jam.published ? "btn-secondary" : "btn-success"}`}>{jam.published ? "Despublicar" : "Publicar jam"}</button>
          </form>
        </div>
      </div>
      {created && <p role="status" className="rounded-2xl bg-green-50 px-4 py-2 font-bold text-green-800">Jam criada como rascunho. Convide os jurados e publique quando estiver pronta.</p>}

      <Card>
        <h2 className="mb-1 text-lg font-bold">Jurados ({jam.judges.length})</h2>
        <p className="mb-3 text-sm text-muted">Jurados veem só o código anônimo de cada entrega. Quem é de uma escola não avalia entregas da própria escola.</p>
        <ul className="mb-4 divide-y divide-line">
          {jam.judges.map(({ user: j }) => (
            <li key={j.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span><strong>{j.name}</strong> <span className="text-muted">{j.email} · {ROLE_LABEL[j.role]}</span></span>
              <form action={removeJudgeAction.bind(null, jam.id, j.id)}><button className="btn btn-secondary btn-sm">Remover</button></form>
            </li>
          ))}
          {jam.judges.length === 0 && <li className="py-2 text-sm text-muted">Nenhum jurado ainda.</li>}
        </ul>
        <AddJudgeForm jamId={jam.id} />
      </Card>

      {jam.categories.length > 0 && (
        <Card>
          <h2 className="mb-2 text-lg font-bold">Categorias</h2>
          <ul className="flex flex-wrap gap-2">
            {jam.categories.map((c) => (
              <li key={c.id} className="rounded-2xl border-2 border-line px-3 py-1 text-sm font-bold">{c.name} · {c._count.teams} equipes · {c._count.entries} entregas</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-1 text-lg font-bold">Andamento do julgamento</h2>
        <p className="mb-3 text-sm text-muted">Mostrado só pelo código anônimo. As escolas aparecem no resultado, depois do fim do julgamento.</p>
        <div className="flex flex-wrap gap-2">
          {entries.map((e) => (
            <span key={e.anonCode} className="rounded-2xl border-2 border-line px-3 py-1 text-sm font-bold">
              <span className="font-mono">{e.anonCode}</span>{e.category ? ` · ${e.category}` : ""} · {e.judgesScored}/{jam.judges.length} jurados
            </span>
          ))}
          {entries.length === 0 && <span className="text-sm text-muted">Nenhuma entrega ainda.</span>}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Editar jam</h2>
        <JamForm
          jamId={jam.id}
          schools={schools}
          criteriaLocked={scored}
          categoriesLocked={jam._count.teams > 0}
          initial={{
            title: jam.title, theme: jam.theme, description: jam.description, scope: jam.scope,
            states: jam.states, cities: jam.cities, orgIds: jam.orgIds,
            startsAt: toBrasiliaInput(jam.startsAt), endsAt: toBrasiliaInput(jam.endsAt), judgingEndsAt: toBrasiliaInput(jam.judgingEndsAt),
            maxTeamSize: jam.maxTeamSize,
            criteria: jam.criteria.map((c) => ({ name: c.name, weight: c.weight, maxScore: c.maxScore })),
            prizes: jam.prizes.map((p) => ({ title: p.title, description: p.description, recipient: p.recipient })),
            categories: jam.categories.map((c) => ({ minYear: c.minYear, maxYear: c.maxYear })),
          }}
        />
      </Card>
    </div>
  );
}
