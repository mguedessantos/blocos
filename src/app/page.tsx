import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { getBrand } from "@/lib/branding";
import { getCurrentUser } from "@/lib/dal/auth";
import { ROLE_HOME } from "@/lib/roles";
import { getTenant } from "@/lib/tenant";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  const [tenant, brand] = await Promise.all([getTenant(), getBrand()]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-gradient-to-b from-brand/10 to-transparent p-6 text-center">
      <BrandLogo brand={brand} size="lg" />
      {tenant ? (
        <p className="text-xl font-semibold">{tenant.name}</p>
      ) : (
        <div className="max-w-xl space-y-3">
          <h1 className="text-4xl font-extrabold">Programação em blocos para crianças</h1>
          <p className="text-lg text-black/60">
            Trilhas de aprendizado, desafios corrigidos automaticamente e game jams com jurados —
            para escolas e professores.
          </p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/entrar-aluno" className="rounded-2xl bg-brand px-8 py-4 text-lg font-extrabold text-brand-text shadow">
          Sou aluno(a) 🎮
        </Link>
        <Link href="/entrar" className="rounded-2xl bg-white px-8 py-4 text-lg font-extrabold text-brand shadow ring-2 ring-brand">
          Sou professor(a) 🍎
        </Link>
      </div>
      {!tenant && (
        <p className="text-sm">
          É escola ou professor?{" "}
          <Link href="/cadastro" className="font-bold text-brand underline">Teste grátis por 14 dias</Link> ·{" "}
          <Link href="/precos" className="font-bold text-brand underline">Ver preços</Link>
        </p>
      )}
      <PoweredBy brand={brand} />
    </main>
  );
}
