"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { addJudgeAction, closeJudgingAction, type JamFormState } from "../../actions";

export function AddJudgeForm({ jamId }: { jamId: string }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(addJudgeAction.bind(null, jamId), undefined);
  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1"><Input label="Nome do jurado" name="name" required /></div>
        <div className="min-w-56 flex-1"><Input label="Email do jurado" name="email" type="email" required /></div>
        <Button size="sm" disabled={pending}>{pending ? "Adicionando..." : "Adicionar jurado"}</Button>
      </form>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && (
        <div role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-900">
          {state.ok}
          {state.password && (
            <p className="mt-1 font-semibold">
              Senha padrão: <code className="rounded bg-white px-2 py-0.5 font-mono text-base">{state.password}</code>. Envie ao jurado: no primeiro acesso ele cria a própria senha.
              O acesso é pelo site principal, em “Entrar”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Encerrar o julgamento: o servidor recusa enquanto houver entrega sem avaliação. */
export function CloseJudgingForm({ jamId, pending: missing }: { jamId: string; pending: string[] }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(closeJudgingAction.bind(null, jamId), undefined);
  return (
    <form action={action} className="space-y-3">
      {missing.length > 0 && <Alert>Ainda faltam avaliações: {missing.join(", ")}. Todas as entregas precisam ser avaliadas antes de encerrar.</Alert>}
      <label className="block text-sm font-bold">
        Próximos passos para os finalistas
        <textarea name="nextSteps" rows={3} maxLength={1000} className="mt-1 block w-full rounded-xl border border-line p-3 font-normal" placeholder="Ex.: a final será on-line no dia 10/12; o professor recebe o convite por email." />
      </label>
      <Button size="sm" disabled={pending || missing.length > 0}>{pending ? "Encerrando..." : "Encerrar julgamento e avisar as equipes"}</Button>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <div role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-900">{state.ok}</div>}
    </form>
  );
}
