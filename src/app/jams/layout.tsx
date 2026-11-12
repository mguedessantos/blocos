import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/jams">) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
