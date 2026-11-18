"use client";

import { Download } from "lucide-react";
import { useCallback, useRef } from "react";
import { ScratchFrame, type ScratchFrameHandle } from "@/components/editor/scratch-frame";
import { emptyProject } from "@/lib/blocks/project";
import { buildSb3 } from "@/lib/sb3/pack";

/** Editor livre: todos os blocos, sem missão nem verificação. Nada é salvo no servidor; o projeto pode ser baixado. */
export function FreeEditor() {
  const editor = useRef<ScratchFrameHandle | null>(null);
  const initial = useCallback(async () => buildSb3(emptyProject()), []);

  async function download() {
    const sb3 = await editor.current?.getSb3().catch(() => null);
    if (!sb3) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([sb3], { type: "application/x.scratch.sb3" }));
    a.download = "meu-projeto.sb3";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <span className="text-sm font-bold text-muted">Nada é salvo aqui. Baixe o projeto para guardar.</span>
        <button onClick={download} className="btn btn-primary btn-md">
          <Download aria-hidden className="h-5 w-5" /> Baixar projeto (.sb3)
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <ScratchFrame handle={editor} initial={initial} allowedBlocks={[]} />
      </div>
    </div>
  );
}
