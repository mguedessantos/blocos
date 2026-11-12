"use client";

import { Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { JamPhase } from "@/lib/jams";

const PHASE_STYLE: Record<JamPhase, string> = {
  RASCUNHO: "bg-black/5 text-muted",
  EM_BREVE: "bg-sky-100 text-sky-900",
  EM_ANDAMENTO: "bg-green-100 text-green-900",
  JULGAMENTO: "bg-amber-100 text-amber-900",
  ENCERRADA: "bg-violet-100 text-violet-900",
};

const LABEL: Record<JamPhase, string> = {
  RASCUNHO: "Rascunho",
  EM_BREVE: "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento",
  JULGAMENTO: "Em julgamento",
  ENCERRADA: "Encerrada",
};

export function PhaseBadge({ phase }: { phase: JamPhase }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${PHASE_STYLE[phase]}`}>{LABEL[phase]}</span>;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * Contagem regressiva. É só visual: quem decide se a entrega é aceita é o servidor.
 * Ao chegar a zero, recarrega os dados da página para mudar de fase.
 */
export function Countdown({ to, label, size = "md" }: { to: string; label: string; size?: "md" | "lg" }) {
  const router = useRouter();
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now === null ? null : target - now;
  useEffect(() => {
    if (left !== null && left <= 0 && left > -2000) router.refresh();
  }, [left, router]);

  const p = parts(left ?? 0);
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="off">
      <span className={`inline-flex items-center gap-1 font-bold text-muted ${big ? "text-base" : "text-sm"}`}>
        <Timer aria-hidden className="h-4 w-4" /> {label}
      </span>
      {left === null ? (
        <span className="font-display font-extrabold">…</span>
      ) : (
        <span className={`flex gap-1.5 font-display font-extrabold tabular-nums ${big ? "text-3xl" : "text-lg"}`} aria-label={`${p.d} dias, ${p.h} horas, ${p.m} minutos`}>
          {p.d > 0 && <Unit v={p.d} u="d" big={big} />}
          <Unit v={p.h} u="h" big={big} />
          <Unit v={p.m} u="min" big={big} />
          <Unit v={p.s} u="s" big={big} />
        </span>
      )}
    </div>
  );
}

function Unit({ v, u, big }: { v: number; u: string; big: boolean }) {
  return (
    <span className={`rounded-xl bg-white ring-2 ring-line ${big ? "px-3 py-1" : "px-2"}`}>
      {String(v).padStart(2, "0")}
      <span className="ml-0.5 text-xs font-bold text-muted">{u}</span>
    </span>
  );
}
