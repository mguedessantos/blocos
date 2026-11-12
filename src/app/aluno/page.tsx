import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listStudentClasses } from "@/lib/dal/org";

export const metadata = { title: "Minhas trilhas" };

export default async function AlunoPage() {
  const user = await requireUser(["STUDENT"]);
  const classes = await listStudentClasses(user);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Olá, {user.name}! 👋</h1>
        <span className="rounded-full bg-brand-2 px-4 py-2 font-extrabold">⭐ {user.xp} XP</span>
      </div>
      <Card>
        <p className="font-semibold">Turma: {classes.map((c) => `${c.name} (Prof. ${c.teacher.name})`).join(", ")}</p>
        <p className="mt-2 text-black/60">Suas trilhas de programação vão aparecer aqui em breve. 🧩</p>
      </Card>
    </div>
  );
}
