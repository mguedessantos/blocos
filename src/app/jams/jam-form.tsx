"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { UF_LIST, UFS } from "@/lib/br";
import { saveJamAction, type JamFormState } from "./actions";

export type JamFormValues = {
  title: string; theme: string; description: string;
  scope: "PLATAFORMA" | "ESTADOS" | "CIDADES" | "ESCOLAS";
  states: string[]; cities: string[]; orgIds: string[];
  startsAt: string; endsAt: string; judgingEndsAt: string; // "AAAA-MM-DDTHH:MM" (Brasília)
  maxTeamSize: number;
  criteria: { name: string; weight: number; maxScore: number }[];
  prizes: { title: string; description: string; recipient: "ESCOLA" | "EQUIPE" }[];
};

const textarea = "rounded-2xl border-2 border-line bg-white px-4 py-3 text-base font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";
const select = "min-h-12 rounded-2xl border-2 border-line bg-white px-3 text-base font-semibold";

const SCOPES = [
  { v: "PLATAFORMA", l: "Todo o Brasil" },
  { v: "ESTADOS", l: "Estados" },
  { v: "CIDADES", l: "Cidades" },
  { v: "ESCOLAS", l: "Escolas convidadas" },
] as const;

export function JamForm({ jamId, initial, schools, criteriaLocked }: { jamId: string | null; initial: JamFormValues; schools: { id: string; name: string; city: string; state: string }[]; criteriaLocked?: boolean }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(saveJamAction.bind(null, jamId), undefined);
  const [scope, setScope] = useState(initial.scope);
  const [criteria, setCriteria] = useState(initial.criteria.map((c, i) => ({ ...c, key: i })));
  const [prizes, setPrizes] = useState(initial.prizes.map((p, i) => ({ ...p, key: i })));

  return (
    <form action={action} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome da jam" name="title" defaultValue={initial.title} required maxLength={80} />
        <Input label="Tema" name="theme" defaultValue={initial.theme} required maxLength={120} hint="Ex.: “Salve o planeta”, “Mundo de cabeça para baixo”" />
        <label className="flex flex-col gap-1.5 text-sm font-bold sm:col-span-2">
          Regras e informações (aceita **negrito**, listas e links)
          <textarea name="description" defaultValue={initial.description} required rows={6} maxLength={10000} className={textarea} />
        </label>
      </section>

      <fieldset className="space-y-3">
        <legend className="text-lg font-extrabold">Datas (horário de Brasília)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Entregas abrem" name="startsAt" type="datetime-local" defaultValue={initial.startsAt} required />
          <Input label="Entregas fecham" name="endsAt" type="datetime-local" defaultValue={initial.endsAt} required />
          <Input label="Resultado (fim do julgamento)" name="judgingEndsAt" type="datetime-local" defaultValue={initial.judgingEndsAt} required />
        </div>
        <p className="text-sm text-muted">Antes da abertura os professores já podem inscrever equipes. A contagem regressiva aparece para todos.</p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-extrabold">Quem pode participar</legend>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <label key={s.v} className={`cursor-pointer rounded-2xl border-2 px-4 py-2 text-sm font-bold ${scope === s.v ? "border-brand bg-brand-soft" : "border-line"}`}>
              <input type="radio" name="scope" value={s.v} checked={scope === s.v} onChange={() => setScope(s.v)} className="sr-only" /> {s.l}
            </label>
          ))}
        </div>
        {scope === "ESTADOS" && (
          <div className="grid grid-cols-3 gap-1 text-sm sm:grid-cols-9">
            {UF_LIST.map((uf) => (
              <label key={uf} className="flex items-center gap-1" title={UFS[uf]}><input type="checkbox" name="states" value={uf} defaultChecked={initial.states.includes(uf)} /> {uf}</label>
            ))}
          </div>
        )}
        {scope === "CIDADES" && <Input label="Cidades (separe por vírgula)" name="cities" defaultValue={initial.cities.join(", ")} />}
        {scope === "ESCOLAS" && (
          <div className="grid max-h-60 gap-1 overflow-y-auto rounded-2xl border-2 border-line p-3 text-sm sm:grid-cols-2">
            {schools.map((s) => (
              <label key={s.id} className="flex items-center gap-2"><input type="checkbox" name="orgIds" value={s.id} defaultChecked={initial.orgIds.includes(s.id)} /> {s.name} <span className="text-muted">{s.city}/{s.state}</span></label>
            ))}
          </div>
        )}
        <div className="max-w-48"><Input label="Alunos por equipe (máx.)" name="maxTeamSize" type="number" min={1} max={10} defaultValue={initial.maxTeamSize} required /></div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-extrabold">Critérios de avaliação</legend>
        {criteriaLocked && <p className="text-sm font-semibold text-amber-800">Os jurados já começaram a dar notas: os critérios não podem mais mudar.</p>}
        {criteria.map((c, i) => (
          <div key={c.key} className="grid grid-cols-[1fr_6rem_6rem_auto] items-end gap-2">
            <Input label={i === 0 ? "Critério" : ""} aria-label={`Critério ${i + 1}`} name="critName" defaultValue={c.name} disabled={criteriaLocked} />
            <Input label={i === 0 ? "Peso" : ""} aria-label={`Peso ${i + 1}`} name="critWeight" type="number" step="0.1" min={0.1} max={10} defaultValue={c.weight} disabled={criteriaLocked} />
            <Input label={i === 0 ? "Nota máx." : ""} aria-label={`Nota máxima ${i + 1}`} name="critMax" type="number" min={1} max={100} defaultValue={c.maxScore} disabled={criteriaLocked} />
            <button type="button" disabled={criteriaLocked || criteria.length === 1} onClick={() => setCriteria(criteria.filter((x) => x.key !== c.key))} className="btn btn-secondary btn-sm mb-1" aria-label={`Remover critério ${i + 1}`}><Trash2 aria-hidden className="h-4 w-4" /></button>
          </div>
        ))}
        {/* critérios bloqueados não são enviados (disabled); repetimos os valores ocultos */}
        {criteriaLocked && criteria.map((c) => (
          <span key={`h${c.key}`}><input type="hidden" name="critName" value={c.name} /><input type="hidden" name="critWeight" value={c.weight} /><input type="hidden" name="critMax" value={c.maxScore} /></span>
        ))}
        {!criteriaLocked && <Button type="button" variant="secondary" size="sm" onClick={() => setCriteria([...criteria, { name: "", weight: 1, maxScore: 10, key: Date.now() }])}><Plus aria-hidden className="h-4 w-4" /> Critério</Button>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-extrabold">Prêmios</legend>
        <p className="text-sm text-muted">Aparecem na página da jam para divulgar o evento. A ordem define a colocação (1º, 2º, 3º…).</p>
        {prizes.map((p, i) => (
          <div key={p.key} className="grid items-end gap-2 sm:grid-cols-[3rem_1fr_1fr_11rem_auto]">
            <span className="mb-3 font-display text-xl font-extrabold">{i + 1}º</span>
            <Input label="Prêmio" aria-label={`Prêmio do ${i + 1}º lugar`} name="prizeTitle" defaultValue={p.title} />
            <Input label="Detalhes" aria-label={`Detalhes do prêmio ${i + 1}`} name="prizeDescription" defaultValue={p.description} />
            <label className="flex flex-col gap-1.5 text-sm font-bold">
              Para
              <select name="prizeRecipient" defaultValue={p.recipient} className={select} aria-label={`Quem recebe o prêmio ${i + 1}`}>
                <option value="EQUIPE">a equipe (alunos)</option>
                <option value="ESCOLA">a escola</option>
              </select>
            </label>
            <button type="button" onClick={() => setPrizes(prizes.filter((x) => x.key !== p.key))} className="btn btn-secondary btn-sm mb-1" aria-label={`Remover prêmio ${i + 1}`}><Trash2 aria-hidden className="h-4 w-4" /></button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => setPrizes([...prizes, { title: "", description: "", recipient: "EQUIPE", key: Date.now() }])}><Plus aria-hidden className="h-4 w-4" /> Prêmio</Button>
      </fieldset>

      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <p role="status" className="font-bold text-green-700">{state.ok}</p>}
      <Button disabled={pending}>{pending ? "Salvando..." : jamId ? "Salvar alterações" : "Criar jam (como rascunho)"}</Button>
    </form>
  );
}
