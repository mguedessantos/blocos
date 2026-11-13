"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

// O editor de blocos (fork GPL do TurboWarp, em /editor) roda num iframe e conversa só por mensagens.
// Protocolo: blocos-editor/src/lib/blocos-bridge.js.

export type ScratchFrameHandle = {
  /** O projeto atual do aluno, como arquivo .sb3. */
  getSb3: () => Promise<ArrayBuffer>;
  /** Troca o projeto aberto (ex.: "Recomeçar"). */
  load: (sb3: ArrayBuffer) => void;
};

type Msg = { type: string; id?: number; sb3?: ArrayBuffer; message?: string };

export function ScratchFrame({ handle, initial, allowedBlocks, onChange, onError }: {
  handle: Ref<ScratchFrameHandle>;
  /** .sb3 inicial (só é lido uma vez). */
  initial: () => Promise<ArrayBuffer>;
  allowedBlocks: string[];
  onChange?: () => void;
  onError?: (message: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<"carregando" | "pronto" | "erro">("carregando");
  const pending = useRef(new Map<number, (sb3: ArrayBuffer) => void>());
  const seq = useRef(0);
  const started = useRef(false);
  // as funções mudam a cada render; o ouvinte de mensagens usa sempre a mais nova
  const latest = useRef({ initial, allowedBlocks, onChange, onError });
  useEffect(() => {
    latest.current = { initial, allowedBlocks, onChange, onError };
  });

  const post = useCallback((msg: object, transfer?: Transferable[]) => frame.current?.contentWindow?.postMessage(msg, location.origin, transfer ?? []), []);
  const load = useCallback((sb3: ArrayBuffer) => {
    setState("carregando");
    post({ type: "load", sb3, allowedBlocks: latest.current.allowedBlocks }, [sb3]);
  }, [post]);

  useImperativeHandle(handle, () => ({
    load,
    getSb3: () =>
      new Promise<ArrayBuffer>((resolve, reject) => {
        const id = ++seq.current;
        pending.current.set(id, resolve);
        post({ type: "getProject", id });
        setTimeout(() => pending.current.delete(id) && reject(new Error("O editor não respondeu.")), 15000);
      }),
  }), [load, post]);

  useEffect(() => {
    const onMessage = async (e: MessageEvent<Msg>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || !e.data || typeof e.data !== "object") return;
      const msg = e.data;
      if (msg.type === "ready") {
        if (started.current) return;
        started.current = true;
        try {
          load(await latest.current.initial());
        } catch {
          setState("erro");
        }
      } else if (msg.type === "loaded") setState("pronto");
      else if (msg.type === "changed") latest.current.onChange?.();
      else if (msg.type === "project" && msg.id && msg.sb3) {
        pending.current.get(msg.id)?.(msg.sb3);
        pending.current.delete(msg.id);
      } else if (msg.type === "error") {
        setState((s) => (s === "pronto" ? s : "erro"));
        latest.current.onError?.(msg.message ?? "Erro no editor.");
      }
    };
    window.addEventListener("message", onMessage);
    // se o editor já carregou antes de começarmos a ouvir, ele responde ao "hello" com outro "ready"
    post({ type: "hello" });
    return () => window.removeEventListener("message", onMessage);
  }, [load, post]);

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={frame}
        src="/editor/index.html?locale=pt-br"
        title="Editor de blocos"
        className={`h-full w-full border-0 transition-opacity ${state === "pronto" ? "opacity-100" : "opacity-0"}`}
        allow="autoplay"
        onLoad={() => frame.current?.contentWindow?.postMessage({ type: "hello" }, location.origin)}
      />
      {state !== "pronto" && (
        <div className="absolute inset-0 grid place-items-center font-bold text-muted" role="status">
          {state === "erro" ? "Não foi possível abrir o editor. Recarregue a página." : "Abrindo o editor de blocos…"}
        </div>
      )}
    </div>
  );
}
