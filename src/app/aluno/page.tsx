import { ArrowRight, Map as MapIcon, Rocket, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listStudentTracks } from "@/lib/dal/lessons";
import { listStudentClasses } from "@/lib/dal/org";

export const metadata = { title: "Minhas trilhas" };

const TRACK_COLORS = ["#4C97FF", "#9966FF", "#FFAB19", "#59C059", "#FF8C1A", "#0FBD8C"];

export default async function AlunoPage() {
  const user = await requireUser(["STUDENT"]);
  const [tracks, classes] = await Promise.all([listStudentTracks(user), listStudentClasses(user)]);
  const done = tracks.reduce((a, t) => a + t.done, 0);

  return (
    <div className="space-y-8">
      <section className="clay relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-2/30" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-brand/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Olá, {user.name}!</h1>
            <p className="mt-1 font-semibold text-muted">
              Turma: {classes.map((c) => `${c.name} (Prof. ${c.teacher.name})`).join(", ")}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-brand-2 px-5 py-3 shadow-[0_4px_0_rgb(15_23_42/0.18)]">
              <Star aria-hidden className="h-7 w-7 fill-white text-white" />
              <div className="leading-tight">
                <p className="font-display text-2xl font-extrabold">{user.xp} XP</p>
                <p className="text-xs font-bold text-foreground/70">pontos de experiência</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 rounded-2xl bg-white px-5 py-3 ring-2 ring-line sm:flex">
              <Trophy aria-hidden className="h-7 w-7 text-brand" />
              <div className="leading-tight">
                <p className="font-display text-2xl font-extrabold">{done}</p>
                <p className="text-xs font-bold text-muted">lições feitas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold">
          <MapIcon aria-hidden className="h-6 w-6 text-brand" /> Minhas trilhas
        </h2>
        {tracks.length === 0 && (
          <Card>
            <p className="font-semibold text-muted">Seu professor ainda não liberou nenhuma trilha. Logo, logo vai ter novidade!</p>
          </Card>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {tracks.map((t, i) => {
            const pct = t.total ? Math.round((100 * t.done) / t.total) : 0;
            const color = TRACK_COLORS[i % TRACK_COLORS.length];
            return (
              <article key={t.id} className="clay flex flex-col overflow-hidden">
                <div className="flex items-center gap-4 p-5 text-white" style={{ background: color }}>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/25" aria-hidden>
                    <Rocket className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider opacity-90">Nível {t.level}</p>
                    <h3 className="text-2xl font-extrabold leading-tight">{t.title}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <p className="font-semibold text-muted">{t.description}</p>
                  <div>
                    <div className="flex justify-between text-sm font-extrabold">
                      <span>{t.done} de {t.total} lições</span>
                      <span>{pct}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-4 overflow-hidden rounded-full bg-black/[0.07] shadow-[inset_0_2px_0_rgb(15_23_42/0.06)]"
                      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso na trilha"
                    >
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3">
                    {t.next && (
                      <Link href={`/aluno/licoes/${t.next.id}`} className={buttonClass()}>
                        {t.done ? "Continuar" : "Começar"} <ArrowRight aria-hidden className="h-4 w-4" />
                      </Link>
                    )}
                    <Link href={`/aluno/trilhas/${t.id}`} className={buttonClass("secondary")}>Ver trilha</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
