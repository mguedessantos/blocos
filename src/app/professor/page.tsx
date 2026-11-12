import { ChevronRight, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
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
      <PageHeader icon={<UsersRound className="h-7 w-7" />} title={user.role === "ORG_ADMIN" ? "Turmas" : "Minhas turmas"} subtitle={`${classes.length} turma(s) ativa(s)`} />
      <Card>
        <NewClassForm teachers={teachers && teachers.length > 1 ? teachers : null} currentUserId={user.id} />
      </Card>
      {classes.length === 0 && <p className="font-semibold text-muted">Nenhuma turma ainda. Crie a primeira acima!</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Link key={c.id} href={`/professor/turmas/${c.id}`} className="clay clay-hover group flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold leading-tight">{c.name}</h2>
                <p className="text-sm font-semibold text-muted">Prof. {c.teacher.name}</p>
              </div>
              <ChevronRight aria-hidden className="h-5 w-5 text-muted transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="rounded-2xl bg-brand-soft px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-shadow">Código da turma</p>
              <p className="font-mono text-2xl font-extrabold tracking-widest text-brand-shadow">{c.code}</p>
            </div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-muted"><Users aria-hidden className="h-4 w-4" /> {c._count.enrollments} alunos</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
