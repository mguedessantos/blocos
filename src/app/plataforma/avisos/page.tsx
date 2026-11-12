import { Megaphone } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { listAnnouncements, listPlatformSchools } from "@/lib/dal/platform";
import { parsePlatformFilters } from "@/lib/platform-filters";
import { ROLE_LABEL } from "@/lib/roles";
import { deleteAnnouncementAction } from "../actions";
import { AnnouncementForm } from "../forms";

export const metadata = { title: "Avisos" };
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function AvisosPage() {
  const user = await requireUser(["SUPER_ADMIN"]);
  const [list, schools] = await Promise.all([listAnnouncements(user), listPlatformSchools(user, parsePlatformFilters({}))]);
  const cities = [...new Set(schools.map((s) => s.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const names = new Map(schools.map((s) => [s.id, s.name]));
  return (
    <div className="space-y-6">
      <PageHeader icon={<Megaphone className="h-7 w-7" />} title="Avisos para escolas" subtitle="Notícias e comunicados que aparecem no sino da coordenação e dos professores." />
      <Card>
        <h2 className="mb-3 text-lg font-bold">Novo aviso</h2>
        <AnnouncementForm schools={schools.map((s) => ({ id: s.id, name: s.name, state: s.state }))} cities={cities} />
      </Card>
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Publicados</h2>
        {list.map((a) => {
          const target = [
            a.roles.length ? a.roles.map((r) => ROLE_LABEL[r]).join(", ") : "Coordenação e professores",
            a.states.length ? `UF: ${a.states.join(", ")}` : null,
            a.cities.length ? `Cidades: ${a.cities.join(", ")}` : null,
            a.orgIds.length ? `Escolas: ${a.orgIds.map((i) => names.get(i) ?? "removida").join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Card key={a.id} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold">{a.title}</h3>
                  <p className="text-xs font-semibold text-muted">
                    {when.format(a.publishedAt)}{a.expiresAt ? ` · expira ${when.format(a.expiresAt)}` : ""} · {target} · lido por {a._count.reads}
                  </p>
                </div>
                <form action={deleteAnnouncementAction.bind(null, a.id)}><button className="btn btn-secondary btn-sm">Apagar</button></form>
              </div>
              <Markdown source={a.body} />
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-muted">Nenhum aviso publicado.</p>}
      </section>
    </div>
  );
}
