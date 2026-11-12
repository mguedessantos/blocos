import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { getBrand } from "@/lib/branding";
import { requireUser } from "@/lib/dal/auth";
import { AccessError, getClassDetail } from "@/lib/dal/classes";
import { listAssignableCourses } from "@/lib/dal/lessons";
import { getStudentLoginUrl } from "@/lib/dal/org";
import { archiveClassAction, setCourseAssignmentAction } from "../../actions";
import { AddStudentsForm, RenameClassForm, StudentsTable } from "./class-forms";

export const metadata = { title: "Turma" };

export default async function TurmaPage(props: PageProps<"/professor/turmas/[id]">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const { id } = await props.params;
  const klass = await getClassDetail(user, id).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  const [brand, loginUrl, tracks] = await Promise.all([getBrand(), getStudentLoginUrl(user), listAssignableCourses(user, klass.id)]);
  const card = { brandName: brand.name, logoUrl: brand.logoUrl, loginUrl, classCode: klass.code, className: klass.name };
  const students = klass.enrollments.map((e) => e.user);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/professor" className="text-sm font-semibold text-brand">← Minhas turmas</Link>
          <h1 className="text-3xl font-extrabold">{klass.name}</h1>
          <p className="text-sm text-muted">Prof. {klass.teacher.name} · {students.length} alunos</p>
        </div>
        <div className="clay p-4 text-center">
          <p className="text-xs font-semibold text-muted">Código da turma</p>
          <p className="font-mono text-3xl font-extrabold tracking-widest text-brand">{klass.code}</p>
          <p className="text-xs text-muted">{loginUrl.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>

      <Card>
        <h2 className="no-print mb-3 text-lg font-bold">Alunos</h2>
        <StudentsTable classId={klass.id} students={students} card={card} />
      </Card>

      <Card className="no-print">
        <h2 className="mb-1 text-lg font-bold">Cursos da turma</h2>
        <p className="mb-3 text-sm text-muted">Ao liberar um curso, a turma recebe todas as trilhas dele.</p>
        <ul className="space-y-2">
          {tracks.map((c) => (
            <li key={c.id} className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-3 ${c.comingSoon ? "border-dashed border-line opacity-70" : "border-line"}`}>
              <span>
                <strong>{c.title}</strong>
                <span className="block text-sm text-muted">{c.comingSoon ? "Em breve" : `${c.tracks} trilhas · ${c.description}`}</span>
              </span>
              {c.comingSoon ? (
                <span className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-sm font-extrabold text-muted">Em breve</span>
              ) : (
                <form action={setCourseAssignmentAction.bind(null, klass.id, c.id, !c.assigned)}>
                  <button className={`btn btn-sm shrink-0 ${c.assigned ? "btn-secondary" : ""}`}>
                    {c.assigned ? "✓ Liberado (remover)" : "Liberar curso"}
                  </button>
                </form>
              )}
            </li>
          ))}
          {tracks.length === 0 && <li className="text-sm text-muted">Nenhum curso publicado ainda.</li>}
        </ul>
      </Card>

      <Card className="no-print">
        <h2 className="mb-3 text-lg font-bold">Adicionar alunos</h2>
        <AddStudentsForm classId={klass.id} card={card} />
      </Card>

      <Card className="no-print space-y-4">
        <h2 className="text-lg font-bold">Configurações da turma</h2>
        <RenameClassForm classId={klass.id} name={klass.name} />
        <form action={archiveClassAction.bind(null, klass.id)}>
          <button className="text-sm font-semibold text-red-700 underline">Arquivar turma (os alunos não conseguirão mais entrar com este código)</button>
        </form>
      </Card>
    </div>
  );
}
