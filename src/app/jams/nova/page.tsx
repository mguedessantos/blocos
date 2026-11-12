import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { isJamManager, listSchoolsForJam } from "@/lib/dal/jams";
import { DEFAULT_CATEGORIES, DEFAULT_CRITERIA, defaultJamDates } from "@/lib/jams";
import { JamForm } from "../jam-form";

export const metadata = { title: "Criar game jam" };

export default async function NovaJamPage() {
  const user = await requireUser();
  if (!isJamManager(user)) redirect("/jams");
  const schools = await listSchoolsForJam(user);
  return (
    <div className="space-y-6">
      <Link href="/jams" className="text-sm font-semibold text-brand">← Game Jam</Link>
      <PageHeader icon={<Plus className="h-7 w-7" />} title="Criar game jam" subtitle="A jam nasce como rascunho. Publique quando estiver tudo certo." />
      <Card>
        <JamForm
          jamId={null}
          schools={schools}
          initial={{
            title: "", theme: "", description: "", scope: "PLATAFORMA", states: [], cities: [], orgIds: [],
            ...defaultJamDates(), maxTeamSize: 4, criteria: DEFAULT_CRITERIA,
            prizes: [{ title: "", description: "", recipient: "EQUIPE" }],
            categories: DEFAULT_CATEGORIES,
          }}
        />
      </Card>
    </div>
  );
}
