"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { UF_LIST, UFS } from "@/lib/br";
import { createAnnouncementAction, removeOrgAction, removeUserAction, type FormState } from "./actions";

/** Botão "Remover" que abre um campo de motivo antes de confirmar. */
export function RemoveButton({ kind, id, name }: { kind: "org" | "user"; id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const bound = (kind === "org" ? removeOrgAction : removeUserAction).bind(null, id);
  const [state, action, pending] = useActionState<FormState, FormData>(bound, undefined);
  if (state?.ok) return <span role="status" className="text-sm font-bold text-green-700">{state.ok}</span>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-danger btn-sm" aria-label={`Remover ${name}`}>
        <Trash2 aria-hidden className="h-4 w-4" /> Remover
      </button>
    );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <Input label={`Motivo para remover ${name}`} name="reason" required minLength={3} maxLength={300} autoFocus />
      <Button variant="danger" size="sm" disabled={pending}>{pending ? "Removendo..." : "Confirmar remoção"}</Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}

export function AnnouncementForm({ schools, cities }: { schools: { id: string; name: string; state: string }[]; cities: string[] }) {
  const [state, action, pending] = useActionState(createAnnouncementAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Input label="Título" name="title" required maxLength={120} />
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Texto (aceita **negrito**, listas e links)
        <textarea name="body" required rows={5} maxLength={5000} className="rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15" />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Para quem? <span className="font-semibold text-muted">(nada marcado = todas as escolas)</span></legend>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <label className="flex items-center gap-2"><input type="checkbox" name="roles" value="ORG_ADMIN" defaultChecked /> Coordenação</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="roles" value="TEACHER" defaultChecked /> Professores</label>
        </div>
        <details className="rounded-2xl border-2 border-line p-3">
          <summary className="cursor-pointer text-sm font-bold">Estados</summary>
          <div className="mt-2 grid grid-cols-3 gap-1 text-sm sm:grid-cols-6">
            {UF_LIST.map((uf) => (
              <label key={uf} className="flex items-center gap-1" title={UFS[uf]}><input type="checkbox" name="states" value={uf} /> {uf}</label>
            ))}
          </div>
        </details>
        <Input label="Cidades (separe por vírgula)" name="cities" list="cidades-conhecidas" hint={cities.length ? `Ex.: ${cities.slice(0, 3).join(", ")}` : undefined} />
        <datalist id="cidades-conhecidas">{cities.map((c) => <option key={c} value={c} />)}</datalist>
        <details className="rounded-2xl border-2 border-line p-3">
          <summary className="cursor-pointer text-sm font-bold">Escolas específicas</summary>
          <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto text-sm sm:grid-cols-2">
            {schools.map((s) => (
              <label key={s.id} className="flex items-center gap-2"><input type="checkbox" name="orgIds" value={s.id} /> {s.name} {s.state && <span className="text-muted">({s.state})</span>}</label>
            ))}
          </div>
        </details>
      </fieldset>

      <Input label="Expira em (opcional)" name="expiresAt" type="date" />
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <p role="status" className="text-sm font-bold text-green-700">{state.ok}</p>}
      <Button disabled={pending}>{pending ? "Publicando..." : "Publicar aviso"}</Button>
    </form>
  );
}
