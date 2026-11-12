import Link from "next/link";
import { redirect } from "next/navigation";
import { Stat } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { billingEnabled } from "@/lib/billing/entitlements";
import { requireUser } from "@/lib/dal/auth";
import { getOrgOverview, getSchoolDashboard } from "@/lib/dal/org";
import { ROLE_LABEL } from "@/lib/roles";
import { tenantUrl } from "@/lib/url";
import { LocationForm } from "./location-form";

export const metadata = { title: "Escola" };
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function EscolaPage(props: PageProps<"/escola">) {
  const user = await requireUser(["ORG_ADMIN", "SUPER_ADMIN"]);
  if (!user.organizationId) redirect("/plataforma");
  const [{ org, students }, dash] = await Promise.all([getOrgOverview(user), getSchoolDashboard(user)]);
  const sub = org.subscription;
  const welcome = (await props.searchParams)["bem-vindo"] === "1";
  const address = tenantUrl(org.slug);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">{org.name}</h1>
        <p className="text-sm text-muted">
          Endereço para alunos e professores: <a href={address} className="font-bold text-brand underline">{address}</a>
          {org.city && ` · ${org.city}/${org.state}`}
        </p>
      </div>
      {welcome && (
        <Card className="space-y-2 bg-brand/5">
          <p className="text-lg font-bold">Conta criada! {billingEnabled() ? "Seu teste grátis de 14 dias já começou." : "Tudo pronto para começar."}</p>
          <p className="text-sm">Próximos passos: crie uma turma, cadastre os alunos e libere um curso.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {billingEnabled() && <Stat label="Plano" value={sub?.plan.name ?? "Sem plano"} />}
        <Stat label={sub?.seats && billingEnabled() ? "Alunos / vagas" : "Alunos"} value={sub?.seats && billingEnabled() ? `${students}/${sub.seats}` : students} />
        <Stat label="Ativos nos últimos 7 dias" value={dash.totals.activeWeek} />
        <Stat label="Lições concluídas (30 dias)" value={dash.totals.doneMonth} />
        <Stat label="Turmas" value={dash.totals.classes} />
      </div>

      <Card className="overflow-x-auto">
        <h2 className="mb-1 text-lg font-bold">Turmas</h2>
        <p className="mb-3 text-sm text-muted">Conclusão = lições obrigatórias feitas pelos alunos nos cursos liberados para a turma.</p>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-muted">
            <tr><th className="py-2">Turma</th><th>Professor(a)</th><th className="text-right">Alunos</th><th className="text-right">Ativos (7 dias)</th><th className="w-48 pl-4">Conclusão</th></tr>
          </thead>
          <tbody>
            {dash.classes.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-2"><Link href={`/professor/turmas/${c.id}`} className="font-extrabold text-brand hover:underline">{c.name}</Link> <span className="font-mono text-xs text-muted">{c.code}</span></td>
                <td>{c.teacher}</td>
                <td className="text-right tabular-nums">{c.students}</td>
                <td className="text-right tabular-nums">{c.activeWeek}</td>
                <td className="pl-4">
                  {c.completion === null ? (
                    <span className="text-xs font-semibold text-muted">{c.hasCourse ? "sem alunos" : "nenhum curso liberado"}</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="h-3 flex-1 overflow-hidden rounded-full bg-black/[0.07]" role="progressbar" aria-valuenow={c.completion} aria-valuemin={0} aria-valuemax={100} aria-label={`Conclusão da turma ${c.name}`}>
                        <span className="block h-full rounded-full bg-green-500" style={{ width: `${c.completion}%` }} />
                      </span>
                      <span className="w-10 text-right font-bold tabular-nums">{c.completion}%</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {dash.classes.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted">Nenhuma turma ainda.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-lg font-bold">Equipe</h2>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-muted">
            <tr><th className="py-2">Nome</th><th>Papel</th><th className="text-right">Turmas</th><th className="text-right">Alunos</th><th className="pl-4">Último acesso</th></tr>
          </thead>
          <tbody>
            {dash.teachers.map((t) => (
              <tr key={t.id} className={`border-t border-line ${t.active ? "" : "opacity-60"}`}>
                <td className="py-2 font-semibold">{t.name}{!t.active && <span className="ml-2 text-xs text-muted">(desativado)</span>}</td>
                <td>{ROLE_LABEL[t.role]}</td>
                <td className="text-right tabular-nums">{t.classes}</td>
                <td className="text-right tabular-nums">{t.students}</td>
                <td className="pl-4">{t.lastLoginAt ? when.format(t.lastLoginAt) : "nunca entrou"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {user.role === "ORG_ADMIN" && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Localização</h2>
          {!org.city && <p className="mb-2 text-sm font-semibold text-amber-800">Informe a cidade e o estado da escola para receber avisos e convites de game jams da sua região.</p>}
          <LocationForm city={org.city} state={org.state} />
        </Card>
      )}
    </div>
  );
}
