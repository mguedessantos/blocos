import { notFound } from "next/navigation";
import { billingEnabled } from "@/lib/billing/entitlements";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listPublicPlans } from "@/lib/dal/public";
import { formatBRL } from "@/lib/format";
import { getTenant } from "@/lib/tenant";

export const metadata = { title: "Preços" };

const FEATURE_LABEL: Record<string, string> = {
  white_label: "Marca, cores e domínio próprios",
  ai_tutor: "Tutor com IA (dicas para os alunos)",
  unlimited_jams: "Game jams ilimitadas",
};

export default async function PrecosPage() {
  if (!billingEnabled()) notFound();
  if (await getTenant()) redirect("/"); // preços só no site principal
  const plans = await listPublicPlans();

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-extrabold">Planos e preços</h1>
        <p className="text-muted">Teste grátis por 14 dias, sem cartão. Cancele quando quiser.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="clay clay-hover flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-black/40">
                {p.orgType === "ESCOLA" ? "Para escolas" : "Para professores"}
              </p>
              <h2 className="text-2xl font-extrabold">{p.name}</h2>
              <p className="text-sm text-muted">{p.description}</p>
            </div>
            <p className="text-3xl font-extrabold">
              {formatBRL(p.priceCents)}
              <span className="text-sm font-semibold text-muted">{p.perSeat ? " por aluno/mês" : " /mês"}</span>
            </p>
            <ul className="flex-1 space-y-1 text-sm">
              <li>✓ Todas as trilhas de programação em blocos</li>
              <li>✓ Editor no navegador + envio de projetos .sb3</li>
              <li>✓ Painel de progresso para professores</li>
              <li>✓ {p.maxStudents ? `Até ${p.maxStudents} alunos` : p.perSeat ? `A partir de ${p.minSeats} alunos` : "Alunos ilimitados"}</li>
              <li>✓ {p.maxClasses ? `Até ${p.maxClasses} turmas` : "Turmas e professores ilimitados"}</li>
              {p.features.map((f) => <li key={f}>✓ {FEATURE_LABEL[f] ?? f}</li>)}
            </ul>
            <Link href="/cadastro" className="btn">
              Começar teste grátis
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
