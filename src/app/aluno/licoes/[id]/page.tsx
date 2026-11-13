import { ArrowLeft, Lock, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/editor/lesson-player";
import { Sb3Upload } from "@/components/editor/sb3-upload";
import { Markdown } from "@/components/markdown";
import { LESSON_KIND, Stars } from "@/components/lesson-icon";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getStudentLesson } from "@/lib/dal/lessons";
import { verifyLessonAction } from "./actions";
import { TheoryDone } from "./theory-done";
import { objectivesOf } from "@/lib/checker";

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

  // Exercícios no editor: tela cheia (título na barra do topo, missão na coluna da esquerda).
  if (!isTheory && lesson.mode !== "SB3") {
    return (
      <LessonPlayer
        lessonId={lesson.id}
        allowedBlocks={lesson.allowedBlocks}
        objectives={objectivesOf(lesson.checks)}
        checks={lesson.checks}
        starter={lesson.starterWorkspace}
        saved={data.savedWorkspace}
        nextHref={nextHref}
        verify={verifyLessonAction.bind(null, lesson.id)}
        header={
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={`/aluno/trilhas/${track.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
              <ArrowLeft aria-hidden className="h-4 w-4" /> {track.title}
            </Link>
            <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
            <span className="font-display text-sm font-extrabold text-star">Lição {position.index} de {position.total}</span>
            <h1 className="truncate text-xl font-extrabold sm:text-2xl">{lesson.title}</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold text-night" style={{ background: kind.color }}>{kind.label}</span>
            {lesson.optional && <span className="rounded-full border-2 border-dashed border-line px-2.5 py-0.5 text-xs font-extrabold text-muted">Extra opcional</span>}
            {done && <Stars value={stars} />}
          </div>
        }
        mission={<Markdown source={lesson.content} />}
        extra={
          lesson.extra && (
            <details className="clay group p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
                <Sparkles aria-hidden className="h-5 w-5 text-star" /> Desafio extra (opcional)
                <span aria-hidden className="ml-auto text-muted transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-3"><Markdown source={lesson.extra} /></div>
            </details>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Link href={`/aluno/trilhas/${track.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
          <ArrowLeft aria-hidden className="h-4 w-4" /> {track.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[0_4px_0_rgb(15_23_42/0.2)]" style={{ background: kind.color }} aria-hidden>
            <KindIcon className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{lesson.title}</h1>
          <span className="rounded-full px-3 py-0.5 text-sm font-extrabold text-night" style={{ background: kind.color }}>{kind.label}</span>
          {lesson.optional && <span className="rounded-full border-2 border-dashed border-line px-3 py-0.5 text-sm font-extrabold text-muted">Extra opcional</span>}
          {lesson.mode === "SB3" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-star px-3 py-0.5 text-sm font-extrabold text-night"><Rocket aria-hidden className="h-3.5 w-3.5" /> PictoBlox</span>
          )}
          {done && <Stars value={stars} />}
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-muted">
          <span>Lição {position.index} de {position.total} · {lesson.module.title} · {lesson.xp} XP</span>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: position.total }, (_, k) => (
              <span key={k} className={`h-2 w-6 rounded-full ${k < position.index ? "bg-star" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
      </div>

      <Card className={isTheory ? "space-y-6" : ""}>
        <Markdown source={lesson.content} />
        {isTheory && <TheoryDone lessonId={lesson.id} done={done} />}
      </Card>

      {!isTheory && lesson.mode === "SB3" && <Sb3Upload lessonId={lesson.id} nextHref={nextHref} />}

      {lesson.extra && (
        <details className="clay group p-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
            <Sparkles aria-hidden className="h-5 w-5 text-star" /> Desafio extra (opcional)
            <span aria-hidden className="ml-auto text-muted transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3"><Markdown source={lesson.extra} /></div>
        </details>
      )}
    </div>
  );
}
