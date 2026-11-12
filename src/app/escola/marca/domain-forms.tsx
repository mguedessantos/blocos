"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { addDomainAction, removeDomainAction, verifyDomainAction, type BrandState } from "./actions";

export function AddDomainForm() {
  const [state, action, pending] = useActionState<BrandState, FormData>(addDomainAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1"><Input label="Domínio próprio" name="hostname" placeholder="codigo.suaescola.com.br" required /></div>
        <Button size="sm" disabled={pending}>{pending ? "Adicionando..." : "Adicionar domínio"}</Button>
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <p role="status" className="text-sm font-bold text-green-700">{state.ok}</p>}
    </form>
  );
}

export function DomainActions({ id }: { id: string }) {
  const [state, verify, pending] = useActionState<BrandState>(verifyDomainAction.bind(null, id), undefined);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={verify}><Button size="sm" disabled={pending}>{pending ? "Verificando..." : "Verificar"}</Button></form>
        <form action={removeDomainAction.bind(null, id)}><Button size="sm" variant="secondary">Remover</Button></form>
      </div>
      {state?.error && <p role="alert" className="text-sm font-bold text-amber-800">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-bold text-green-700">{state.ok}</p>}
    </div>
  );
}
