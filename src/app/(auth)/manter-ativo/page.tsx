import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { peekKeepToken } from "@/lib/dal/retention";
import { keepActiveAction } from "./actions";

export const metadata = { title: "Manter contas ativas" };

// Link do email de aviso de inatividade. Confirma num botão (filtros de email abrem links sozinhos).
export default async function ManterAtivoPage(props: PageProps<"/manter-ativo">) {
  const { t, ok } = await props.searchParams;
  if (typeof ok === "string") {
    return (
      <Card className="space-y-3 text-center">
        <h1 className="text-2xl font-extrabold">Pronto!</h1>
        <p className="text-muted">{ok === "1" ? "A conta continua ativa" : `As ${ok} contas continuam ativas`} por mais 1 ano.</p>
        <Link href="/entrar?perfil=equipe" className="font-semibold text-brand underline">Ir para o login</Link>
      </Card>
    );
  }
  const people = typeof t === "string" ? await peekKeepToken(t) : null;
  if (!people || people.length === 0) {
    return (
      <Card className="space-y-3 text-center">
        <h1 className="text-2xl font-extrabold">Link inválido ou vencido</h1>
        <p className="text-sm text-muted">O link vale por 30 dias. Para manter a conta ativa, basta entrar na plataforma.</p>
        <Link href="/entrar?perfil=equipe" className="font-semibold text-brand underline">Ir para o login</Link>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Manter {people.length === 1 ? "a conta ativa" : `${people.length} contas ativas`}</h1>
      <p className="text-sm text-muted">Estas contas não serão apagadas e continuam ativas por mais 1 ano:</p>
      <p className="font-semibold">{people.map((p) => p.name).join(", ")}</p>
      <form action={keepActiveAction.bind(null, t as string)}>
        <Button className="w-full">Manter ativas</Button>
      </form>
    </Card>
  );
}
