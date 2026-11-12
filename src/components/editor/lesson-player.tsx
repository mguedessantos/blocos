"use client";

import dynamic from "next/dynamic";
import { ArrowRight, CircleCheck, CircleX, Flag, Lightbulb, Puzzle, RotateCcw, Square } from "lucide-react";
import Link from "next/link";
import { Stars } from "@/components/lesson-icon";
import { buttonClass } from "@/components/ui";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BLOCKS, CATEGORIES } from "@/lib/blocks/catalog";
import { FPS, initialState, Runtime, type StageState } from "@/lib/blocks/interpreter";
import { programFromBlockly, type BlocklyState } from "@/lib/blocks/program";
import type { CheckItem } from "@/lib/checker";
import type { BlockEditorHandle } from "./block-editor";
import { Stage } from "./stage";

const BlockEditor = dynamic(() => import("./block-editor"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[420px] place-items-center font-bold text-muted">Carregando blocos…</div>,
});

export type VerifyOutcome =
  | { ok: true; passed: boolean; stars: number; summary: string; items: CheckItem[]; xpGained: number }
  | { ok: false; error: string };

type Props = {
  lessonId: string;
  allowedBlocks: string[];
  starterState: BlocklyState | null;
  savedState: BlocklyState | null;
  nextHref: string | null;
  /** Recebe o estado do editor como JSON (texto). */
  verify: (workspaceJson: string) => Promise<VerifyOutcome>;
};

const MAX_RUN_SECONDS = 60;
const snapshot = (s: StageState): StageState => ({ ...s, lines: s.lines.slice() });

function readDraft(key: string): BlocklyState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as BlocklyState) : null;
  } catch {
    return null;
  }
}

export function LessonPlayer({ lessonId, allowedBlocks, starterState, savedState, nextHref, verify }: Props) {
  const editor = useRef<BlockEditorHandle>(null);
  const frame = useRef<number | null>(null);
  const [stage, setStage] = useState<StageState>(initialState);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const draftKey = `blocos:licao:${lessonId}`;
  const [initial] = useState(() => (typeof window === "undefined" ? null : readDraft(draftKey)) ?? savedState);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(() => {
    stop();
    const rt = new Runtime(programFromBlockly(editor.current?.getState() ?? {}));
    rt.start();
    setStage(snapshot(rt.state));
    setRunning(true);
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= 1000 / FPS && !rt.done) {
        rt.tick();
        acc -= 1000 / FPS;
      }
      setStage(snapshot(rt.state));
      if (rt.done || rt.state.time >= MAX_RUN_SECONDS) {
        frame.current = null;
        setRunning(false);
        return;
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, [stop]);

  const onVerify = () => {
    const state = editor.current?.getState() ?? {};
    run();
    startTransition(async () => {
      try {
        setOutcome(await verify(JSON.stringify(state)));
      } catch {
        setOutcome({ ok: false, error: "Não foi possível verificar agora. Tente de novo." });
      }
    });
  };

  const saveDraft = (state: BlocklyState) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(state));
    } catch {
      /* sem armazenamento local: tudo bem */
    }
  };

  const restart = () => {
    if (!confirm("Apagar seus blocos e começar de novo?")) return;
    editor.current?.reset();
    stop();
    setStage(initialState());
    setOutcome(null);
  };

  const allowed = allowedBlocks.length ? BLOCKS.filter((b) => allowedBlocks.includes(b.opcode)) : BLOCKS;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="clay blocos-editor flex flex-col overflow-hidden">
        <div className="h-full min-h-[560px]">
          <BlockEditor handle={editor} allowedBlocks={allowedBlocks} initialState={initial} starterState={starterState} onChange={saveDraft} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="clay overflow-hidden p-2">
          <Stage state={stage} />
          <p className="flex justify-between px-2 pt-2 font-mono text-xs font-bold text-muted" aria-hidden>
            <span>x: {Math.round(stage.x)} · y: {Math.round(stage.y)}</span>
            <span>direção: {Math.round(stage.direction)}°</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={run} className={buttonClass("success")}>
            <Flag aria-hidden className="h-5 w-5" /> Executar
          </button>
          <button onClick={stop} disabled={!running} className={buttonClass("danger")}>
            <Square aria-hidden className="h-4 w-4 fill-current" /> Parar
          </button>
          <button onClick={onVerify} disabled={pending} className={buttonClass("primary", "md", "flex-1 sm:flex-none")}>
            <CircleCheck aria-hidden className="h-5 w-5" /> {pending ? "Verificando…" : "Verificar"}
          </button>
          <button onClick={restart} className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-muted hover:text-foreground">
            <RotateCcw aria-hidden className="h-4 w-4" /> Recomeçar
          </button>
        </div>

        {outcome && <Result outcome={outcome} nextHref={nextHref} />}

        <details className="clay group p-4">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 font-extrabold">
            <Puzzle aria-hidden className="h-5 w-5 text-brand" /> Como funciona cada bloco
            <span aria-hidden className="ml-auto text-muted transition-transform group-open:rotate-90">›</span>
          </summary>
          <ul className="mt-3 space-y-2.5 text-sm">
            {allowed.map((b) => (
              <li key={b.opcode} className="flex flex-col gap-1">
                <span
                  className="w-fit rounded-lg px-2.5 py-1 text-xs font-extrabold text-white shadow-[0_2px_0_rgb(15_23_42/0.2)]"
                  style={{ background: CATEGORIES[b.category].colour }}
                >
                  {b.text.split("|")[0].replace(/%\d/g, "▢")}
                </span>
                <span className="font-semibold text-muted">{b.help}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

function Result({ outcome, nextHref }: { outcome: VerifyOutcome; nextHref: string | null }) {
  if (!outcome.ok) return <p role="alert" className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{outcome.error}</p>;
  return (
    <div
      role="status"
      aria-label="Resultado da verificação"
      className={`space-y-3 rounded-3xl border-2 p-5 ${outcome.passed ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Stars value={outcome.stars} size="lg" />
        {outcome.xpGained > 0 && <span className="rounded-full bg-brand-2 px-3 py-1 font-display font-extrabold">+{outcome.xpGained} XP!</span>}
      </div>
      <p className="font-display text-xl font-extrabold">{outcome.summary}</p>
      <ul className="space-y-1.5 text-sm font-semibold">
        {outcome.items.map((i, k) => {
          const Icon = i.ok ? CircleCheck : i.bonus ? Lightbulb : CircleX;
          return (
            <li key={k} className="flex items-start gap-2">
              <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${i.ok ? "text-green-600" : i.bonus ? "text-amber-600" : "text-red-600"}`} />
              <span>{i.message}</span>
            </li>
          );
        })}
      </ul>
      {outcome.passed && nextHref && (
        <Link href={nextHref} className={buttonClass()}>Próxima lição <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      )}
    </div>
  );
}
