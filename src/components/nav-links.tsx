"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Loader2, CreditCard, Gavel, LayoutDashboard, Map, Megaphone, Palette, Trash2, Users, UsersRound, type LucideIcon } from "lucide-react";

export const NAV_ICONS = { trilhas: Map, painel: LayoutDashboard, turmas: UsersRound, equipe: Users, assinatura: CreditCard, jams: Gavel, licoes: BookOpen, avisos: Megaphone, lixeira: Trash2, marca: Palette } satisfies Record<string, LucideIcon>;
export type NavItem = { href: string; label: string; icon?: keyof typeof NAV_ICONS };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  // o item mais específico que casa com a URL atual fica ativo
  const active = items
    .filter((n) => path === n.href || path.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Principal" className="flex gap-1 overflow-x-auto">
      {items.map((n) => {
        const Icon = n.icon ? NAV_ICONS[n.icon] : null;
        const on = n.href === active;
        const compact = items.length > 5 && !on;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            title={compact ? n.label : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-extrabold transition-colors ${
              on ? "bg-brand-soft text-brand-shadow" : "text-muted hover:bg-black/5 hover:text-foreground"
            }`}
          >
            <LinkIcon Icon={Icon} />
            <span className={compact ? "sr-only 2xl:not-sr-only" : undefined}>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Ícone do item; enquanto a página nova carrega, vira um indicador girando (resposta imediata ao clique). */
function LinkIcon({ Icon }: { Icon: LucideIcon | null }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 aria-label="Carregando" className="h-4 w-4 animate-spin" />;
  return Icon ? <Icon aria-hidden className="h-4 w-4" /> : null;
}
