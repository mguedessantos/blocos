"use client";

import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { UF_LIST, UFS } from "@/lib/br";
import { addStaffAction, createAnnouncementAction, createSchoolAction, removeOrgAction, removeUserAction, resetPasswordAction, type FormState } from "./actions";
import { slugify } from "@/lib/slug";

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

/** Mostra login + senha padrão, com botão de copiar. */
function Credentials({ state }: { state: FormState }) {
  if (!state?.password) return null;
  const text = `Login: ${state.login}
Senha padrão: ${state.password} (troque no primeiro acesso)`;
  return (
    <div role="status" className="space-y-2 rounded-2xl border-2 border-green-300 bg-green-50 p-4 text-sm">
      <p className="font-extrabold text-green-900">{state.ok}</p>
      <p>Login: <code className="rounded bg-white px-2 py-0.5 font-mono font-bold">{state.login}</code></p>
      <p>Senha padrão: <code className="rounded bg-white px-2 py-0.5 font-mono font-bold">{state.password}</code></p>
      <p className="text-xs font-semibold text-green-900">Envie à pessoa: no primeiro acesso ela é obrigada a criar a própria senha.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigator.clipboard.writeText(text)} className="btn btn-secondary btn-sm"><Copy aria-hidden className="h-4 w-4" /> Copiar</button>
        {state.href && <Link href={state.href} className="btn btn-sm">Abrir a escola</Link>}
      </div>
    </div>
  );
}

const select = "min-h-12 rounded-2xl border-2 border-line bg-white px-3 text-base font-semibold";

export function NewSchoolForm({ plans }: { plans: { id: string; name: string; orgType: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSchoolAction, undefined);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edited, setEdited] = useState(false);
  const [type, setType] = useState<"ESCOLA" | "PROFESSOR_INDEPENDENTE">("ESCOLA");
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}><Plus aria-hidden className="h-4 w-4" /> Nova escola</Button>;
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Tipo
          <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={select}>
            <option value="ESCOLA">Escola</option>
            <option value="PROFESSOR_INDEPENDENTE">Professor(a) independente</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Plano
          <select name="planId" defaultValue={plans.find((p) => p.orgType === "ESCOLA")?.id} className={select}>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <Input label={type === "ESCOLA" ? "Nome da escola" : "Nome da conta"} name="name" value={name} required onChange={(e) => { setName(e.target.value); if (!edited) setSlug(slugify(e.target.value)); }} />
        <Input label="Endereço (subdomínio)" name="slug" value={slug} required onChange={(e) => { setEdited(true); setSlug(e.target.value.toLowerCase()); }} />
        <Input label="Cidade da escola" name="city" required />
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Estado da escola
          <select name="state" required defaultValue="" className={select}>
            <option value="" disabled>UF</option>
            {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf} · {UFS[uf]}</option>)}
          </select>
        </label>
        <Input label={type === "ESCOLA" ? "Nome da coordenação" : "Nome do(a) professor(a)"} name="adminName" required />
        <Input label="Email da pessoa responsável" name="adminEmail" type="email" required />
        <div className="flex gap-2 sm:col-span-2">
          <Button disabled={pending}>{pending ? "Criando..." : "Criar conta"}</Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
        </div>
        {state?.error && <div className="sm:col-span-2"><Alert>{state.error}</Alert></div>}
      </form>
      <Credentials state={state} />
    </div>
  );
}

export function AddStaffForm({ orgId, isSchool }: { orgId: string; isSchool: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addStaffAction.bind(null, orgId), undefined);
  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Papel
          <select name="role" defaultValue="TEACHER" className={select}>
            <option value="TEACHER">Professor(a)</option>
            {isSchool && <option value="ORG_ADMIN">Coordenação</option>}
          </select>
        </label>
        <div className="min-w-48 flex-1"><Input label="Nome" name="name" required /></div>
        <div className="min-w-56 flex-1"><Input label="Email" name="email" type="email" required /></div>
        <Button size="sm" disabled={pending}>{pending ? "Criando..." : "Adicionar pessoa"}</Button>
      </form>
      {state?.error && <Alert>{state.error}</Alert>}
      <Credentials state={state} />
    </div>
  );
}

export function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState<FormState>(resetPasswordAction.bind(null, userId), undefined);
  if (state?.password) return <Credentials state={state} />;
  return (
    <form action={action} className="inline">
      <button className="btn btn-secondary btn-sm" disabled={pending} aria-label={`Nova senha para ${name}`} title="Voltar para a senha padrão">
        <KeyRound aria-hidden className="h-4 w-4" /> {pending ? "..." : "Nova senha"}
      </button>
      {state?.error && <span className="ml-2 text-xs font-bold text-red-700">{state.error}</span>}
    </form>
  );
}
