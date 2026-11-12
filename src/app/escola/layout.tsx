import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/escola">) {
  const user = await requireUser(["ORG_ADMIN", "SUPER_ADMIN"]);
  return (
    <AppShell user={user} nav={[{ href: "/escola", label: "Visão geral" }, { href: "/professor", label: "Turmas" }, { href: "/escola/equipe", label: "Equipe" }, { href: "/escola/assinatura", label: "Assinatura" }]}>
      {children}
    </AppShell>
  );
}
