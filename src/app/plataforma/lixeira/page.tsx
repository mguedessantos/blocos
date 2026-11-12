import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { TRASH_DAYS } from "@/lib/br";
import { requireUser } from "@/lib/dal/auth";
import { listTrash } from "@/lib/dal/platform";
import { ROLE_LABEL } from "@/lib/roles";
import { purgeOrgAction, purgeUserAction, restoreOrgAction, restoreUserAction } from "../actions";

export const metadata = { title: "Lixeira" };
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function LixeiraPage() {
  const user = await requireUser(["SUPER_ADMIN"]);
  const { orgs, users } = await listTrash(user);
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trash2 className="h-7 w-7" />}
        title="Lixeira"
        subtitle={`Contas removidas não conseguem entrar. Restaure quando quiser; apagar de vez só depois de ${TRASH_DAYS} dias.`}
      />
      <Card>
        <h2 className="mb-3 text-lg font-bold">Escolas ({orgs.length})</h2>
        <ul className="divide-y divide-line">
          {orgs.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <Link href={`/plataforma/escolas/${o.id}`} className="font-extrabold text-brand">{o.name}</Link>
                <span className="block text-sm text-muted">
                  {o.city}{o.state ? `/${o.state}` : ""} · {o._count.users} contas · removida em {when.format(o.deletedAt!)}
                </span>
              </span>
              <span className="flex gap-2">
                <form action={restoreOrgAction.bind(null, o.id)}><button className="btn btn-success btn-sm">Restaurar</button></form>
                {o.purgeable && <form action={purgeOrgAction.bind(null, o.id)}><button className="btn btn-danger btn-sm">Apagar de vez</button></form>}
              </span>
            </li>
          ))}
          {orgs.length === 0 && <li className="py-2 text-sm text-muted">Nenhuma escola na lixeira.</li>}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Contas ({users.length})</h2>
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <strong>{u.name}</strong> <span className="text-sm text-muted">{u.email ?? u.username} · {ROLE_LABEL[u.role]}</span>
                <span className="block text-sm text-muted">{u.organization?.name ?? "Sem escola"} · removida em {when.format(u.deletedAt!)}</span>
              </span>
              <span className="flex gap-2">
                <form action={restoreUserAction.bind(null, u.id)}><button className="btn btn-success btn-sm">Restaurar</button></form>
                {u.purgeable && <form action={purgeUserAction.bind(null, u.id)}><button className="btn btn-danger btn-sm">Apagar de vez</button></form>}
              </span>
            </li>
          ))}
          {users.length === 0 && <li className="py-2 text-sm text-muted">Nenhuma conta na lixeira.</li>}
        </ul>
      </Card>
    </div>
  );
}
