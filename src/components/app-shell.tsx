import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(auth)/actions";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { getBrand } from "@/lib/branding";
import type { CurrentUser } from "@/lib/dal/auth";
import { getSubscriptionBanner } from "@/lib/dal/billing";
import { ROLE_LABEL } from "@/lib/roles";

export type NavItem = { href: string; label: string };

export async function AppShell({ user, nav, children }: { user: CurrentUser; nav: NavItem[]; children: ReactNode }) {
  const [brand, banner] = await Promise.all([getBrand(), getSubscriptionBanner(user)]);
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-black/5 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/"><BrandLogo brand={brand} /></Link>
          <nav className="hidden gap-4 text-sm font-semibold sm:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-black/70 hover:text-brand">{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right leading-tight">
            <p className="font-bold">{user.name}</p>
            <p className="text-black/50">{ROLE_LABEL[user.role]}{brand.orgName ? ` · ${brand.orgName}` : ""}</p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-3 py-2 font-semibold text-black/60 hover:bg-black/5">Sair</button>
          </form>
        </div>
      </header>
      {banner && <SubscriptionBanner banner={banner} canManage={user.role === "ORG_ADMIN"} />}
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
      <footer className="flex justify-center p-4"><PoweredBy brand={brand} /></footer>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-semibold text-black/50">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

type Banner = NonNullable<Awaited<ReturnType<typeof getSubscriptionBanner>>>;

function SubscriptionBanner({ banner, canManage }: { banner: Banner; canManage: boolean }) {
  const text = {
    trial: banner.kind === "trial" ? `Teste grátis: ${banner.days === 0 ? "último dia" : `faltam ${banner.days} dias`}.` : "",
    pagamento: "Não conseguimos cobrar o último pagamento.",
    bloqueado: "Assinatura inativa: a conta está em modo somente leitura.",
    "sem-plano": "Conta sem plano.",
  }[banner.kind];
  const urgent = banner.kind !== "trial";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 px-6 py-2 text-sm font-semibold ${urgent ? "bg-red-50 text-red-800" : "bg-brand-2/20"}`}>
      <span>{text}</span>
      {canManage ? (
        <Link href="/escola/assinatura" className="underline">{banner.kind === "trial" ? "Assinar agora" : "Resolver"}</Link>
      ) : (
        urgent && <span>Avise a coordenação da escola.</span>
      )}
    </div>
  );
}
