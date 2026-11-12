import { Gavel } from "lucide-react";
import Link from "next/link";
import { PhaseBadge } from "@/components/jams";
import { buttonClass, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listJudgeJams } from "@/lib/dal/jams";
import { fmtDateTime } from "@/lib/jams";

export const metadata = { title: "Avaliar" };

export default async function JuradoPage() {
  const user = await requireUser(["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"]);
  const jams = await listJudgeJams(user);
  return (
    <div className="space-y-6">
      <PageHeader icon={<Gavel className="h-7 w-7" />} title="Game Jams para avaliar" subtitle="Julgamento às cegas: você vê só o código de cada projeto, nunca a escola ou os alunos." />
      {jams.length === 0 && <Card><p className="text-muted">Nenhuma jam atribuída a você ainda.</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {jams.map((j) => (
          <Card key={j.id} className="space-y-2">
            <PhaseBadge phase={j.phase} />
            <h2 className="text-xl font-extrabold">{j.title}</h2>
            <p className="text-sm font-semibold text-muted">Tema: {j.theme} · {j._count.entries} entregas</p>
            <p className="text-sm text-muted">Julgamento de {fmtDateTime(j.endsAt)} até {fmtDateTime(j.judgingEndsAt)}</p>
            <Link href={`/jurado/${j.id}`} className={buttonClass("primary", "sm")}>Abrir</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
