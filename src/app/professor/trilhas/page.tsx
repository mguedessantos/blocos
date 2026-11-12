import { BookOpen, ChevronRight, Clock, Puzzle, Rocket } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listCatalogCourses } from "@/lib/dal/lessons";

export const metadata = { title: "Currículo" };

const LEVELS: Record<number, { name: string; text: string }> = {
  1: { name: "Básico", text: "Primeiro contato: movimento, falas, repetição, atores, fantasias e sons." },
  2: { name: "Intermediário", text: "Decisões, controles, sensores e variáveis: as peças de um jogo." },
  3: { name: "Avançado", text: "Clones, mensagens, telas, jogos completos e a preparação para a game jam." },
};

export default async function CurriculoPage() {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const courses = await listCatalogCourses(user);

  return (
    <div className="space-y-10">
      <PageHeader
        icon={<BookOpen className="h-7 w-7" />}
        title="Currículo"
        subtitle="Cursos completos, do primeiro bloco até a game jam. Libere um curso para a turma na página da turma."
      />
      {courses.map((course) => {
        const levels = [...new Set(course.tracks.map((t) => t.level))].sort((a, b) => a - b);
        return (
          <section key={course.id} className="space-y-6">
            <div className={`clay p-6 ${course.comingSoon ? "border-dashed opacity-80" : ""}`}>
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Curso</p>
              <h2 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold">
                {course.title}
                {course.comingSoon && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900">
                    <Clock aria-hidden className="h-4 w-4" /> Em breve
                  </span>
                )}
              </h2>
              <p className="mt-1 font-semibold text-muted">
                {course.comingSoon ? "Este curso está em preparação e ainda não pode ser liberado para turmas." : `${course.description} · ${course.tracks.length} trilhas`}
              </p>
            </div>

            {levels.map((lv) => (
              <div key={lv} className="space-y-3">
                <div>
                  <h3 className="text-2xl font-extrabold">Nível {LEVELS[lv]?.name ?? lv}</h3>
                  <p className="font-semibold text-muted">{LEVELS[lv]?.text}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {course.tracks.filter((t) => t.level === lv).map((t) => {
                    const lessons = t.modules.flatMap((m) => m.lessons);
                    const extras = lessons.filter((l) => l.optional).length;
                    return (
                      <Link key={t.id} href={`/professor/trilhas/${t.id}`} className="clay clay-hover group flex flex-col gap-2 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-xl font-extrabold leading-tight">{t.title}</h4>
                          <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="text-sm font-semibold text-muted">{t.description}</p>
                        <p className="mt-auto flex gap-4 text-sm font-bold">
                          <span className="inline-flex items-center gap-1"><Puzzle aria-hidden className="h-4 w-4 text-green-600" /> {lessons.length - extras} lições no site</span>
                          <span className="inline-flex items-center gap-1"><Rocket aria-hidden className="h-4 w-4 text-brand" /> {extras} extra(s) PictoBlox</span>
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
