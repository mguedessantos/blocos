import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";

export const metadata = { title: "Jams" };

export default async function JuradoPage() {
  await requireUser(["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Game Jams para avaliar</h1>
      <Card><p className="text-black/60">Nenhuma jam atribuída a você ainda.</p></Card>
    </div>
  );
}
