import Link from "next/link";
import { Card } from "@/components/ui";
import { StaffLoginForm } from "../login-forms";

export const metadata = { title: "Entrar" };

export default async function EntrarPage(props: PageProps<"/entrar">) {
  const { voltar } = await props.searchParams;
  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Entrar</h1>
      <p className="text-sm text-black/60">Professores, coordenação e jurados.</p>
      <StaffLoginForm voltar={typeof voltar === "string" ? voltar : undefined} />
      <Link href="/entrar-aluno" className="text-center text-sm font-semibold text-brand underline">
        Sou aluno(a)
      </Link>
    </Card>
  );
}
