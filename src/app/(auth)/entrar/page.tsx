import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { StaffLoginForm } from "../login-forms";

export const metadata = { title: "Entrar" };

export default async function EntrarPage(props: PageProps<"/entrar">) {
  const { voltar } = await props.searchParams;
  return (
    <Card className="flex flex-col gap-5 p-8">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-foreground text-white shadow-[0_5px_0_rgb(0_0_0/0.3)]" aria-hidden>
        <GraduationCap className="h-8 w-8" />
      </span>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Entrar</h1>
        <p className="font-semibold text-muted">Professores, coordenação e jurados.</p>
      </div>
      <StaffLoginForm voltar={typeof voltar === "string" ? voltar : undefined} />
      <Link href="/entrar-aluno" className="text-center text-sm font-extrabold text-brand underline underline-offset-2">
        Sou aluno(a)
      </Link>
    </Card>
  );
}
