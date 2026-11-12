"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { UF_LIST, UFS } from "@/lib/br";
import { updateLocationAction } from "./actions";

export function LocationForm({ city, state }: { city: string; state: string }) {
  const [res, action, pending] = useActionState(updateLocationAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1"><Input label="Cidade" name="city" defaultValue={city} required /></div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Estado
        <select key={state} name="state" defaultValue={state} required className="min-h-12 rounded-2xl border-2 border-line bg-white px-3 text-base font-semibold">
          <option value="" disabled>UF</option>
          {UF_LIST.map((uf) => <option key={uf} value={uf} title={UFS[uf]}>{uf}</option>)}
        </select>
      </label>
      <Button size="sm" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
      {res?.ok && <p role="status" className="text-sm font-bold text-green-700">Salvo!</p>}
      {res?.error && <Alert>{res.error}</Alert>}
    </form>
  );
}
