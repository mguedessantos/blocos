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
  maxStudents: number | null;
  maxTeachers: number | null;
  addons: { id: string; name: string; students: number; priceCents: number }[];
  features: string[];
  current: boolean;
};

const FEATURE_LABEL: Record<string, string> = {
  white_label: "Marca e domínio da sua escola",
  ai_tutor: "Tutor com IA para os alunos",
  unlimited_jams: "Game jams ilimitadas",
};

export function PlanCard({ plan, defaultSeats, disabled }: { plan: PlanOption; defaultSeats: number; disabled: boolean }) {
  const [state, action, pending] = useActionState(startCheckout, undefined);
  const [seats, setSeats] = useState(Math.max(defaultSeats, plan.minSeats));
  const [qty, setQty] = useState<Record<string, number>>({});
  const extraCents = plan.addons.reduce((sum, a) => sum + a.priceCents * (qty[a.id] ?? 0), 0);
  const extraStudents = plan.addons.reduce((sum, a) => sum + a.students * (qty[a.id] ?? 0), 0);
  const total = (plan.perSeat ? plan.priceCents * seats : plan.priceCents) + extraCents;

  return (
    <form action={action} className={`clay flex flex-col gap-3 p-6 ${plan.current ? "!border-brand" : ""}`}>
      <input type="hidden" name="planId" value={plan.id} />
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold">{plan.name}</h3>
        {plan.current && <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-text">Atual</span>}
      </div>
      <p className="text-sm text-muted">{plan.description}</p>
      <p className="text-2xl font-extrabold">
        {formatBRL(plan.priceCents)}
        <span className="text-sm font-semibold text-muted">{plan.perSeat ? " por aluno/mês" : " /mês"}</span>
      </p>
      <ul className="text-sm">
        <li>✓ {plan.maxTeachers === 1 ? "1 professor" : "Professores ilimitados"}</li>
        <li>✓ {plan.maxStudents === null ? "Alunos ilimitados" : `Até ${plan.maxStudents} alunos`}</li>
        {plan.features.map((f) => <li key={f}>✓ {FEATURE_LABEL[f] ?? f}</li>)}
      </ul>
      {plan.addons.map((a) => (
        <label key={a.id} className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>Adicional {a.name} <span className="font-normal text-muted">({formatBRL(a.priceCents)}/mês cada)</span></span>
          <input
            type="number"
            name={`addon_${a.id}`}
            min={0}
            max={20}
            value={qty[a.id] ?? 0}
            onChange={(e) => setQty({ ...qty, [a.id]: Math.max(0, Number(e.target.value) || 0) })}
            className="w-20 rounded-lg border-2 border-black/10 px-2 py-1 text-right"
          />
        </label>
      ))}
      {plan.maxStudents !== null && extraStudents > 0 && (
        <p className="text-sm text-muted">Até <strong>{plan.maxStudents + extraStudents} alunos</strong> · total <strong>{formatBRL(total)}/mês</strong></p>
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
      {plan.perSeat && <p className="text-sm text-muted">Total: <strong>{formatBRL(total)}/mês</strong></p>}
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
