"use client";

import { Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScratchFrame, type ScratchFrameHandle } from "@/components/editor/scratch-frame";
import { emptyProject } from "@/lib/blocks/project";
import { buildSb3 } from "@/lib/sb3/pack";

/** Estúdio da equipe: editor completo (todos os blocos), salvo para a equipe a cada pouco e no botão. */
export function Studio({ teamId }: { teamId: string }) {
  const editor = useRef<ScratchFrameHandle | null>(null);
  const [status, setStatus] = useState<string>("");
  const dirty = useRef(false);
  const url = `/api/jams/equipes/${teamId}/estudio`;

  const initial = useCallback(async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 200) return res.arrayBuffer();
    return buildSb3(emptyProject());
  }, [url]);

  const save = useCallback(async () => {
    const sb3 = await editor.current?.getSb3().catch(() => null);
    if (!sb3) return;
    setStatus("Salvando…");
    const res = await fetch(url, { method: "PUT", body: sb3, headers: { "Content-Type": "application/octet-stream" } }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok) {
      dirty.current = false;
      setStatus(`Salvo às ${new Date(body.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
    } else setStatus(body?.error ?? "Não foi possível salvar. Tente de novo.");
  }, [url]);

  // salva sozinho a cada 30 s quando houve mudança
  useEffect(() => {
    const t = setInterval(() => dirty.current && void save(), 30_000);
    return () => clearInterval(t);
  }, [save]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <span role="status" className="text-sm font-bold text-muted">{status}</span>
        <button onClick={save} className="btn btn-primary btn-md">
          <Save aria-hidden className="h-5 w-5" /> Salvar o jogo da equipe
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <ScratchFrame handle={editor} initial={initial} allowedBlocks={[]} onChange={() => { dirty.current = true; }} />
      </div>
    </div>
  );
}
