import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/plataforma">) {
  const user = await requireUser(["SUPER_ADMIN"]);
  return (
    <AppShell user={user} nav={[{ href: "/plataforma", label: "Visão geral", icon: "painel" }]}>
      {children}
    </AppShell>
  );
}
