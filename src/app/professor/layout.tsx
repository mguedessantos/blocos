import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/professor">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const nav = [{ href: "/professor", label: "Minhas turmas" }];
  if (user.role === "ORG_ADMIN") nav.push({ href: "/escola", label: "Conta" }, { href: "/escola/assinatura", label: "Assinatura" });
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
