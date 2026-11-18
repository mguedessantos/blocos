import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhaseBadge } from "@/components/jams";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getJamForManager, isJamManager, listSchoolsForJam } from "@/lib/dal/jams";
import { FINALISTS_PER_CATEGORY, fmtDateTime, toBrasiliaInput } from "@/lib/jams";
import { ROLE_LABEL } from "@/lib/roles";
import { removeJudgeAction, setPublishedAction } from "../../actions";
import { JamForm } from "../../jam-form";
import { AddJudgeForm, CloseJudgingForm } from "./judge-form";

export const metadata = { title: "Gerenciar jam" };

export default async function GerenciarJamPage(props: PageProps<"/jams/gerenciar/[id]">) {
  const user = await requireUser();
  if (!isJamManager(user)) redirect("/jams");
  const { id } = await props.params;
  const created = (await props.searchParams).criada === "1";
  const [{ jam, phase, entries, finalists, pending }, schools] = await Promise.all([
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

      {(phase === "JULGAMENTO" || phase === "ENCERRADA") && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Finalistas</h2>
          <p className="mb-3 text-sm text-muted">
            Os {FINALISTS_PER_CATEGORY} primeiros de cada categoria pela nota final (0 a 100, média dos jurados), para o julgamento final. Empate no {FINALISTS_PER_CATEGORY}º lugar entra também. Mostrado só pelo código anônimo.
          </p>
          {finalists.length === 0 && <p className="text-sm text-muted">Nenhuma entrega com nota ainda.</p>}
          <div className="space-y-4">
            {finalists.map((g) => (
              <section key={g.category} aria-label={`Finalistas ${g.category}`}>
                <h3 className="mb-2 font-extrabold">{g.category}</h3>
                <ol className="divide-y divide-line">
                  {g.entries.map((e) => (
                    <li key={e.entryId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                      <span className="w-8 font-extrabold">{e.place}º</span>
                      <span className="font-mono font-bold">{e.anonCode}</span>
                      <span className="min-w-0 flex-1 font-semibold">{e.title}</span>
                      <span className="font-extrabold">{e.score?.toLocaleString("pt-BR")} pts</span>
                      <span className="text-muted">{e.judges} {e.judges === 1 ? "jurado" : "jurados"}</span>
                      <a href={`https://youtu.be/${e.youtubeId}`} target="_blank" className="font-semibold text-brand underline">Vídeo</a>
                      <a href={`/jams/arquivo/${e.entryId}/projeto`} className="font-semibold text-brand underline">Projeto</a>
                      <a href={`/jams/arquivo/${e.entryId}/documentacao`} className="font-semibold text-brand underline">Documentação</a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </Card>
      )}

      {jam.resultsSentAt && (
        <Card>
          <p role="status" className="font-bold">Julgamento encerrado em {fmtDateTime(jam.resultsSentAt)}. O resultado foi enviado às equipes.</p>
        </Card>
      )}

      {phase === "JULGAMENTO" && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Encerrar julgamento</h2>
          <p className="mb-3 text-sm text-muted">
            O resultado só é revelado quando você encerra, e só depois que todas as entregas forem avaliadas. Cada professor recebe por email a colocação da equipe,
            se ela está entre os finalistas e os próximos passos; os alunos veem tudo na página da jam. Equipes sem entrega completa ficam desclassificadas.
          </p>
          <CloseJudgingForm jamId={jam.id} pending={pending} />
        </Card>
      )}

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
