import { ArrowRight, Award, Lock, Star } from "lucide-react";
import Link from "next/link";
import { Island } from "@/components/island";
import { buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { getAchievements } from "@/lib/dal/badges";
import { listStudentCourses } from "@/lib/dal/lessons";
import { listStudentClasses } from "@/lib/dal/org";

export const metadata = { title: "Meus mundos" };

export default async function AlunoPage() {
  const user = await requireUser(["STUDENT"]);
  const [courses, classes, ach] = await Promise.all([listStudentCourses(user), listStudentClasses(user), getAchievements(user)]);
  const earned = ach.badges.filter((b) => b.awardedAt);
  const tracks = courses.flatMap((c) => c.tracks);
  const done = tracks.reduce((a, t) => a + t.done, 0);
  // próximo passo: o primeiro mundo que ainda tem lição para fazer
  const nextTrack = tracks.find((t) => t.next && t.done < t.total) ?? tracks.find((t) => t.next);

  return (
    <div className="space-y-10">
      {/* Faixa do aluno: quem é, nível e o botão para continuar */}
      <section className="clay flex flex-wrap items-center gap-6 p-5 sm:p-6">
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-star font-display text-3xl font-extrabold text-night shadow-[0_4px_0_rgb(0_0_0/0.35)]">
          {ach.level}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Olá, {user.name}!</h1>
          <p className="font-semibold text-muted">
            {classes.map((c) => `${c.name} · Prof. ${c.teacher.name}`).join(", ")}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-3 max-w-xs flex-1 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-valuenow={ach.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso até o próximo nível">
              <div className="h-full rounded-full bg-star" style={{ width: `${ach.pct}%` }} />
            </div>
            <span className="text-sm font-bold text-muted">{ach.next ? `faltam ${ach.next.xp - user.xp} XP` : "nível máximo!"}</span>
          </div>
        </div>
        <dl className="flex gap-6 text-center">
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">XP</dt>
            <dd className="flex items-center justify-center gap-1 font-display text-2xl font-extrabold"><Star aria-hidden className="h-5 w-5 fill-star text-star" /><span>{user.xp} XP</span></dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">Lições</dt>
            <dd className="font-display text-2xl font-extrabold">{done}</dd>
          </div>
        </dl>
        {nextTrack?.next && (
          <Link href={`/aluno/licoes/${nextTrack.next.id}`} className={buttonClass("primary", "md", "btn-cta w-full text-lg sm:w-auto")}>
            {nextTrack.done ? "Continuar" : "Começar"} <ArrowRight aria-hidden className="h-5 w-5" />
          </Link>
        )}
      </section>

      {courses.length === 0 && (
        <section className="clay p-8 text-center">
          <p className="text-lg font-semibold text-muted">Seu professor ainda não liberou nenhum curso. Logo, logo vai ter novidade!</p>
        </section>
      )}

      {/* Mapa de mundos: uma ilha por trilha */}
      {courses.map((course) => (
        <section key={course.id} className="space-y-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-line pb-3">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-star">Curso</p>
            <h2 className="text-2xl font-extrabold sm:text-3xl">{course.title}</h2>
          </div>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {course.tracks.map((t, i) => {
              const complete = t.total > 0 && t.done >= t.total;
              const current = nextTrack?.id === t.id;
              const [label, ...rest] = t.title.split(" · ");
              return (
                <li key={t.id} className="relative">
                  <Link
                    href={`/aluno/trilhas/${t.id}`}
                    aria-label={`Ver trilha ${t.title}`}
                    aria-current={current ? "step" : undefined}
                    className={`group block rounded-3xl p-2 text-center transition-colors hover:bg-white/5 ${current ? "bg-white/5 ring-2 ring-[#8b6cff]" : ""}`}
                  >
                    {complete && <span className="faixa absolute left-1 top-1 z-10">Concluído</span>}
                    {current && !complete && <span className="faixa absolute left-1 top-1 z-10 !bg-cta">Você está aqui</span>}
                    <Island index={i + 1} className={`mx-auto h-36 w-auto transition-transform duration-200 group-hover:-translate-y-1 ${i % 2 ? "flutua-2" : "flutua"}`} />
                    <p className="font-display text-sm font-extrabold text-star">{rest.length ? label : `Mundo ${i + 1}`}</p>
                    <p className="font-display text-lg font-extrabold leading-tight">{rest.length ? rest.join(" · ") : t.title}</p>
                    <p className="mt-1 text-xs font-bold text-muted">
                      {t.done} de {t.total} lições{t.extras ? ` · +${t.extras} extra${t.extras > 1 ? "s" : ""}` : ""}
                    </p>
                    <div className="mx-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-black/40" aria-hidden>
                      <div className="h-full rounded-full bg-star" style={{ width: `${t.total ? Math.round((100 * t.done) / t.total) : 0}%` }} />
                    </div>
                  </Link>
                  {complete && (
                    <a href={`/certificados/${t.id}`} target="_blank" className="mt-1 inline-flex w-full items-center justify-center gap-1 text-sm font-extrabold text-star underline-offset-2 hover:underline" aria-label={`Certificado da trilha ${t.title}`}>
                      <Award aria-hidden className="h-4 w-4" /> Certificado
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {/* Nível e medalhas */}
      <section aria-labelledby="nivel" className="clay space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="nivel" className="text-xl font-extrabold">Nível {ach.level}: {ach.title}</h2>
          <p className="text-sm font-bold text-muted">{ach.next ? `Próximo: ${ach.next.title}` : "Você chegou ao nível máximo!"}</p>
        </div>
        <h3 className="font-display text-lg font-extrabold">Minhas medalhas ({earned.length}/{ach.badges.length})</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {ach.badges.map((b) => (
            <li
              key={b.id}
              title={b.description}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center ${b.awardedAt ? "border-star bg-white/5" : "border-dashed border-line opacity-60 grayscale"}`}
            >
              {b.isNew && <span className="absolute -right-1 -top-2 rounded-full bg-cta px-2 text-[11px] font-extrabold text-night">Nova!</span>}
              {b.awardedAt ? <span aria-hidden className="text-3xl">{b.icon}</span> : <Lock aria-hidden className="h-8 w-8 text-muted" />}
              <span className="text-sm font-extrabold leading-tight">{b.name}</span>
              <span className="text-xs font-semibold text-muted">{b.awardedAt ? "Conquistada" : b.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
