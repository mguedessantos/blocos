import { ArrowLeft, ArrowRight, GraduationCap, Presentation, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/editor/lesson-player";
import { LESSON_KIND } from "@/components/lesson-icon";
import { Markdown } from "@/components/markdown";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { EXTRA_XP, getCatalogLesson } from "@/lib/dal/lessons";
import { previewVerifyAction } from "./actions";
import { objectivesOf } from "@/lib/checker";

export const metadata = { title: "Aula" };

/**
 * Modo aula: o professor abre a lição exatamente como o aluno vê (com o editor de blocos) para
 * resolver junto com a turma na projeção. Nada é gravado no progresso de ninguém.
 */
export default async function AulaPage(props: PageProps<"/professor/licoes/[id]">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const { id } = await props.params;
  const data = await getCatalogLesson(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const { track, lesson, index, total, prevId, nextId } = data;
  const kind = LESSON_KIND[lesson.type];
  const isEditor = lesson.type !== "TEORIA" && lesson.type !== "DEMO" && lesson.mode !== "SB3";

  const nav = (
    <span className="inline-flex items-center gap-1">
      {prevId ? (
        <Link href={`/professor/licoes/${prevId}`} aria-label="Lição anterior" className="grid h-9 w-9 place-items-center rounded-xl border-2 border-line hover:border-[#8b6cff]">
          <ArrowLeft aria-hidden className="h-4 w-4" />
        </Link>
      ) : null}
      {nextId ? (
        <Link href={`/professor/licoes/${nextId}`} aria-label="Próxima lição" className="grid h-9 w-9 place-items-center rounded-xl border-2 border-line hover:border-[#8b6cff]">
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      ) : null}
    </span>
  );
  const header = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Link href={`/professor/trilhas/${track.id}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
        <ArrowLeft aria-hidden className="h-4 w-4" /> {track.title}
      </Link>
      <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
      <span className="font-display text-sm font-extrabold text-star">Lição {index} de {total}</span>
      <h1 className="truncate text-xl font-extrabold sm:text-2xl">{lesson.title}</h1>
      <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold text-night" style={{ background: kind.color }}>{kind.label}</span>
      <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#8b6cff] px-2.5 py-0.5 text-xs font-extrabold text-[#b39cff]">
        <Presentation aria-hidden className="h-3.5 w-3.5" /> Modo aula
      </span>
      {nav}
    </div>
  );
  const guide = (
    <details className="clay group p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
        <GraduationCap aria-hidden className="h-5 w-5 text-star" /> Guia do professor
        <span aria-hidden className="ml-auto text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <p className="mt-2 text-xs font-bold text-muted">Fica fechado na projeção; abra quando precisar.</p>
      <div className="mt-3 text-[0.95rem]">{lesson.teacherGuide ? <Markdown source={lesson.teacherGuide} /> : <p className="text-muted">Sem guia para esta lição.</p>}</div>
    </details>
  );
  const extra = lesson.extra && (
    <details className="clay group p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold">
        <Sparkles aria-hidden className="h-5 w-5 text-star" /> Desafio extra (opcional)
        <span aria-hidden className="ml-auto text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-3"><Markdown source={lesson.extra} /></div>
    </details>
  );

  // a aula usa o mesmo visual que os alunos veem nas telas deles
  if (isEditor) {
    return (
      <div className="tema-noite">
        <LessonPlayer
          mode="aula"
          lessonId={lesson.id}
          allowedBlocks={lesson.allowedBlocks}
          objectives={objectivesOf(lesson.checks)}
          checks={lesson.checks}
          starter={lesson.starterWorkspace}
          saved={null}
          nextHref={nextId ? `/professor/licoes/${nextId}` : null}
          verify={previewVerifyAction.bind(null, lesson.id)}
          header={header}
          mission={<Markdown source={lesson.content} />}
          extra={lesson.extra && <Markdown source={lesson.extra} />}
          extraBonus={lesson.extraChecks ? EXTRA_XP : undefined}
          aside={guide}
        />
      </div>
    );
  }

  // teoria, demonstração e missões no PictoBlox: o conteúdo em tela grande, com o guia ao lado
  return (
    <div className="tema-noite -mx-4 -my-8 min-h-full px-4 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-screen-2xl space-y-5">
        <div className="clay p-4">{header}</div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_clamp(300px,26vw,420px)]">
          <Card className="space-y-6 text-lg">
            {lesson.mode === "SB3" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-star px-3 py-0.5 text-sm font-extrabold text-night"><Rocket aria-hidden className="h-3.5 w-3.5" /> Missão no PictoBlox</span>
            )}
            <Markdown source={lesson.content} />
            {nextId && (
              <Link href={`/professor/licoes/${nextId}`} className={buttonClass("primary", "md", "btn-cta")}>Próxima lição <ArrowRight aria-hidden className="h-5 w-5" /></Link>
            )}
          </Card>
          <div className="space-y-3">{extra}{guide}</div>
        </div>
      </div>
    </div>
  );
}
