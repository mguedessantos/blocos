import type { NavItem } from "@/components/nav-links";
import { billingEnabled } from "./billing/entitlements";
import type { CurrentUser } from "./dal/auth";

const JAM: NavItem = { href: "/jams", label: "Game Jam", icon: "jams" };

/** Menu principal de cada papel (o mesmo em todas as áreas, inclusive /jams). */
export function navFor(user: CurrentUser): NavItem[] {
  switch (user.role) {
    case "STUDENT":
      return [{ href: "/aluno", label: "Minhas trilhas", icon: "trilhas" }, JAM];
    case "TEACHER":
      return [{ href: "/professor", label: "Minhas turmas", icon: "turmas" }, { href: "/professor/trilhas", label: "Mundos e aulas", icon: "licoes" }, JAM];
    case "ORG_ADMIN":
      return [
        { href: "/escola", label: "Visão geral", icon: "painel" },
        { href: "/professor", label: "Turmas", icon: "turmas" },
        { href: "/professor/trilhas", label: "Mundos e aulas", icon: "licoes" },
        { href: "/escola/equipe", label: "Equipe", icon: "equipe" },
        { href: "/escola/marca", label: "Marca", icon: "marca" },
        JAM,
        ...(billingEnabled() ? [{ href: "/escola/assinatura", label: "Assinatura", icon: "assinatura" as const }] : []),
      ];
    case "SUPER_ADMIN":
      return [
        { href: "/plataforma", label: "Painel", icon: "painel" },
        { href: "/jams", label: "Game Jams", icon: "jams" },
        { href: "/plataforma/avisos", label: "Avisos", icon: "avisos" },
        { href: "/plataforma/lixeira", label: "Lixeira", icon: "lixeira" },
      ];
    case "JUDGE":
      return [{ href: "/jurado", label: "Avaliar", icon: "jams" }, JAM];
  }
}

/** Professores e coordenação que também são jurados veem "Avaliar". */
export function withJudging(nav: NavItem[], isJudge: boolean): NavItem[] {
  return isJudge && !nav.some((n) => n.href === "/jurado") ? [...nav, { href: "/jurado", label: "Avaliar", icon: "jams" }] : nav;
}
