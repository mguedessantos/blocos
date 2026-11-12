import { Gavel, Plus, Settings, Trophy } from "lucide-react";
import Link from "next/link";
import { Countdown, PhaseBadge } from "@/components/jams";
import { buttonClass, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { isJamManager, listJams } from "@/lib/dal/jams";
import { phaseTarget, type JamPhase } from "@/lib/jams";

export const metadata = { title: "Game Jam" };

const ORDER: JamPhase[] = ["EM_ANDAMENTO", "EM_BREVE", "JULGAMENTO", "RASCUNHO", "ENCERRADA"];

export default async function JamsPage() {
  const user = await requireUser();
  const jams = (await listJams(user)).sort((a, b) => ORDER.indexOf(a.phase) - ORDER.indexOf(b.phase));
  const manager = isJamManager(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader icon={<Trophy className="h-7 w-7" />} title="Game Jam" subtitle="Crie um jogo com sua equipe, entregue no prazo e concorra a prêmios. O julgamento é às cegas!" />
        {manager && <Link href="/jams/nova" className={buttonClass()}><Plus aria-hidden className="h-4 w-4" /> Criar jam</Link>}
      </div>

      {jams.length === 0 && <Card><p className="font-semibold text-muted">Nenhuma game jam aberta para a sua escola agora. Fique de olho!</p></Card>}

      <div className="grid gap-5 md:grid-cols-2">
        {jams.map((j) => {
          const target = phaseTarget(j.phase, j);
          return (
            <article key={j.id} className="clay flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PhaseBadge phase={j.phase} />
                <span className="text-xs font-bold text-muted">{j._count.teams} equipes · {j._count.entries} entregas</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold leading-tight">{j.title}</h2>
                <p className="font-semibold text-muted">Tema: {j.theme}</p>
              </div>
              {target && <Countdown to={target.to} label={target.label} />}
              {j.prizes.length > 0 && (
                <ul className="space-y-1 text-sm font-semibold">
                  {j.prizes.slice(0, 3).map((p) => (
                    <li key={p.place}>🏅 {p.place}º lugar: {p.title} <span className="text-muted">({p.recipient === "ESCOLA" ? "para a escola" : "para a equipe"})</span></li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link href={`/jams/${j.slug}`} className={buttonClass()}>Ver jam</Link>
                {j.isJudge && <Link href={`/jurado/${j.id}`} className={buttonClass("secondary")}><Gavel aria-hidden className="h-4 w-4" /> Avaliar</Link>}
                {manager && <Link href={`/jams/gerenciar/${j.id}`} className={buttonClass("secondary")}><Settings aria-hidden className="h-4 w-4" /> Gerenciar</Link>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
