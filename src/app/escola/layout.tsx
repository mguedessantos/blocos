import { billingEnabled } from "@/lib/billing/entitlements";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/escola">) {
  const user = await requireUser(["ORG_ADMIN", "SUPER_ADMIN"]);
  return (
    <AppShell user={user} nav={[{ href: "/escola", label: "Visão geral", icon: "painel" }, { href: "/professor", label: "Turmas", icon: "turmas" }, { href: "/escola/equipe", label: "Equipe", icon: "equipe" }, ...(billingEnabled() ? [{ href: "/escola/assinatura", label: "Assinatura", icon: "assinatura" as const }] : [])]}>
      {children}
    </AppShell>
  );
}
