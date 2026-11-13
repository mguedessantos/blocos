"use client";

import { Gamepad2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ScratchFrame, type ScratchFrameHandle } from "./scratch-frame";

/** Joga um .sb3 dentro da página (palco + bandeira verde), sem precisar baixar e abrir no PictoBlox. */
export function GamePlayer({ src, title }: { src: string; title: string }) {
  const handle = useRef<ScratchFrameHandle | null>(null);
  const [open, setOpen] = useState(false);
  const initial = useCallback(async () => {
    const res = await fetch(src);
    if (!res.ok) throw new Error("Não foi possível abrir o jogo.");
    return res.arrayBuffer();
  }, [src]);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary btn-md w-full">
        <Gamepad2 aria-hidden className="h-5 w-5" /> Jogar aqui: {title}
      </button>
    );
  }
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-line bg-black">
      <ScratchFrame handle={handle} initial={initial} allowedBlocks={[]} player />
    </div>
  );
}
