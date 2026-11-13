import { BookOpen, Clock, Puzzle, Rocket } from "lucide-react";
import { Island } from "@/components/island";
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
        title="Mundos e aulas"
        subtitle="Os mesmos mundos que os alunos veem. Abra um mundo para ver o guia de cada lição e dar aula resolvendo junto com a turma."
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {course.tracks.filter((t) => t.level === lv).map((t) => {
                    const lessons = t.modules.flatMap((m) => m.lessons);
                    const extras = lessons.filter((l) => l.optional).length;
                    const [label, ...rest] = t.title.split(" · ");
                    return (
                      <Link key={t.id} href={`/professor/trilhas/${t.id}`} className="clay clay-hover group flex flex-col items-center gap-1 p-4 text-center">
                        <Island index={course.tracks.indexOf(t) + 1} className="h-28 w-auto transition-transform group-hover:-translate-y-1" />
                        <span className="text-xs font-extrabold text-brand">{rest.length ? label : ""}</span>
                        <span className="font-display text-lg font-extrabold leading-tight">{rest.length ? rest.join(" · ") : t.title}</span>
                        <span className="text-xs font-bold text-muted"><Puzzle aria-hidden className="inline h-3.5 w-3.5 text-green-600" /> {lessons.length - extras} lições · <Rocket aria-hidden className="inline h-3.5 w-3.5 text-brand" /> {extras} extra(s)</span>
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
