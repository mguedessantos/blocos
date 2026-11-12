import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/jurado">) {
  const user = await requireUser(["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"]);
  return (
    <AppShell user={user} nav={[{ href: "/jurado", label: "Jams", icon: "jams" }]}>
      {children}
    </AppShell>
  );
}
