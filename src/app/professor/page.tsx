import Link from "next/link";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listOrgTeachers } from "@/lib/dal/classes";
import { listTeacherClasses } from "@/lib/dal/org";
import { NewClassForm } from "./new-class-form";

export const metadata = { title: "Minhas turmas" };

export default async function ProfessorPage() {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const [classes, teachers] = await Promise.all([
    listTeacherClasses(user),
    user.role === "ORG_ADMIN" ? listOrgTeachers(user) : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{user.role === "ORG_ADMIN" ? "Turmas" : "Minhas turmas"}</h1>
      <Card>
        <NewClassForm teachers={teachers && teachers.length > 1 ? teachers : null} currentUserId={user.id} />
      </Card>
      {classes.length === 0 && <p className="text-black/60">Nenhuma turma ainda. Crie a primeira acima! ☝️</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Link key={c.id} href={`/professor/turmas/${c.id}`} className="block transition hover:-translate-y-0.5">
            <Card>
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-sm text-black/50">Prof. {c.teacher.name}</p>
              <p className="mt-4 text-sm">Código da turma</p>
              <p className="font-mono text-2xl font-extrabold tracking-widest text-brand">{c.code}</p>
              <p className="mt-2 text-sm text-black/60">{c._count.enrollments} alunos</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
