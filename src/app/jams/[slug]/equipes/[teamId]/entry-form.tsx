"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { submitEntryAction, type JamFormState } from "../../../actions";

const file = "block w-full rounded-2xl border-2 border-dashed border-line bg-surface text-foreground px-4 py-3 text-sm font-semibold file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-extrabold";

export function EntryForm({ teamId, hasEntry, maxDescription, initial }: { teamId: string; hasEntry: boolean; maxDescription: number; initial: { title: string; description: string; youtubeUrl: string } | null }) {
  const [state, action, pending] = useActionState<JamFormState, FormData>(submitEntryAction.bind(null, teamId), undefined);
  const [desc, setDesc] = useState(initial?.description ?? "");

  return (
    <form action={action} className="space-y-4">
      <Input label="Nome do jogo" name="title" required maxLength={60} defaultValue={initial?.title} />
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Descrição breve
        <textarea
          name="description" required rows={4} maxLength={maxDescription} value={desc} onChange={(e) => setDesc(e.target.value)}
          className="rounded-2xl border-2 border-line bg-surface text-foreground px-4 py-3 text-base font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <span className="text-xs font-semibold text-muted">{desc.length}/{maxDescription} · Conte do que se trata o jogo e como se joga.</span>
      </label>
      <Input label="Link do vídeo no YouTube" name="youtubeUrl" type="url" required defaultValue={initial?.youtubeUrl} placeholder="https://youtu.be/..." hint="Grave o jogo funcionando. Pode publicar como “não listado”, num canal que não tenha o nome da escola." />
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Projeto (.sb3 do PictoBlox ou Scratch){hasEntry && <span className="font-semibold text-muted"> — deixe vazio para manter o atual</span>}
        <input type="file" name="project" accept=".sb3" required={!hasEntry} className={file} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Documentação com as etapas de desenvolvimento (PDF ou Word){hasEntry && <span className="font-semibold text-muted"> — deixe vazio para manter a atual</span>}
        <input type="file" name="doc" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required={!hasEntry} className={file} />
      </label>
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
        Antes de enviar: confira que o nome da escola, da cidade e dos alunos não aparece no jogo nem na documentação. Nós apagamos os dados de autor dos arquivos automaticamente.
      </p>
      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <p role="status" className="font-bold text-green-700">{state.ok}</p>}
      {state?.leaks && state.leaks.length > 0 && (
        <p role="alert" className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          Atenção: encontramos {state.leaks.map((l) => `“${l}”`).join(", ")} no jogo, na descrição ou na documentação. Isso pode revelar quem vocês são aos jurados — troque e envie de novo.
        </p>
      )}
      <Button disabled={pending}>{pending ? "Enviando..." : hasEntry ? "Atualizar entrega" : "Enviar entrega"}</Button>
    </form>
  );
}
