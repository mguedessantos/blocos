"use client";

import { useActionState, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { openBillingPortal, startCheckout } from "./actions";

type PlanOption = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  perSeat: boolean;
  minSeats: number;
  features: string[];
  current: boolean;
};

const FEATURE_LABEL: Record<string, string> = {
  white_label: "Marca e domínio próprios",
  ai_tutor: "Tutor com IA para os alunos",
  unlimited_jams: "Game jams ilimitadas",
};

export function PlanCard({ plan, defaultSeats, disabled }: { plan: PlanOption; defaultSeats: number; disabled: boolean }) {
  const [state, action, pending] = useActionState(startCheckout, undefined);
  const [seats, setSeats] = useState(Math.max(defaultSeats, plan.minSeats));
  const total = plan.perSeat ? plan.priceCents * seats : plan.priceCents;

  return (
    <form action={action} className={`flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-2 ${plan.current ? "ring-brand" : "ring-black/5"}`}>
      <input type="hidden" name="planId" value={plan.id} />
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold">{plan.name}</h3>
        {plan.current && <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-text">Atual</span>}
      </div>
      <p className="text-sm text-black/60">{plan.description}</p>
      <p className="text-2xl font-extrabold">
        {formatBRL(plan.priceCents)}
        <span className="text-sm font-semibold text-black/50">{plan.perSeat ? " por aluno/mês" : " /mês"}</span>
      </p>
      {plan.features.length > 0 && (
        <ul className="text-sm">
          {plan.features.map((f) => <li key={f}>✓ {FEATURE_LABEL[f] ?? f}</li>)}
        </ul>
      )}
      {plan.perSeat && (
        <label className="flex items-center justify-between gap-2 text-sm font-semibold">
          Número de alunos
          <input
            type="number"
            name="seats"
            min={plan.minSeats}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value) || plan.minSeats)}
            className="w-24 rounded-lg border-2 border-black/10 px-2 py-1 text-right"
          />
        </label>
      )}
      {plan.perSeat && <p className="text-sm text-black/60">Total: <strong>{formatBRL(total)}/mês</strong></p>}
      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={disabled || pending}>{pending ? "Abrindo pagamento..." : "Assinar"}</Button>
    </form>
  );
}

export function PortalButton() {
  const [state, action, pending] = useActionState(openBillingPortal, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button disabled={pending}>{pending ? "Abrindo..." : "Gerenciar assinatura, cartão e faturas"}</Button>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}
