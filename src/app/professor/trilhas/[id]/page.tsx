import { ArrowLeft, Clock, GraduationCap, Map as MapIcon, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSON_KIND } from "@/components/lesson-icon";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getCatalogTrack } from "@/lib/dal/lessons";

export const metadata = { title: "Trilha" };

const minutesOf = (guide: string | null) => Number(/Tempo sugerido:\*\* (\d+)/.exec(guide ?? "")?.[1] ?? 0);

export default async function TrilhaProfessorPage(props: PageProps<"/professor/trilhas/[id]">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const { id } = await props.params;
  const track = await getCatalogTrack(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const all = track.modules.flatMap((m) => m.lessons);
  const total = all.reduce((sum, l) => sum + minutesOf(l.teacherGuide), 0);
  const number = new Map(all.map((l, i) => [l.id, i + 1]));

  return (
    <div className="space-y-6">
      <Link href="/professor/trilhas" className="inline-flex items-center gap-1 text-sm font-extrabold text-brand">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Currículo{track.course ? ` · ${track.course.title}` : ""}
      </Link>
      <PageHeader
        icon={<MapIcon className="h-7 w-7" />}
        title={track.title}
        subtitle={`${track.description} · cerca de ${Math.max(1, Math.round(total / 50))} aula(s) de 50 min`}
      />
      {track.story && <p className="clay border-l-8 !border-l-brand-2 p-5 font-semibold italic text-muted">{track.story}</p>}

      {track.modules.map((m) => (
        <section key={m.id} className="space-y-3">
          <h2 className="text-xl font-extrabold">{m.title}</h2>
          {m.lessons.map((l) => {
            const kind = LESSON_KIND[l.type];
            const Icon = kind.icon;
            const min = minutesOf(l.teacherGuide);
            const where = l.mode === "SB3" ? " · PictoBlox (opcional)" : l.optional ? " · opcional" : l.type === "TEORIA" ? "" : " · editor do site";
            return (
              <details key={l.id} className="clay group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: kind.color }} aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-muted">{number.get(l.id)}. {kind.label}{where}</span>
                    <span className="block font-extrabold">{l.title}</span>
                  </span>
                  {l.mode === "SB3" && <Rocket aria-label="Missão no PictoBlox" className="h-5 w-5 text-brand" />}
                  {min > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-muted"><Clock aria-hidden className="h-4 w-4" /> {min} min</span>
                  )}
                  <span aria-hidden className="text-muted transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="grid gap-5 border-t-2 border-line p-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">O que o aluno vê</p>
                    <Markdown source={l.content} />
                    {l.extra && (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                        <p className="mb-1 flex items-center gap-1 text-sm font-extrabold text-amber-800"><Sparkles aria-hidden className="h-4 w-4" /> Desafio extra</p>
                        <Markdown source={l.extra} />
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl bg-brand-soft p-4">
                    <p className="mb-2 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-brand-shadow">
                      <GraduationCap aria-hidden className="h-4 w-4" /> Guia do professor
                    </p>
                    {l.teacherGuide ? <Markdown source={l.teacherGuide} /> : <p className="text-sm text-muted">Sem guia para esta lição.</p>}
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      ))}
    </div>
  );
}
