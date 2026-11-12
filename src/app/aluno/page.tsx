import { ArrowRight, Map as MapIcon, Rocket, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { getAchievements } from "@/lib/dal/badges";
import { listStudentCourses } from "@/lib/dal/lessons";
import { listStudentClasses } from "@/lib/dal/org";

export const metadata = { title: "Minhas trilhas" };

const TRACK_COLORS = ["#4C97FF", "#9966FF", "#FFAB19", "#59C059", "#FF8C1A", "#0FBD8C"];

export default async function AlunoPage() {
  const user = await requireUser(["STUDENT"]);
  const [courses, classes, ach] = await Promise.all([listStudentCourses(user), listStudentClasses(user), getAchievements(user)]);
  const earned = ach.badges.filter((b) => b.awardedAt);
  const done = courses.flatMap((c) => c.tracks).reduce((a, t) => a + t.done, 0);

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
                <p className="text-xs font-bold text-foreground/70">Nível {ach.level} · {ach.title}</p>
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

      <section aria-labelledby="nivel" className="clay space-y-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="nivel" className="text-xl font-extrabold">Nível {ach.level}: {ach.title}</h2>
          <p className="text-sm font-bold text-muted">
            {ach.next ? `Faltam ${ach.next.xp - user.xp} XP para virar ${ach.next.title}` : "Você chegou ao nível máximo!"}
          </p>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-black/[0.07]" role="progressbar" aria-valuenow={ach.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso até o próximo nível">
          <div className="h-full rounded-full bg-brand-2" style={{ width: `${ach.pct}%` }} />
        </div>
        <h3 className="pt-2 font-display text-lg font-extrabold">Minhas medalhas ({earned.length}/{ach.badges.length})</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {ach.badges.map((b) => (
            <li
              key={b.id}
              title={b.description}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center ${b.awardedAt ? "border-brand-2 bg-white" : "border-dashed border-line opacity-60 grayscale"}`}
            >
              {b.isNew && (
                <span className="absolute -right-1 -top-2 rounded-full bg-red-600 px-2 text-[11px] font-extrabold text-white">Nova!</span>
              )}
              <span aria-hidden className="text-3xl">{b.awardedAt ? b.icon : "🔒"}</span>
              <span className="text-sm font-extrabold leading-tight">{b.name}</span>
              <span className="text-xs font-semibold text-muted">{b.awardedAt ? "Conquistada" : b.description}</span>
            </li>
          ))}
        </ul>
      </section>

      {courses.length === 0 && (
        <Card>
          <p className="font-semibold text-muted">Seu professor ainda não liberou nenhum curso. Logo, logo vai ter novidade!</p>
        </Card>
      )}
      {courses.map((course) => (
      <section key={course.id} className="space-y-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Curso</p>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold">
            <MapIcon aria-hidden className="h-6 w-6 text-brand" /> {course.title}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {course.tracks.map((t, i) => {
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
                      <span>{t.done} de {t.total} lições{t.extras ? ` · +${t.extras} extra${t.extras > 1 ? "s" : ""}` : ""}</span>
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
                    <Link href={`/aluno/trilhas/${t.id}`} className={buttonClass("secondary")} aria-label={`Ver trilha ${t.title}`}>Ver trilha</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      ))}
    </div>
  );
}
