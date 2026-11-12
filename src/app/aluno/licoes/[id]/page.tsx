import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/editor/lesson-player";
import { Markdown } from "@/components/markdown";
import { LESSON_KIND, Stars } from "@/components/lesson-icon";
import { buttonClass, Card } from "@/components/ui";
import type { BlocklyState } from "@/lib/blocks/program";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getStudentLesson } from "@/lib/dal/lessons";
import { verifyLessonAction } from "./actions";
import { TheoryDone } from "./theory-done";

export const metadata = { title: "Lição" };


export default async function LicaoPage(props: PageProps<"/aluno/licoes/[id]">) {
  const user = await requireUser(["STUDENT"]);
  const { id } = await props.params;
  const data = await getStudentLesson(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const { lesson, locked, done, stars, position, nextLessonId } = data;
  const track = lesson.module.track;
  const nextHref = nextLessonId ? `/aluno/licoes/${nextLessonId}` : `/aluno/trilhas/${track.id}`;

  if (locked) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-200 text-slate-500" aria-hidden><Lock className="h-9 w-9" /></span>
        <h1 className="text-2xl font-extrabold">Esta lição ainda está trancada</h1>
        <p className="font-semibold text-muted">Termine a lição anterior para liberar esta.</p>
        <Link href={`/aluno/trilhas/${track.id}`} className={buttonClass()}>Voltar para a trilha</Link>
      </Card>
    );
  }

  const isTheory = lesson.type === "TEORIA" || lesson.type === "DEMO";
  const kind = LESSON_KIND[lesson.type];
  const KindIcon = kind.icon;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Link href={`/aluno/trilhas/${track.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-brand">
          <ArrowLeft aria-hidden className="h-4 w-4" /> {track.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[0_4px_0_rgb(15_23_42/0.2)]" style={{ background: kind.color }} aria-hidden>
            <KindIcon className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{lesson.title}</h1>
          <span className="rounded-full border-2 px-3 py-0.5 text-sm font-extrabold text-foreground" style={{ borderColor: kind.color, background: `color-mix(in oklab, ${kind.color} 18%, white)` }}>{kind.label}</span>
          {done && <Stars value={stars} />}
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-muted">
          <span>Lição {position.index} de {position.total} · {lesson.module.title} · {lesson.xp} XP</span>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: position.total }, (_, k) => (
              <span key={k} className={`h-2 w-6 rounded-full ${k < position.index ? "bg-brand" : "bg-black/10"}`} />
            ))}
          </span>
        </div>
      </div>

      <Card className={isTheory ? "space-y-6" : ""}>
        <Markdown source={lesson.content} />
        {isTheory && <TheoryDone lessonId={lesson.id} done={done} />}
      </Card>

      {!isTheory && (
        <LessonPlayer
          lessonId={lesson.id}
          allowedBlocks={lesson.allowedBlocks}
          starterState={(lesson.starterWorkspace as BlocklyState | null) ?? null}
          savedState={(data.savedWorkspace as BlocklyState | null) ?? null}
          nextHref={nextHref}
          verify={verifyLessonAction.bind(null, lesson.id)}
        />
      )}
    </div>
  );
}
