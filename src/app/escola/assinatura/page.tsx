import { Stat } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { isSubscriptionUsable, studentLimit } from "@/lib/billing/entitlements";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { requireUser } from "@/lib/dal/auth";
import { confirmCheckoutForUser, getBillingOverview } from "@/lib/dal/billing";
import { formatDate } from "@/lib/format";
import { PlanCard, PortalButton } from "./billing-forms";

export const metadata = { title: "Assinatura" };

const STATUS_LABEL = {
  TRIAL: "Teste grátis",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelada",
  READ_ONLY: "Somente leitura",
} as const;

export default async function AssinaturaPage(props: PageProps<"/escola/assinatura">) {
  const user = await requireUser(["ORG_ADMIN"]);
  const { status, session_id: sessionId } = await props.searchParams;
  // Volta do Checkout: confirma direto no Stripe antes de ler o status (não espera o webhook).
  if (status === "sucesso" && typeof sessionId === "string") await confirmCheckoutForUser(user, sessionId);
  const { subscription: sub, plans, students, classes } = await getBillingOverview(user);
  const stripeReady = isStripeConfigured();
  const hasPaid = Boolean(sub?.stripeSubscriptionId) && sub?.status !== "CANCELED";
  const limit = studentLimit(sub);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Assinatura</h1>

      {status === "sucesso" && (
        <p className="rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-800">
          {sub?.status === "ACTIVE"
            ? "Pagamento confirmado! 🎉 Sua assinatura está ativa."
            : "Pagamento recebido! 🎉 Sua assinatura será ativada em instantes (atualize a página)."}
        </p>
      )}
      {status === "cancelado" && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 font-semibold text-amber-800">Pagamento não concluído. Nada foi cobrado.</p>
      )}
      {!stripeReady && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Pagamentos online ainda não estão configurados nesta instalação (STRIPE_SECRET_KEY).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Plano" value={sub?.plan.name ?? "Nenhum"} />
        <Stat label="Situação" value={sub ? STATUS_LABEL[sub.status] : "—"} />
        <Stat label="Alunos" value={limit === null ? students : `${students} / ${limit}`} />
        <Stat label="Turmas" value={sub?.plan.maxClasses ? `${classes} / ${sub.plan.maxClasses}` : classes} />
      </div>

      {sub && (
        <Card className="space-y-2 text-sm">
          {sub.status === "TRIAL" && sub.trialEndsAt && (
            <p>
              Seu teste grátis {isSubscriptionUsable(sub) ? "termina" : "terminou"} em <strong>{formatDate(sub.trialEndsAt)}</strong>.
              Depois disso a conta fica somente leitura até a assinatura.
            </p>
          )}
          {sub.currentPeriodEnd && sub.status !== "TRIAL" && (
            <p>
              {sub.cancelAtPeriodEnd ? "A assinatura será encerrada em" : "Próxima renovação em"}{" "}
              <strong>{formatDate(sub.currentPeriodEnd)}</strong>.
            </p>
          )}
          {sub.status === "PAST_DUE" && <p className="font-semibold text-red-700">Não conseguimos cobrar seu último pagamento. Atualize a forma de pagamento.</p>}
          {hasPaid && stripeReady && <PortalButton />}
        </Card>
      )}

      {!hasPaid && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Escolha seu plano</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                defaultSeats={students}
                disabled={!stripeReady || !p.stripePriceId}
                plan={{
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  priceCents: p.priceCents,
                  perSeat: p.perSeat,
                  minSeats: p.minSeats,
                  features: p.features,
                  current: sub?.planId === p.id && sub.status !== "TRIAL",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-black/50">
            Pagamento seguro pelo Stripe. Escolas que preferem boleto/fatura anual: fale com o suporte.
          </p>
        </section>
      )}
    </div>
  );
}
