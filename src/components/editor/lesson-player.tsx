"use client";

import { ArrowRight, BookOpen, CircleCheck, CircleX, Lightbulb, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Stars } from "@/components/lesson-icon";
import { buttonClass } from "@/components/ui";
import { BLOCKS } from "@/lib/blocks/catalog";
import { normalizeProject, type ProjectState } from "@/lib/blocks/project";
import type { CheckItem } from "@/lib/checker";
import { ConvertError } from "@/lib/sb3/convert";
import { buildSb3, clearDraft, deleteSavedProject, fetchSavedProject, projectFromSb3, readDraft, uploadProject, writeDraft } from "@/lib/sb3/pack";
import { BlockPreview } from "./block-preview";
import { ScratchFrame, type ScratchFrameHandle } from "./scratch-frame";

export type VerifyOutcome =
  | { ok: true; passed: boolean; stars: number; summary: string; items: CheckItem[]; xpGained: number; newBadges?: { id: string; name: string; icon: string }[] }
  | { ok: false; error: string };

type Props = {
  lessonId: string;
  allowedBlocks: string[];
  starter: unknown;
  saved: unknown;
  nextHref: string | null;
  /** Recebe o projeto (nosso formato) como JSON (texto). */
  verify: (projectJson: string) => Promise<VerifyOutcome>;
  /** Barra do topo (mundo, lição, título) e a missão/instruções, mostradas na coluna da esquerda. */
  header?: ReactNode;
  mission?: ReactNode;
  extra?: ReactNode;
};

/**
 * No editor, rodar o programa move os atores e o projeto guarda onde eles pararam. A verificação
 * começa sempre como a lição começa: atores que já existem no projeto inicial voltam ao lugar dele.
 */
export function withStarterPlacement(project: ProjectState, starter: ProjectState): ProjectState {
  const byName = new Map(starter.sprites.map((s) => [s.name, s]));
  return {
    ...project,
    sprites: project.sprites.map((s) => {
      const st = byName.get(s.name);
      return st ? { ...s, x: st.x, y: st.y, direction: st.direction, size: st.size, visible: st.visible } : s;
    }),
  };
}

/** Rascunho do editor antigo (projeto em JSON no localStorage), para ninguém perder o que fez. */
function legacyDraft(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function LessonPlayer({ lessonId, allowedBlocks, starter, saved, nextHref, verify, header, mission, extra }: Props) {
  const draftKey = `blocos:licao:${lessonId}`;
  const editor = useRef<ScratchFrameHandle | null>(null);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const starterSb3 = useCallback(() => buildSb3(normalizeProject(starter)), [starter]);

  // o mais novo entre o rascunho deste computador e o projeto guardado no servidor (ambos com fantasias e sons);
  // senão, o rascunho do editor antigo, os blocos da última tentativa ou o projeto inicial
  const initial = useCallback(async () => {
    const [local, server] = await Promise.all([readDraft(draftKey), fetchSavedProject(lessonId)]);
    const newest = [local, server].filter((d) => !!d).sort((a, b) => b!.at - a!.at)[0];
    return newest?.sb3 ?? buildSb3(normalizeProject(legacyDraft(draftKey) ?? saved ?? starter));
  }, [draftKey, lessonId, saved, starter]);

  // rascunho local a cada mudança; no servidor, no máximo a cada 30 s (e sempre ao verificar)
  const lastUpload = useRef(0);
  const saveDraft = useCallback(async () => {
    const sb3 = await editor.current?.getSb3().catch(() => null);
    if (!sb3) return;
    await writeDraft(draftKey, sb3.slice(0));
    if (Date.now() - lastUpload.current > 30_000) {
      lastUpload.current = Date.now();
      void uploadProject(lessonId, sb3);
    }
  }, [draftKey, lessonId]);

  const onVerify = () => {
    startTransition(async () => {
      try {
        const sb3 = await editor.current!.getSb3();
        await writeDraft(draftKey, sb3.slice(0));
        lastUpload.current = Date.now();
        void uploadProject(lessonId, sb3.slice(0));
        const project = withStarterPlacement(await projectFromSb3(sb3), normalizeProject(starter));
        setOutcome(await verify(JSON.stringify(project)));
      } catch (e) {
        setOutcome({ ok: false, error: e instanceof ConvertError ? e.message : "Não foi possível verificar agora. Tente de novo." });
      }
      setResultOpen(true);
    });
  };

  const restart = async () => {
    if (!confirm("Apagar seus blocos e começar de novo?")) return;
    await Promise.all([clearDraft(draftKey), deleteSavedProject(lessonId)]);
    try {
      localStorage.removeItem(draftKey); // rascunho do editor antigo
    } catch {
      /* sem armazenamento local */
    }
    editor.current?.load(await starterSb3());
    setOutcome(null);
  };

  const allowed = useMemo(() => (allowedBlocks.length ? BLOCKS.filter((b) => allowedBlocks.includes(b.opcode)) : BLOCKS), [allowedBlocks]);

  // Ocupa exatamente a janela abaixo do menu do site: o aluno nunca precisa rolar a página.
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    const update = () => setTop(header ? header.getBoundingClientRect().bottom : 0);
    update();
    const ro = new ResizeObserver(update);
    if (header) ro.observe(header);
    window.addEventListener("resize", update);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      html.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col border-t-2 border-line bg-background" style={{ top }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-line bg-surface px-4 py-2">
        <div className="min-w-0 flex-1">{header}</div>
        <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-muted hover:text-foreground">
          <RotateCcw aria-hidden className="h-4 w-4" /> Recomeçar
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen(!helpOpen)}
          aria-expanded={helpOpen}
          aria-controls="ajuda-blocos"
          className={`inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 font-extrabold shadow-[0_3px_0_rgb(0_0_0/0.3)] ${helpOpen ? "bg-brand text-brand-text" : "bg-star text-night"}`}
        >
          <BookOpen aria-hidden className="h-4 w-4" /> Como funciona cada bloco
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_clamp(280px,22vw,380px)] lg:grid-rows-1">
        {/* Editor de blocos (esquerda) */}
        <div className="relative min-h-0">
          <ScratchFrame handle={editor} initial={initial} allowedBlocks={allowedBlocks} onChange={saveDraft} />
          {helpOpen && (
            <aside
              id="ajuda-blocos"
              aria-label="Como funciona cada bloco"
              className="absolute inset-y-0 right-0 z-20 flex w-[min(22rem,90%)] flex-col border-l-2 border-line bg-surface shadow-[-8px_0_24px_rgb(15_23_42/0.12)]"
            >
              <div className="flex items-center justify-between border-b-2 border-line px-4 py-2">
                <h3 className="flex items-center gap-2 font-extrabold"><BookOpen aria-hidden className="h-5 w-5 text-brand" /> Como funciona cada bloco</h3>
                <button type="button" onClick={() => setHelpOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-black/5" aria-label="Fechar ajuda dos blocos">
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </div>
              <ul className="flex-1 space-y-3 overflow-y-auto p-4 text-base">
                {allowed.map((b) => (
                  <li key={b.opcode} className="flex flex-col gap-1">
                    <BlockPreview def={b} />
                    <span className="font-semibold text-muted">{b.help}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        {/* Coluna da direita: missão, desafio extra e Verificar */}
        <aside className="max-h-[40dvh] space-y-3 overflow-y-auto border-t-2 border-line p-3 lg:max-h-none lg:border-l-2 lg:border-t-0" aria-label="Missão">
          {mission && <div className="clay p-4 text-[0.95rem]">{mission}</div>}
          {extra}
          <button onClick={onVerify} disabled={pending} className={buttonClass("primary", "md", "w-full text-lg")}>
            <CircleCheck aria-hidden className="h-5 w-5" /> {pending ? "Verificando…" : "Verificar"}
          </button>
          {outcome?.ok && outcome.passed && nextHref && !resultOpen && (
            <Link href={nextHref} className={buttonClass("primary", "md", "btn-cta w-full text-lg")}>Próxima lição <ArrowRight aria-hidden className="h-5 w-5" /></Link>
          )}
          {outcome && !resultOpen && (
            <button type="button" onClick={() => setResultOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-2 text-left font-extrabold hover:border-[#8b6cff]">
              {outcome.ok ? <Stars value={outcome.stars} /> : <CircleX aria-hidden className="h-5 w-5 text-red-600" />}
              <span className="flex-1 truncate">{outcome.ok ? outcome.summary : outcome.error}</span>
              <span className="text-sm text-star">Ver resultado</span>
            </button>
          )}
          {/* o editor é um fork GPL-3.0 do TurboWarp: o código-fonte fica público */}
          <p className="pt-2 text-center text-xs font-semibold text-muted">
            Editor baseado no TurboWarp ·{" "}
            <a href="https://github.com/mguedessantos/blocos-editor" target="_blank" rel="noreferrer" className="underline hover:text-foreground">código-fonte (GPL)</a>
          </p>
        </aside>
      </div>
      {outcome && resultOpen && <ResultDialog outcome={outcome} nextHref={nextHref} onClose={() => setResultOpen(false)} />}
    </div>
  );
}

export function Result({ outcome, nextHref }: { outcome: VerifyOutcome; nextHref: string | null }) {
  if (!outcome.ok) return <p role="alert" className="rounded-2xl border-2 border-[#ff6b6b] bg-surface px-4 py-3 text-sm font-bold">{outcome.error}</p>;
  return (
    <div role="status" aria-label="Resultado da verificação" className={`space-y-3 rounded-3xl border-2 bg-surface p-5 ${outcome.passed ? "border-star" : "border-[#8b6cff]"}`}>
      <div className="flex items-center justify-between gap-3">
        <Stars value={outcome.stars} size="lg" />
        {outcome.xpGained > 0 && <span className="rounded-full bg-star px-3 py-1 font-display font-extrabold text-night">+{outcome.xpGained} XP!</span>}
      </div>
      <p className="font-display text-xl font-extrabold">{outcome.summary}</p>
      {outcome.newBadges?.map((b) => (
        <p key={b.id} className="flex items-center gap-3 rounded-2xl border-2 border-star px-4 py-2 font-extrabold">
          <span aria-hidden className="text-3xl">{b.icon}</span> Nova medalha: {b.name}!
        </p>
      ))}
      <ul className="space-y-1.5 text-sm font-semibold">
        {outcome.items.map((i, k) => {
          const Icon = i.ok ? CircleCheck : i.bonus ? Lightbulb : CircleX;
          return (
            <li key={k} className="flex items-start gap-2">
              <Icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${i.ok ? "text-go" : i.bonus ? "text-star" : "text-[#ff6b6b]"}`} />
              <span>{i.message}</span>
            </li>
          );
        })}
      </ul>
      {outcome.passed && nextHref && (
        <Link href={nextHref} className={buttonClass("primary", "md", "btn-cta w-full text-lg")}>Próxima lição <ArrowRight aria-hidden className="h-5 w-5" /></Link>
      )}
    </div>
  );
}

/** Resultado numa janela central: estrelas e "Próxima lição" sempre à vista, sem empurrar o editor. */
function ResultDialog({ outcome, nextHref, onClose }: { outcome: VerifyOutcome; nextHref: string | null; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#05041a]/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resultado"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-3xl border-2 border-line bg-[#120f35] p-3 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
      >
        <div className="min-h-0 overflow-y-auto">
          <Result outcome={outcome} nextHref={nextHref} />
        </div>
        <button type="button" onClick={onClose} className={buttonClass("secondary")} autoFocus={!(outcome.ok && outcome.passed && nextHref)}>
          {outcome.ok && outcome.passed ? "Ficar nesta lição" : "Voltar aos blocos"}
        </button>
      </div>
    </div>
  );
}
