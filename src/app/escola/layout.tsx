import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/dal/auth";

export default async function Layout({ children }: LayoutProps<"/escola">) {
  const user = await requireUser(["ORG_ADMIN", "SUPER_ADMIN"]);
  // O dono da plataforma não pertence a nenhuma escola: o painel dele é /plataforma.
  if (user.role === "SUPER_ADMIN") redirect("/plataforma");
  return <AppShell user={user}>{children}</AppShell>;
}
