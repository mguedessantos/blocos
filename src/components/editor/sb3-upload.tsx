"use client";

import { FileUp, Rocket, Save } from "lucide-react";
import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui";
import { Result, type VerifyOutcome } from "./lesson-player";

const MAX_MB = 25;

/** Envio de um projeto .sb3 do PictoBlox para verificação automática. */
export function Sb3Upload({ lessonId, nextHref }: { lessonId: string; nextHref: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  const pick = (f: File | undefined) => {
    setOutcome(null);
    if (!f) return;
    if (!/\.sb3$/i.test(f.name)) return setOutcome({ ok: false, error: "Escolha um arquivo que termine em .sb3." });
    if (f.size > MAX_MB * 1024 * 1024) return setOutcome({ ok: false, error: `O arquivo é grande demais (máximo ${MAX_MB} MB).` });
    setFile(f);
  };

  const send = async () => {
    if (!file) return;
    setPending(true);
    setOutcome(null);
    try {
      const body = new FormData();
      body.append("arquivo", file);
      const res = await fetch(`/api/licoes/${lessonId}/sb3`, { method: "POST", body });
      setOutcome((await res.json()) as VerifyOutcome);
    } catch {
      setOutcome({ ok: false, error: "Não foi possível enviar agora. Confira a internet e tente de novo." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="clay space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-xl font-extrabold">
          <Rocket aria-hidden className="h-6 w-6 text-brand" /> Missão no PictoBlox
        </h2>
        <ol className="space-y-3 font-semibold">
          <li className="flex gap-3"><Step n={1} /> Abra o <strong>PictoBlox</strong> no modo <strong>Blocos</strong> e faça a missão.</li>
          <li className="flex gap-3"><Step n={2} /> Teste clicando na bandeira verde 🏁.</li>
          <li className="flex gap-3">
            <Step n={3} />
            <span>Salve: <strong>Arquivo → Salvar no seu computador</strong>. Vai aparecer um arquivo <strong>.sb3</strong>.</span>
          </li>
          <li className="flex gap-3"><Step n={4} /> Envie o arquivo aqui ao lado e clique em <strong>Verificar</strong>.</li>
        </ol>
        <p className="flex items-start gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand-shadow">
          <Save aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Mudou alguma coisa? Salve de novo antes de enviar. Senão, vai o arquivo antigo!
        </p>
      </div>

      <div className="space-y-4">
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
          className={`clay flex cursor-pointer flex-col items-center gap-3 border-dashed p-8 text-center transition-colors ${dragging ? "!border-brand bg-brand-soft" : ""}`}
        >
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand text-brand-text shadow-[0_5px_0_var(--brand-shadow)]" aria-hidden>
            <FileUp className="h-8 w-8" />
          </span>
          <span className="font-display text-lg font-extrabold">{file ? file.name : "Arraste o arquivo .sb3 aqui"}</span>
          <span className="text-sm font-semibold text-muted">{file ? `${(file.size / 1024).toFixed(0)} KB · clique para trocar` : "ou clique para escolher"}</span>
          <input ref={input} type="file" accept=".sb3" className="sr-only" aria-label="Arquivo .sb3 do projeto" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <button onClick={send} disabled={!file || pending} className={buttonClass("primary", "md", "w-full text-lg")}>
          {pending ? "Verificando…" : "Verificar projeto"}
        </button>
        {outcome && <Result outcome={outcome} nextHref={nextHref} />}
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-brand-text" aria-hidden>{n}</span>;
}
