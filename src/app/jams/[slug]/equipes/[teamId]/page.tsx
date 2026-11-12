import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown, PhaseBadge } from "@/components/jams";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getTeam, MAX_DESCRIPTION } from "@/lib/dal/jams";
import { fmtDateTime, phaseTarget, youtubeEmbed } from "@/lib/jams";
import { deleteTeamAction } from "../../../actions";
import { EntryForm } from "./entry-form";

export const metadata = { title: "Entrega da equipe" };

export default async function TeamPage(props: PageProps<"/jams/[slug]/equipes/[teamId]">) {
  const user = await requireUser(["STUDENT", "TEACHER", "ORG_ADMIN"]);
  const { slug, teamId } = await props.params;
  const d = await getTeam(user, teamId).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  if (d.jam.slug !== slug) notFound();
  const target = phaseTarget(d.phase, { startsAt: d.jam.startsAt, endsAt: d.jam.endsAt, judgingEndsAt: d.jam.endsAt });

  return (
    <div className="space-y-6">
      <Link href={`/jams/${slug}`} className="text-sm font-semibold text-brand">← {d.jam.title}</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Equipe {d.team.name}</h1>
          <p className="font-semibold text-muted">{d.team.members.map((m) => `${m.name} (${m.schoolYear}º ano)`).join(", ")} · Tema: {d.jam.theme}</p>
          {d.team.category && <p className="mt-1 inline-block rounded-full bg-brand-soft px-3 py-0.5 text-sm font-extrabold text-brand-shadow">Categoria {d.team.category}</p>}
        </div>
        <PhaseBadge phase={d.phase} />
      </div>
      {target && d.phase !== "JULGAMENTO" && <Countdown to={target.to} label={target.label} />}

      {d.entry && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">Entrega atual: {d.entry.title}</h2>
            <span className="rounded-full bg-black/5 px-3 py-1 font-mono text-sm font-bold">Código anônimo {d.entry.anonCode}</span>
          </div>
          <p className="text-sm text-muted">Última atualização: {fmtDateTime(d.entry.updatedAt)}. Os jurados veem só o código, nunca o nome da equipe ou da escola.</p>
          <p className="whitespace-pre-line">{d.entry.description}</p>
          <div className="aspect-video max-w-lg overflow-hidden rounded-2xl">
            <iframe src={youtubeEmbed(d.entry.youtubeId)} title="Vídeo do jogo" className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/jams/arquivo/${d.entry.id}/projeto`} className={buttonClass("secondary", "sm")}><Download aria-hidden className="h-4 w-4" /> Projeto (.sb3)</a>
            <a href={`/jams/arquivo/${d.entry.id}/documentacao`} className={buttonClass("secondary", "sm")}><Download aria-hidden className="h-4 w-4" /> Documentação (.{d.entry.docExt})</a>
          </div>
        </Card>
      )}

      {d.canSubmit ? (
        <Card>
          <h2 className="mb-3 text-xl font-extrabold">{d.entry ? "Atualizar entrega" : "Fazer a entrega"}</h2>
          <EntryForm teamId={d.team.id} hasEntry={Boolean(d.entry)} maxDescription={MAX_DESCRIPTION} initial={d.entry ? { title: d.entry.title, description: d.entry.description, youtubeUrl: `https://youtu.be/${d.entry.youtubeId}` } : null} />
        </Card>
      ) : (
        <Card>
          <p className="font-semibold text-muted">
            {d.phase === "EM_BREVE" ? `As entregas abrem em ${fmtDateTime(d.jam.startsAt)}. Já podem ir criando o jogo!` : "O prazo de entrega terminou."}
          </p>
        </Card>
      )}

      {d.canDelete && (
        <form action={deleteTeamAction.bind(null, d.team.id, slug)}>
          <button className="text-sm font-semibold text-red-700 underline">Cancelar a inscrição desta equipe</button>
        </form>
      )}
    </div>
  );
}
