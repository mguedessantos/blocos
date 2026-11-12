"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { createTeamAction, type JamFormState } from "../actions";

type Candidate = { id: string; name: string; username: string | null; classes: string; busy: boolean };

export function CreateTeamForm({ jamId, slug, maxTeamSize, candidates }: { jamId: string; slug: string; maxTeamSize: number; candidates: Candidate[] }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(createTeamAction.bind(null, jamId, slug), undefined);
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <details className="rounded-2xl border-2 border-dashed border-line p-4">
      <summary className="cursor-pointer font-extrabold">+ Inscrever nova equipe</summary>
      <form action={action} className="mt-3 space-y-3">
        <Input label="Nome da equipe" name="name" required maxLength={40} hint="Evite o nome da escola: os jurados não podem saber de onde a equipe vem." />
        <fieldset>
          <legend className="mb-1 text-sm font-bold">Alunos ({picked.length}/{maxTeamSize})</legend>
          <div className="grid max-h-64 gap-1 overflow-y-auto text-sm sm:grid-cols-2">
            {candidates.map((c) => {
              const checked = picked.includes(c.id);
              return (
                <label key={c.id} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${c.busy ? "text-muted" : "hover:bg-black/5"}`}>
                  <input
                    type="checkbox"
                    name="students"
                    value={c.id}
                    disabled={c.busy || (!checked && picked.length >= maxTeamSize)}
                    checked={checked}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))}
                  />
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-muted">{c.busy ? "já tem equipe" : c.classes}</span>
                </label>
              );
            })}
            {candidates.length === 0 && <p className="text-muted">Nenhum aluno nas suas turmas.</p>}
          </div>
        </fieldset>
        {state?.error && <Alert>{state.error}</Alert>}
        <Button disabled={pending || picked.length === 0}>{pending ? "Inscrevendo..." : "Inscrever equipe"}</Button>
      </form>
    </details>
  );
}
