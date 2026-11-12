import Link from "next/link";
import { Card } from "@/components/ui";
import { StudentLoginForm } from "../login-forms";

export const metadata = { title: "Entrar — Aluno" };

export default function EntrarAlunoPage() {
  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Oi! Que bom te ver 👋</h1>
      <p className="text-sm text-black/60">Use o código da turma que seu professor te passou.</p>
      <StudentLoginForm />
      <Link href="/entrar" className="text-center text-sm font-semibold text-brand underline">
        Sou professor(a)
      </Link>
    </Card>
  );
}
