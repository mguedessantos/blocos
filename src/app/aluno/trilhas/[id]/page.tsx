import { ArrowLeft, Check, Lock, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSON_KIND, Stars } from "@/components/lesson-icon";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getStudentTrack } from "@/lib/dal/lessons";

export const metadata = { title: "Trilha" };

// Mapa da trilha em zigue-zague, como um caminho de jogo.
const OFFSETS = ["sm:ml-0", "sm:ml-24", "sm:ml-48", "sm:ml-24"];

export default async function TrilhaPage(props: PageProps<"/aluno/trilhas/[id]">) {
  const user = await requireUser(["STUDENT"]);
  const { id } = await props.params;
  const track = await getStudentTrack(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const modules = [...new Map(track.lessons.map((l) => [l.module.id, l.module])).values()];
  const current = track.lessons.find((l) => !l.done && !l.locked)?.id;
  let n = 0;

  return (
    <div className="space-y-8">
      <Link href="/aluno" className="inline-flex items-center gap-1 text-sm font-extrabold text-brand"><ArrowLeft aria-hidden className="h-4 w-4" /> Minhas trilhas</Link>
      <PageHeader icon={<MapIcon className="h-7 w-7" />} title={track.title} subtitle={track.description} />
      {track.story && <p className="clay border-l-8 !border-l-brand-2 p-5 font-semibold italic text-muted">{track.story}</p>}

      {modules.map((m, mi) => (
        <section key={m.id} className="clay p-6">
          <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-soft text-sm text-brand-shadow">{mi + 1}</span>
            {m.title}
          </h2>
          <ol className="space-y-3">
            {track.lessons.filter((l) => l.module.id === m.id).map((l) => {
              const kind = LESSON_KIND[l.type];
              const Icon = l.locked ? Lock : l.done ? Check : kind.icon;
              const offset = OFFSETS[n++ % OFFSETS.length];
              const isCurrent = l.id === current;
              const node = (
                <>
                  <span
                    className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-white text-white ${isCurrent ? "animate-bounce motion-reduce:animate-none" : ""}`}
                    style={{ background: l.locked ? "#CBD5E1" : l.done ? "#16A34A" : kind.color, boxShadow: "0 5px 0 rgb(15 23 42 / 0.2)" }}
                    aria-hidden
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-muted">{l.optional ? "Extra opcional" : kind.label}{l.mode === "SB3" ? " · PictoBlox 🚀" : ""}</span>
                    <span className="block text-lg font-extrabold leading-tight">{l.title}</span>
                    <span className="mt-0.5 block text-sm font-bold text-muted">
                      {l.done ? <Stars value={l.stars} /> : l.locked ? "Trancada" : `${l.xp} XP`}
                    </span>
                  </span>
                </>
              );
              const cls = `flex w-full items-center gap-4 rounded-3xl p-3 sm:w-fit sm:pr-8 ${offset} ${l.optional ? "border-2 border-dashed border-line" : ""}`;
              return (
                <li key={l.id}>
                  {l.locked ? (
                    <div className={`${cls} opacity-60`} aria-label={`${l.title} (trancada)`}>{node}</div>
                  ) : (
                    <Link
                      href={`/aluno/licoes/${l.id}`}
                      aria-current={isCurrent ? "step" : undefined}
                      className={`${cls} transition-colors hover:bg-brand-soft ${isCurrent ? "bg-brand-soft ring-2 ring-brand" : ""}`}
                    >
                      {node}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
