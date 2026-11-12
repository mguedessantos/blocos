import Link from "next/link";
import { Card } from "@/components/ui";
import { findValidInvite } from "@/lib/dal/team";
import { getTenant } from "@/lib/tenant";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Convite" };

export default async function ConvitePage(props: PageProps<"/convite/[token]">) {
  const { token } = await props.params;
  const tenant = await getTenant();
  const invite = await findValidInvite(token, tenant?.id ?? null);

  if (!invite) {
    return (
      <Card className="space-y-3 text-center">
        <h1 className="text-2xl font-extrabold">Convite inválido ou expirado</h1>
        <p className="text-sm text-black/60">Peça um novo convite à coordenação da sua escola.</p>
        <Link href="/entrar" className="font-semibold text-brand underline">Ir para o login</Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Bem-vindo(a) ao {invite.organization.name}! 🍎</h1>
      <p className="text-sm text-black/60">Crie sua conta de professor(a) para <strong>{invite.email}</strong>.</p>
      <AcceptInviteForm token={token} />
    </Card>
  );
}
