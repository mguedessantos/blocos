"use client";

import { useActionState } from "react";
import { saveJudgementAction, type JamFormState } from "@/app/jams/actions";
import { Alert, Button } from "@/components/ui";

type Criterion = { id: string; name: string; weight: number; maxScore: number };

export function ScoreForm({ entryId, criteria, scores, feedback, canScore }: { entryId: string; criteria: Criterion[]; scores: Record<string, number>; feedback: string; canScore: boolean }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(saveJudgementAction.bind(null, entryId, criteria.map((c) => c.id)), undefined);
  return (
    <form action={action} className="space-y-4">
      {criteria.map((c) => (
        <label key={c.id} className="flex items-center justify-between gap-3 text-sm font-bold">
          <span>
            {c.name}
            {c.weight !== 1 && <span className="ml-1 text-xs font-semibold text-muted">(peso {c.weight.toLocaleString("pt-BR")})</span>}
          </span>
          <span className="flex items-center gap-1">
            <input
              type="number" name={`c_${c.id}`} min={0} max={c.maxScore} step={1} required disabled={!canScore}
              defaultValue={scores[c.id]} aria-label={`Nota para ${c.name}, de 0 a ${c.maxScore}`}
              className="min-h-11 w-20 rounded-xl border-2 border-line bg-white px-2 text-center text-lg font-extrabold"
            />
            <span className="text-muted">/ {c.maxScore}</span>
          </span>
        </label>
      ))}
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Comentário para a equipe (opcional — eles veem depois do resultado)
        <textarea name="feedback" rows={5} maxLength={2000} defaultValue={feedback} disabled={!canScore} className="rounded-2xl border-2 border-line bg-white px-3 py-2 text-base font-semibold" />
      </label>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <p role="status" className="font-bold text-green-700">{state.ok}</p>}
      {canScore ? <Button disabled={pending}>{pending ? "Salvando..." : "Salvar avaliação"}</Button> : <p className="text-sm font-semibold text-muted">O período de julgamento terminou.</p>}
    </form>
  );
}
