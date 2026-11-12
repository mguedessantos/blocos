import { Gavel, Settings, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown, PhaseBadge } from "@/components/jams";
import { Markdown } from "@/components/markdown";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getJam, listTeamCandidates } from "@/lib/dal/jams";
import { fmtDateTime, phaseTarget, youtubeEmbed } from "@/lib/jams";
import { CreateTeamForm } from "./team-form";

export const metadata = { title: "Game Jam" };

const SCOPE_TEXT = { PLATAFORMA: "Escolas de todo o Brasil", ESTADOS: "Escolas de", CIDADES: "Escolas de", ESCOLAS: "Escolas convidadas" } as const;

export default async function JamPage(props: PageProps<"/jams/[slug]">) {
  const user = await requireUser();
  const { slug } = await props.params;
  const d = await getJam(user, slug).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const { jam, phase } = d;
  const target = phaseTarget(phase, jam);
  const candidates = d.canCreateTeams ? await listTeamCandidates(user, jam.id) : [];
  const where = jam.scope === "ESTADOS" ? ` ${jam.states.join(", ")}` : jam.scope === "CIDADES" ? ` ${jam.cities.join(", ")}` : "";

  return (
    <div className="space-y-6">
      <Link href="/jams" className="text-sm font-semibold text-brand">← Game Jam</Link>

      <section className="clay relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-brand-2/30" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={phase} />
            <span className="text-sm font-bold text-muted">{SCOPE_TEXT[jam.scope]}{where} · equipes de até {jam.maxTeamSize}</span>
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{jam.title}</h1>
          <p className="text-xl font-bold">Tema: <span className="text-brand">{jam.theme}</span></p>
          {target && <Countdown to={target.to} label={target.label} size="lg" />}
          <p className="text-sm font-semibold text-muted">
            Entregas de {fmtDateTime(jam.startsAt)} até {fmtDateTime(jam.endsAt)} · resultado em {fmtDateTime(jam.judgingEndsAt)} (horário de Brasília)
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {d.isJudge && <Link href={`/jurado/${jam.id}`} className={buttonClass("secondary", "sm")}><Gavel aria-hidden className="h-4 w-4" /> Avaliar entregas</Link>}
            {d.manager && <Link href={`/jams/gerenciar/${jam.id}`} className={buttonClass("secondary", "sm")}><Settings aria-hidden className="h-4 w-4" /> Gerenciar</Link>}
          </div>
        </div>
      </section>

      {jam.prizes.length > 0 && (
        <section aria-labelledby="premios" className="space-y-3">
          <h2 id="premios" className="flex items-center gap-2 text-2xl font-extrabold"><Trophy aria-hidden className="h-6 w-6 text-brand" /> Prêmios</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {jam.prizes.map((p) => (
              <div key={p.id} className="clay p-4">
                <p className="font-display text-3xl font-extrabold">{p.place}º</p>
                <p className="text-lg font-extrabold">{p.title}</p>
                {p.description && <p className="text-sm font-semibold text-muted">{p.description}</p>}
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-brand">{p.recipient === "ESCOLA" ? "Para a escola" : "Para a equipe"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.results && (
        <Card className="space-y-4">
          <h2 className="text-2xl font-extrabold">Resultado</h2>
          <ol className="space-y-3">
            {d.results.map((r) => (
              <li key={r.entryId} className={`rounded-2xl border-2 p-4 ${r.isMine ? "border-brand bg-brand-soft/40" : "border-line"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-extrabold">
                    {r.place ? `${r.place}º` : "—"} · {r.title} <span className="font-mono text-sm text-muted">({r.anonCode})</span>
                  </p>
                  <span className="font-display text-xl font-extrabold">{r.score !== null ? `${r.score.toLocaleString("pt-BR")} pts` : "sem notas"}</span>
                </div>
                <p className="text-sm font-semibold text-muted">{r.team} · {r.school}</p>
                {r.prize && <p className="mt-1 font-bold">🏅 {r.prize.title} ({r.prize.recipient === "ESCOLA" ? "para a escola" : "para a equipe"})</p>}
                {r.feedback.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-extrabold">O que os jurados disseram:</p>
                    {r.feedback.map((f, i) => <blockquote key={i} className="rounded-xl bg-white px-3 py-2 text-sm">{f}</blockquote>)}
                  </div>
                )}
                {r.place !== null && r.place <= 3 && (
                  <div className="mt-3 aspect-video max-w-md overflow-hidden rounded-xl">
                    <iframe src={youtubeEmbed(r.youtubeId)} title={`Vídeo de ${r.title}`} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {(d.teams.length > 0 || d.canCreateTeams) && (
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold"><Users aria-hidden className="h-6 w-6 text-brand" /> {user.role === "STUDENT" ? "Minha equipe" : "Equipes"}</h2>
          <ul className="space-y-2">
            {d.teams.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-line p-3">
                <span>
                  <strong>{t.name}</strong>
                  <span className="block text-sm text-muted">{t.members.map((m) => m.name).join(", ")}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${t.entry ? "text-green-700" : "text-muted"}`}>{t.entry ? `✓ Entregue (código ${t.entry.anonCode})` : "Sem entrega"}</span>
                  <Link href={`/jams/${jam.slug}/equipes/${t.id}`} className={buttonClass(t.entry ? "secondary" : "primary", "sm")}>{t.entry ? "Ver entrega" : "Entregar"}</Link>
                </span>
              </li>
            ))}
            {d.teams.length === 0 && <li className="text-sm text-muted">{user.role === "STUDENT" ? "Você ainda não está em uma equipe. Fale com seu professor!" : "Nenhuma equipe inscrita ainda."}</li>}
          </ul>
          {d.canCreateTeams && <CreateTeamForm jamId={jam.id} slug={jam.slug} maxTeamSize={jam.maxTeamSize} candidates={candidates} />}
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-2xl font-extrabold">Regras e informações</h2>
        <Markdown source={jam.description} />
        <h3 className="mt-5 text-lg font-extrabold">O que entregar</h3>
        <ul className="ml-5 list-disc space-y-1 text-sm font-semibold">
          <li>O projeto do jogo (arquivo .sb3 do PictoBlox ou Scratch).</li>
          <li>Uma descrição curta do jogo.</li>
          <li>Um link do YouTube com o jogo funcionando (pode ser “não listado”).</li>
          <li>A documentação com as etapas de desenvolvimento (PDF ou Word).</li>
        </ul>
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          Julgamento às cegas: não coloque o nome da escola, da cidade ou dos alunos no jogo, no vídeo, no canal do YouTube nem na documentação.
        </p>
        {jam.criteria.length > 0 && (
          <>
            <h3 className="mt-5 text-lg font-extrabold">Como os jurados avaliam</h3>
            <ul className="mt-1 flex flex-wrap gap-2">
              {jam.criteria.map((c) => <li key={c.name} className="rounded-full bg-black/5 px-3 py-1 text-sm font-bold">{c.name}{c.weight !== 1 ? ` (peso ${c.weight.toLocaleString("pt-BR")})` : ""}</li>)}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
