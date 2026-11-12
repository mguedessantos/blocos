"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { createClassAction } from "./actions";

export function NewClassForm({ teachers, currentUserId }: { teachers: { id: string; name: string }[] | null; currentUserId: string }) {
  const [state, action, pending] = useActionState(createClassAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <Input label="Nome da nova turma" name="name" placeholder="Ex.: 5º ano B" required />
      </div>
      {teachers && (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Professor(a)
          <select name="teacherId" defaultValue={currentUserId} className="rounded-xl border-2 border-black/10 bg-white px-3 py-3 font-normal">
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}
      <Button disabled={pending}>{pending ? "Criando..." : "+ Criar turma"}</Button>
      {state?.error && <div className="w-full"><Alert>{state.error}</Alert></div>}
    </form>
  );
}
