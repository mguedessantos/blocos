import { billingEnabled } from "@/lib/billing/entitlements";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/professor">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const nav: NavItem[] = [{ href: "/professor", label: "Minhas turmas", icon: "turmas" }];
  if (user.role === "ORG_ADMIN") {
    nav.push({ href: "/escola", label: "Conta", icon: "painel" });
    if (billingEnabled()) nav.push({ href: "/escola/assinatura", label: "Assinatura", icon: "assinatura" });
  }
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
