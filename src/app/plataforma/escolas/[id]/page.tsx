import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getPlatformSchool } from "@/lib/dal/platform";
import { ROLE_LABEL } from "@/lib/roles";
import { restoreOrgAction, restoreUserAction } from "../../actions";
import { setOrganizerAction } from "@/app/jams/actions";
import { AddStaffForm, RemoveButton, ResetPasswordButton } from "../../forms";

export const metadata = { title: "Escola" };
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function EscolaDetalhe(props: PageProps<"/plataforma/escolas/[id]">) {
  const user = await requireUser(["SUPER_ADMIN"]);
  const { id } = await props.params;
  const org = await getPlatformSchool(user, id).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/plataforma" className="text-sm font-semibold text-brand">← Painel</Link>
          <h1 className="text-3xl font-extrabold">{org.name}</h1>
          <p className="font-semibold text-muted">
            {org.type === "ESCOLA" ? "Escola" : "Professor(a) independente"} · {org.city || "cidade não informada"}
            {org.state ? `/${org.state}` : ""} · {org.slug} · plano {org.subscription?.plan.name ?? "—"}
          </p>
          {org.deletedAt && <p role="status" className="mt-2 font-bold text-red-700">Na lixeira desde {when.format(org.deletedAt)}.</p>}
        </div>
        {org.deletedAt ? (
          <form action={restoreOrgAction.bind(null, org.id)}><button className="btn btn-success">Restaurar escola</button></form>
        ) : (
          <RemoveButton kind="org" id={org.id} name={org.name} />
        )}
      </div>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-lg font-bold">Contas ({org.users.length})</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted">
            <tr><th className="py-2">Nome</th><th>Login</th><th>Papel</th><th className="text-right">Concluídas</th><th className="pl-4">Último acesso</th><th></th></tr>
          </thead>
          <tbody>
            {org.users.map((u) => (
              <tr key={u.id} className={`border-t border-line ${u.deletedAt ? "opacity-60" : ""}`}>
                <td className="py-2 font-semibold">
                  {u.name}
                  {!u.active && <span className="ml-2 text-xs text-muted">(desativado)</span>}
                  {u.deletedAt && <span className="ml-2 text-xs text-red-700">(na lixeira)</span>}
                </td>
                <td>{u.email ?? u.username}</td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td className="text-right tabular-nums">{u._count.progress}</td>
                <td className="pl-4">{u.lastLoginAt ? when.format(u.lastLoginAt) : "—"}</td>
                <td className="py-2 text-right">
                  <span className="inline-flex flex-wrap items-center justify-end gap-2">
                  {!u.deletedAt && (u.role === "TEACHER" || u.role === "ORG_ADMIN") && (
                    <form action={setOrganizerAction.bind(null, u.id, !u.canOrganizeJams)}>
                      <button className={`btn btn-sm ${u.canOrganizeJams ? "btn-success" : "btn-secondary"}`} title="Pode criar e gerenciar game jams">
                        {u.canOrganizeJams ? "✓ Organiza jams" : "Permitir organizar jams"}
                      </button>
                    </form>
                  )}
                  {!u.deletedAt && <ResetPasswordButton userId={u.id} name={u.name} />}
                  {u.deletedAt ? (
                    <form action={restoreUserAction.bind(null, u.id)}><button className="btn btn-secondary btn-sm">Restaurar</button></form>
                  ) : (
                    <RemoveButton kind="user" id={u.id} name={u.name} />
                  )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {!org.deletedAt && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Adicionar pessoa</h2>
          <p className="mb-3 text-sm text-muted">Cria a conta já ligada a esta escola, com uma senha temporária para você enviar.</p>
          <AddStaffForm orgId={org.id} isSchool={org.type === "ESCOLA"} />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-bold">Turmas ({org.classes.length})</h2>
        <ul className="divide-y divide-line text-sm">
          {org.classes.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 py-2">
              <span className="font-semibold">
                {c.name} <span className="font-mono text-muted">{c.code}</span>
                {c.archived && <span className="ml-2 text-muted">(arquivada)</span>}
              </span>
              <span className="text-muted">Prof. {c.teacher.name} · {c._count.enrollments} alunos</span>
            </li>
          ))}
          {org.classes.length === 0 && <li className="py-2 text-muted">Nenhuma turma.</li>}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Histórico recente</h2>
        <ul className="space-y-1 text-sm">
          {org.auditLogs.map((a) => {
            const reason = (a.metadata as { reason?: string } | null)?.reason;
            return (
              <li key={a.id}>
                <span className="text-muted">{when.format(a.createdAt)}</span> · <strong>{a.action}</strong>
                {reason ? ` — ${reason}` : ""}
              </li>
            );
          })}
          {org.auditLogs.length === 0 && <li className="text-muted">Nada registrado.</li>}
        </ul>
      </Card>
    </div>
  );
}
