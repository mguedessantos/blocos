import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getTeam } from "@/lib/dal/jams";
import { FullWindow } from "./full-window";
import { Studio } from "./studio";

export const metadata = { title: "Estúdio da equipe" };

export default async function EstudioPage(props: PageProps<"/jams/[slug]/equipes/[teamId]/estudio">) {
  const user = await requireUser(["STUDENT", "TEACHER", "ORG_ADMIN"]);
  const { slug, teamId } = await props.params;
  const d = await getTeam(user, teamId).catch((err) => {
    if (err instanceof AccessError) notFound();
    throw err;
  });
  return (
    <FullWindow>
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <Link href={`/jams/${slug}/equipes/${teamId}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Entrega da equipe
        </Link>
        <h1 className="text-xl font-extrabold">Estúdio: {d.team.name}</h1>
        <span className="text-sm font-bold text-muted">{d.jam.title} · tema: {d.jam.theme}</span>
      </div>
      <div className="min-h-0 flex-1">
        <Studio teamId={teamId} />
      </div>
    </FullWindow>
  );
}
