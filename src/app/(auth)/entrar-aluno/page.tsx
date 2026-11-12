import { Gamepad2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { StudentLoginForm } from "../login-forms";

export const metadata = { title: "Entrar — Aluno" };

export default function EntrarAlunoPage() {
  return (
    <Card className="flex flex-col gap-5 p-8">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand text-brand-text shadow-[0_5px_0_var(--brand-shadow)]" aria-hidden>
        <Gamepad2 className="h-8 w-8" />
      </span>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Oi! Que bom te ver</h1>
        <p className="font-semibold text-muted">Use o código da turma que seu professor te passou.</p>
      </div>
      <StudentLoginForm />
      <Link href="/entrar" className="text-center text-sm font-extrabold text-brand underline underline-offset-2">
        Sou professor(a)
      </Link>
    </Card>
  );
}
