"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { addJudgeAction, type JamFormState } from "../../actions";

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
