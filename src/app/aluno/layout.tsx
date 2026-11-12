import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/aluno">) {
  const user = await requireUser(["STUDENT"]);
  return <AppShell user={user}>{children}</AppShell>;
}
