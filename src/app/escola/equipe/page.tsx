import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getTeam } from "@/lib/dal/team";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { tenantUrl } from "@/lib/url";
import { revokeInviteAction, setTeacherActiveAction } from "./actions";
import { InviteForm } from "./team-forms";

export const metadata = { title: "Equipe" };

export default async function EquipePage() {
  const user = await requireUser(["ORG_ADMIN"]);
  const team = await getTeam(user).catch((err) => {
    if (err instanceof AccessError) redirect("/escola");
    throw err;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Equipe</h1>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Convidar professor(a)</h2>
        <InviteForm />
      </Card>

      {team.invites.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-bold">Convites pendentes</h2>
          <ul className="divide-y divide-black/5 text-sm">
            {team.invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-semibold">{i.email}</span>
                <span className="text-black/50">expira em {formatDate(i.expiresAt)}</span>
                <code className="max-w-full truncate text-xs text-black/50">{`${tenantUrl(team.org.slug)}/convite/${i.token}`}</code>
                <form action={revokeInviteAction.bind(null, i.id)}>
                  <button className="font-semibold text-red-700 underline">Cancelar</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-bold">Professores e coordenação</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-black/50">
            <tr><th className="py-2">Nome</th><th>Email</th><th>Papel</th><th>Turmas</th><th>Último acesso</th><th /></tr>
          </thead>
          <tbody>
            {team.members.map((m) => (
              <tr key={m.id} className={`border-t border-black/5 ${m.active ? "" : "text-black/40"}`}>
                <td className="py-2 font-semibold">{m.name}</td>
                <td>{m.email}</td>
                <td>{ROLE_LABEL[m.role]}</td>
                <td>{m._count.teachingClasses}</td>
                <td>{m.lastLoginAt ? formatDate(m.lastLoginAt) : "nunca"}</td>
                <td className="text-right">
                  {m.role === "TEACHER" && (
                    <form action={setTeacherActiveAction.bind(null, m.id, !m.active)}>
                      <button className="font-semibold text-brand underline">{m.active ? "Desativar" : "Reativar"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
