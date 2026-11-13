import { CircleAlert, Clock, KeyRound, LifeBuoy, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(auth)/actions";
import { AnnouncementsBell } from "@/components/announcements";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { Markdown } from "@/components/markdown";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { getBrand } from "@/lib/branding";
import type { CurrentUser } from "@/lib/dal/auth";
import { getSubscriptionBanner } from "@/lib/dal/billing";
import { getMyAnnouncements } from "@/lib/dal/platform";
import { ROLE_LABEL } from "@/lib/roles";
import { db } from "@/lib/db";
import { navFor, withJudging } from "@/lib/nav";

export type { NavItem };

export async function AppShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const [brand, banner, notices, judging] = await Promise.all([
    getBrand(),
    getSubscriptionBanner(user),
    getMyAnnouncements(user),
    user.role === "JUDGE" ? 0 : db.jamJudge.count({ where: { userId: user.id } }),
  ]);
  const nav = withJudging(navFor(user), judging > 0);
  const unread = notices.filter((n) => !n.read);
  const initial = user.name.trim().charAt(0).toUpperCase();
  return (
    <div className={`flex flex-1 flex-col ${user.role === "STUDENT" ? "tema-noite" : ""}`}>
      <header className="no-print sticky top-0 z-30 border-b-2 border-line bg-[var(--nav-bg)] backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <Link href="/" className="shrink-0 rounded-xl"><BrandLogo brand={brand} /></Link>
            <div className="hidden min-w-0 flex-1 md:block"><NavLinks items={nav} /></div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            {user.role !== "STUDENT" && (
              <>
                <Link href="/manual" title="Manual" aria-label="Manual da plataforma" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-foreground">
                  <LifeBuoy aria-hidden className="h-5 w-5" />
                </Link>
                <Link href="/trocar-senha" title="Trocar a senha" aria-label="Trocar a senha" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-foreground">
                  <KeyRound aria-hidden className="h-5 w-5" />
                </Link>
              </>
            )}
            {(user.role === "ORG_ADMIN" || user.role === "TEACHER") && (
              <AnnouncementsBell unread={unread.length}>
                <p className="mb-2 font-display text-lg font-extrabold">Avisos</p>
                {notices.length === 0 && <p className="text-sm text-muted">Nenhum aviso por enquanto.</p>}
                <ul className="space-y-3">
                  {notices.slice(0, 10).map((n) => (
                    <li key={n.id} className="rounded-2xl border-2 border-line p-3">
                      <p className="font-extrabold">{!n.read && <span className="mr-1 text-red-600">●</span>}{n.title}</p>
                      <p className="mb-1 text-xs font-semibold text-muted">{n.publishedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                      <div className="text-sm"><Markdown source={n.body} /></div>
                    </li>
                  ))}
                </ul>
              </AnnouncementsBell>
            )}
            <div className="hidden text-right leading-tight 2xl:block">
              <p className="font-extrabold">{user.name}</p>
              <p className="text-xs font-semibold text-muted">{ROLE_LABEL[user.role]}{brand.orgName ? ` · ${brand.orgName}` : ""}</p>
            </div>
            <span title={user.name} className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-2 font-display text-lg font-extrabold text-night shadow-[0_3px_0_rgb(15_23_42/0.15)]">
              {initial}
            </span>
            <form action={logout}>
              <button className="btn btn-secondary btn-sm" aria-label="Sair">
                <LogOut aria-hidden className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
        {nav.length > 1 && <div className="border-t border-line px-3 py-1.5 md:hidden"><NavLinks items={nav} /></div>}
      </header>
      {unread[0] && (
        <div role="status" className="no-print flex flex-wrap items-center justify-center gap-2 bg-brand-soft px-6 py-2 text-sm font-bold text-brand-shadow">
          <span aria-hidden>📣</span> Novo aviso: {unread[0].title}
          {unread.length > 1 && <span className="font-semibold">(+{unread.length - 1})</span>}
          <span className="font-semibold">· abra o sino para ler</span>
        </div>
      )}
      {banner && <SubscriptionBanner banner={banner} canManage={user.role === "ORG_ADMIN"} />}
      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${user.role === "STUDENT" ? "max-w-6xl" : "max-w-screen-2xl"}`}>{children}</main>
      <footer className="no-print flex justify-center p-4"><PoweredBy brand={brand} /></footer>
    </div>
  );
}

export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="clay p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        {icon && <span aria-hidden className="text-brand">{icon}</span>}
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
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
  const Icon = urgent ? CircleAlert : Clock;
  return (
    <div role={urgent ? "alert" : "status"} className={`no-print flex flex-wrap items-center justify-center gap-3 px-6 py-2 text-sm font-bold ${urgent ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
      <Icon aria-hidden className="h-4 w-4" />
      <span>{text}</span>
      {canManage ? (
        <Link href="/escola/assinatura" className="underline underline-offset-2">{banner.kind === "trial" ? "Assinar agora" : "Resolver"}</Link>
      ) : (
        urgent && <span>Avise a coordenação da escola.</span>
      )}
    </div>
  );
}
