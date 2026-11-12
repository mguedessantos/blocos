import { Card } from "@/components/ui";
import { LoginSwitch } from "../login-switch";

export const metadata = { title: "Entrar" };

/** Login: aluno(a) primeiro; `?perfil=equipe` (ou vindo de uma área da equipe) abre o login da equipe. */
export default async function EntrarPage(props: PageProps<"/entrar">) {
  const { voltar, perfil } = await props.searchParams;
  const back = typeof voltar === "string" ? voltar : undefined;
  const staff = perfil === "equipe" || (back !== undefined && !back.startsWith("/aluno"));
  return (
    <Card className="p-8">
      <LoginSwitch initial={staff ? "equipe" : "aluno"} voltar={back} />
    </Card>
  );
}
