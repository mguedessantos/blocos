import { Stat } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { getPlatformOverview } from "@/lib/dal/platform";

export const metadata = { title: "Plataforma" };

export default async function PlataformaPage() {
  const user = await requireUser(["SUPER_ADMIN"]);
  const { orgs, students, teachers } = await getPlatformOverview(user);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Visão geral da plataforma</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Clientes" value={orgs.length} />
        <Stat label="Professores" value={teachers} />
        <Stat label="Alunos" value={students} />
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Clientes</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-black/50">
            <tr><th className="py-2">Nome</th><th>Tipo</th><th>Plano</th><th>Status</th><th>Domínios</th><th>Usuários</th></tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-black/5">
                <td className="py-2 font-semibold">{o.name}</td>
                <td>{o.type === "ESCOLA" ? "Escola" : "Professor"}</td>
                <td>{o.subscription?.plan.name ?? "—"}</td>
                <td>{o.subscription?.status ?? "—"}</td>
                <td>{[`${o.slug}.${process.env.ROOT_DOMAIN}`, ...o.domains.map((d) => d.hostname)].join(", ")}</td>
                <td>{o._count.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
