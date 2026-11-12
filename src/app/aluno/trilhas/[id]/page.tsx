import { ArrowLeft, Lock, Rocket } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Island } from "@/components/island";
import { LESSON_KIND, Stars } from "@/components/lesson-icon";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getStudentTrack } from "@/lib/dal/lessons";

export const metadata = { title: "Mundo" };

export default async function TrilhaPage(props: PageProps<"/aluno/trilhas/[id]">) {
  const user = await requireUser(["STUDENT"]);
  const { id } = await props.params;
  const track = await getStudentTrack(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const current = track.lessons.find((l) => !l.done && !l.locked)?.id;
  const [label, ...rest] = track.title.split(" · ");
  const name = rest.length ? rest.join(" · ") : track.title;
  const required = track.lessons.filter((l) => !l.optional);
  const doneCount = required.filter((l) => l.done).length;
  let n = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b-2 border-line pb-3">
        <Link href="/aluno" className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Meus mundos
        </Link>
        <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
        <p className="font-display text-lg font-extrabold text-star">{rest.length ? label : `Mundo ${track.worldIndex}`}</p>
        <h1 className="text-3xl font-extrabold">{name}</h1>
        <span className="ml-auto text-sm font-bold text-muted">{doneCount} de {required.length} lições</span>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* A ilha do mundo e a história */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <Island index={track.worldIndex} className="flutua mx-auto h-72 w-auto sm:h-80" title={`Ilha do mundo ${name}`} />
          <p className="text-center font-semibold text-muted">{track.description}</p>
          {track.story && (
            <figure className="clay flex gap-3 p-4">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-star font-display text-lg font-extrabold text-night">!</span>
              <blockquote className="font-semibold italic">{track.story}</blockquote>
            </figure>
          )}
        </div>

        {/* Lista numerada de lições */}
        <ol className="space-y-3">
          {track.lessons.map((l) => {
            const kind = LESSON_KIND[l.type];
            const isCurrent = l.id === current;
            const num = l.optional ? "★" : String(++n);
            const body = (
              <>
                <span
                  className={`hexa shrink-0 ${l.done ? "bg-star text-night" : isCurrent ? "bg-cta text-night" : l.locked ? "bg-[#2a2560] text-muted" : "bg-[#7a55f5] text-white"}`}
                  aria-hidden
                >
                  {l.locked ? <Lock className="h-5 w-5" /> : num}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-muted">
                    {l.optional ? "Missão extra" : kind.label}
                    {l.mode === "SB3" && <span className="ml-1 inline-flex items-center gap-1 text-star"><Rocket aria-hidden className="h-3 w-3" /> PictoBlox</span>}
                  </span>
                  <span className="block font-display text-lg font-extrabold leading-tight">{l.title}</span>
                  <span className="block text-sm font-bold text-muted">{l.done ? <Stars value={l.stars} /> : l.locked ? "Trancada" : `${l.xp} XP`}</span>
                </span>
                {l.done && <span className="faixa absolute -bottom-1 right-3">Concluído</span>}
                {isCurrent && <span className="faixa absolute -bottom-1 right-3 !bg-cta">Você está aqui</span>}
              </>
            );
            const cls = `relative flex items-center gap-4 rounded-2xl border-2 px-3 py-3 pr-6 ${
              l.optional ? "border-dashed border-[#5a4fa8]" : "border-line"
            } ${isCurrent ? "!border-[#8b6cff] bg-[#231c5c] shadow-[0_0_0_4px_rgb(139_108_255/0.2)]" : "bg-surface"}`;
            return (
              <li key={l.id}>
                {l.locked ? (
                  <div className={`${cls} opacity-60`} aria-label={`${l.title} (trancada)`}>{body}</div>
                ) : (
                  <Link href={`/aluno/licoes/${l.id}`} aria-current={isCurrent ? "step" : undefined} className={`${cls} transition-[transform,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-[#8b6cff]`}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
