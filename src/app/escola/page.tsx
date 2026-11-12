import { billingEnabled } from "@/lib/billing/entitlements";
import { redirect } from "next/navigation";
import { Stat } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { getOrgOverview } from "@/lib/dal/org";
import { ROLE_LABEL } from "@/lib/roles";
import { tenantUrl } from "@/lib/url";

export const metadata = { title: "Escola" };

export default async function EscolaPage(props: PageProps<"/escola">) {
  const user = await requireUser(["ORG_ADMIN", "SUPER_ADMIN"]);
  if (!user.organizationId) redirect("/plataforma");
  const { org, students, teachers, classes } = await getOrgOverview(user);
  const sub = org.subscription;
  const welcome = (await props.searchParams)["bem-vindo"] === "1";
  const address = tenantUrl(org.slug);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">{org.name}</h1>
      {welcome && (
        <Card className="space-y-2 bg-brand/5">
          <p className="text-lg font-bold">Conta criada! {billingEnabled() ? "Seu teste grátis de 14 dias já começou." : "Tudo pronto para começar."}</p>
          <p className="text-sm">Próximos passos: crie uma turma, cadastre os alunos e escolha uma trilha.</p>
        </Card>
      )}
      <p className="text-sm text-muted">
        Endereço para seus alunos e professores: <a href={address} className="font-bold text-brand underline">{address}</a>
      </p>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Plano" value={sub?.plan.name ?? "Sem plano"} />
        <Stat label="Alunos" value={sub?.seats ? `${students}/${sub.seats}` : students} />
        <Stat label="Turmas" value={classes} />
        <Stat label="Equipe" value={teachers.length} />
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Equipe</h2>
        <ul className="divide-y divide-black/5">
          {teachers.map((t) => (
            <li key={t.id} className="flex justify-between py-2 text-sm">
              <span className="font-semibold">{t.name} <span className="font-normal text-muted">{t.email}</span></span>
              <span className="text-muted">{ROLE_LABEL[t.role]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
