"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { createTeamAction, type JamFormState } from "../actions";

type Candidate = { id: string; name: string; username: string | null; classes: string; busy: boolean; lastYear: number | null };
type Category = { id: string; name: string; minYear: number; maxYear: number };

const YEARS = [2, 3, 4, 5, 6, 7, 8, 9];

export function CreateTeamForm({ jamId, slug, maxTeamSize, candidates, categories }: { jamId: string; slug: string; maxTeamSize: number; candidates: Candidate[]; categories: Category[] }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(createTeamAction.bind(null, jamId, slug), undefined);
  const [picked, setPicked] = useState<Record<string, number | "">>({});
  const ids = Object.keys(picked);
  const years = Object.values(picked);
  const complete = years.length > 0 && years.every((y) => y !== "");
  const fit = complete ? categories.find((c) => (years as number[]).every((y) => y >= c.minYear && y <= c.maxYear)) : undefined;

  function toggle(c: Candidate, on: boolean) {
    const next = { ...picked };
    if (on) next[c.id] = c.lastYear ?? "";
    else delete next[c.id];
    setPicked(next);
  }

  return (
    <details className="rounded-2xl border-2 border-dashed border-line p-4">
      <summary className="cursor-pointer font-extrabold">+ Inscrever nova equipe</summary>
      <form action={action} className="mt-3 space-y-3">
        <Input label="Nome da equipe" name="name" required maxLength={40} hint="Evite o nome da escola: os jurados não podem saber de onde a equipe vem." />
        <fieldset>
          <legend className="mb-1 text-sm font-bold">Alunos ({ids.length}/{maxTeamSize}) e ano escolar de cada um</legend>
          <div className="grid max-h-72 gap-1 overflow-y-auto text-sm sm:grid-cols-2">
            {candidates.map((c) => {
              const checked = c.id in picked;
              return (
                <div key={c.id} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${c.busy ? "text-muted" : "hover:bg-black/5"}`}>
                  <label className="flex flex-1 items-center gap-2">
                    <input type="checkbox" disabled={c.busy || (!checked && ids.length >= maxTeamSize)} checked={checked} onChange={(e) => toggle(c, e.target.checked)} />
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-xs text-muted">{c.busy ? "já tem equipe" : c.classes}</span>
                  </label>
                  {checked && (
                    <>
                      <input type="hidden" name="students" value={c.id} />
                      <select
                        name={`year_${c.id}`}
                        required
                        value={picked[c.id]}
                        onChange={(e) => setPicked({ ...picked, [c.id]: e.target.value ? Number(e.target.value) : "" })}
                        aria-label={`Ano escolar de ${c.name}`}
                        className="min-h-9 rounded-lg border-2 border-line bg-white px-1 text-sm font-bold"
                      >
                        <option value="">Ano</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}º ano</option>)}
                      </select>
                    </>
                  )}
                </div>
              );
            })}
            {candidates.length === 0 && <p className="text-muted">Nenhum aluno nas suas turmas.</p>}
          </div>
        </fieldset>
        {complete && (
          <p role="status" className={`rounded-xl px-3 py-2 text-sm font-bold ${fit ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}>
            {fit ? `Categoria da equipe: ${fit.name}` : `Esses anos não cabem numa mesma categoria (${categories.map((c) => c.name).join(" · ")}). Monte a equipe com alunos da mesma faixa.`}
          </p>
        )}
        {state?.error && <Alert>{state.error}</Alert>}
        <Button disabled={pending || !fit}>{pending ? "Inscrevendo..." : "Inscrever equipe"}</Button>
      </form>
    </details>
  );
}
