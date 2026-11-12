"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { inviteTeacherAction } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteTeacherAction, undefined);
  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Input label="Email do(a) professor(a)" name="email" type="email" required />
        </div>
        <Button disabled={pending}>{pending ? "Gerando..." : "Convidar"}</Button>
      </form>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.link && (
        <div className="space-y-2 rounded-xl bg-green-50 p-4 text-sm">
          <p className="font-semibold text-green-900">{state.emailed ? `Convite enviado por email para ${state.email}.` : `Convite criado para ${state.email}.`} Se precisar, envie também este link (vale 7 dias):</p>
          <div className="flex gap-2">
            <input readOnly value={state.link} aria-label="Link do convite" className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-xs" />
            <button type="button" onClick={() => navigator.clipboard.writeText(state.link!)} className="btn btn-sm">
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
