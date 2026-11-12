import { Card } from "@/components/ui";
import { LoginSwitch } from "../login-switch";

export const metadata = { title: "Entrar — Aluno" };

// Endereço antigo (está nos cartões de login impressos): mesma tela, já no login do aluno.
export default function EntrarAlunoPage() {
  return (
    <Card className="p-8">
      <LoginSwitch initial="aluno" />
    </Card>
  );
}
