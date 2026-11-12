import { billingEnabled } from "@/lib/billing/entitlements";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getTenant } from "@/lib/tenant";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Criar conta" };

export default async function CadastroPage() {
  if (await getTenant()) redirect("/entrar");
  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Crie sua conta</h1>
      <SignupForm rootDomain={process.env.ROOT_DOMAIN ?? "localhost:3000"} billing={billingEnabled()} />
      <Link href="/entrar" className="text-center text-sm font-semibold text-brand underline">
        Já tenho conta
      </Link>
    </Card>
  );
}
