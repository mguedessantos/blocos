import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getJudgeEntry } from "@/lib/dal/jams";
import { youtubeEmbed } from "@/lib/jams";
import { GamePlayer } from "@/components/editor/game-player";
import { ScoreForm } from "./score-form";

export const metadata = { title: "Avaliar projeto" };

export default async function JudgeEntryPage(props: PageProps<"/jurado/[jamId]/[code]">) {
  const user = await requireUser(["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"]);
  const { jamId, code } = await props.params;
  const d = await getJudgeEntry(user, jamId, code.toUpperCase()).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const e = d.entry;
  return (
    <div className="space-y-6">
      <Link href={`/jurado/${jamId}`} className="text-sm font-semibold text-brand">← {d.jam.title}</Link>
      <div>
        <p className="font-mono text-sm font-extrabold text-muted">Projeto {e.anonCode}</p>
        <h1 className="text-3xl font-extrabold">{e.title}</h1>
        <p className="font-semibold text-muted">Tema da jam: {d.jam.theme}{e.category ? ` · Categoria ${e.category}` : ""}</p>
        <p className="text-sm text-muted">Compare só com projetos da mesma categoria: as equipes desta faixa têm idades parecidas.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe src={youtubeEmbed(e.youtubeId)} title={`Vídeo do projeto ${e.anonCode}`} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
          </div>
          <GamePlayer src={`/jams/arquivo/${e.id}/projeto`} title={`Projeto ${e.anonCode}`} />
          <Card>
            <h2 className="mb-1 font-extrabold">Descrição da equipe</h2>
            <p className="whitespace-pre-line">{e.description}</p>
          </Card>
          <div className="flex flex-wrap gap-2">
            <a href={`/jams/arquivo/${e.id}/projeto`} className={buttonClass("secondary", "sm")}><Download aria-hidden className="h-4 w-4" /> Baixar projeto-{e.anonCode}.sb3</a>
            <a href={`/jams/arquivo/${e.id}/documentacao`} className={buttonClass("secondary", "sm")}><Download aria-hidden className="h-4 w-4" /> Baixar documentacao-{e.anonCode}.{e.docExt}</a>
          </div>
          <p className="text-sm text-muted">Jogue aqui na página ou baixe o .sb3 para abrir no PictoBlox ou no Scratch.</p>
        </div>
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Sua avaliação</h2>
          <ScoreForm entryId={e.id} criteria={d.criteria} scores={e.scores} feedback={e.feedback} canScore={d.canScore} />
        </Card>
      </div>
    </div>
  );
}
