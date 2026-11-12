import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown, PhaseBadge } from "@/components/jams";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getJudgeJam } from "@/lib/dal/jams";
import { fmtDateTime } from "@/lib/jams";

export const metadata = { title: "Avaliar" };

export default async function JudgeJamPage(props: PageProps<"/jurado/[jamId]">) {
  const user = await requireUser(["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"]);
  const { jamId } = await props.params;
  const d = await getJudgeJam(user, jamId).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const done = d.entries.filter((e) => e.scored).length;
  return (
    <div className="space-y-6">
      <Link href="/jurado" className="text-sm font-semibold text-brand">← Jams</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{d.jam.title}</h1>
          <p className="font-semibold text-muted">Tema: {d.jam.theme}</p>
        </div>
        <PhaseBadge phase={d.phase} />
      </div>
      {d.phase === "JULGAMENTO" && <Countdown to={d.jam.judgingEndsAt.toISOString()} label="Julgamento termina em" />}
      {d.phase === "EM_BREVE" || d.phase === "EM_ANDAMENTO" || d.phase === "RASCUNHO" ? (
        <Card><p className="font-semibold text-muted">O julgamento começa quando as entregas fecharem, em {fmtDateTime(d.jam.endsAt)}.</p></Card>
      ) : (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Entregas ({done}/{d.entries.length} avaliadas)</h2>
          {d.conflicts > 0 && <p className="mb-2 text-sm text-muted">{d.conflicts} entrega(s) da sua própria escola não aparecem aqui (conflito de interesse).</p>}
          {[...new Set(d.entries.map((e) => e.category))].map((cat) => (
          <section key={cat} className="mt-3">
          <h3 className="mb-2 font-extrabold text-brand">Categoria {cat}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {d.entries.filter((e) => e.category === cat).map((e) => (
              <li key={e.id}>
                <Link href={`/jurado/${jamId}/${e.anonCode}`} className="clay clay-hover flex items-center gap-3 p-4">
                  {e.scored ? <CheckCircle2 aria-label="Avaliada" className="h-6 w-6 text-green-600" /> : <Circle aria-label="Pendente" className="h-6 w-6 text-muted" />}
                  <span>
                    <span className="block font-mono text-lg font-extrabold">Projeto {e.anonCode}</span>
                    <span className="text-sm font-semibold text-muted">{e.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          </section>
          ))}
          {d.entries.length === 0 && <p className="text-sm text-muted">Nenhuma entrega para avaliar.</p>}
        </Card>
      )}
    </div>
  );
}
