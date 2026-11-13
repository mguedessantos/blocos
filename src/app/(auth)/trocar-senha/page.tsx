import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/dal/auth";
import { logout } from "../actions";
import { ChangePasswordForm } from "./form";

export const metadata = { title: "Trocar a senha" };

/** Primeiro login com a senha padrão (ou quando a pessoa quer trocar a senha). */
export default async function TrocarSenhaPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") redirect("/entrar?perfil=equipe");
  return (
    <Card className="space-y-5 p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold">{user.mustChangePassword ? `Bem-vindo(a), ${user.name.split(" ")[0]}!` : "Trocar a senha"}</h1>
        <p className="font-semibold text-muted">
          {user.mustChangePassword ? "Você entrou com a senha padrão. Para proteger sua conta, crie agora a sua própria senha." : "Escolha uma nova senha para a sua conta."}
        </p>
      </div>
      <ChangePasswordForm />
      <form action={logout} className="border-t-2 border-line pt-4 text-center">
        <button type="submit" className="text-sm font-bold text-muted underline hover:text-foreground">Não é você? Sair e entrar com outra conta</button>
      </form>
    </Card>
  );
}
