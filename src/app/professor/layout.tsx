import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/professor">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  return <AppShell user={user}>{children}</AppShell>;
}
