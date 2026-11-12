"use client";

import { ArrowRight, BookOpen, CircleCheck, CircleX, Flag, Image as ImageIcon, Lightbulb, Pencil, Plus, Puzzle, RotateCcw, Square, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Stars } from "@/components/lesson-icon";
import { buttonClass } from "@/components/ui";
import { BLOCKS, CATEGORIES } from "@/lib/blocks/catalog";
import { FPS, World, type WorldState } from "@/lib/blocks/interpreter";
import { BACKDROPS, CHARACTERS, type BackdropId, type CharacterId } from "@/lib/blocks/library";
import type { BlocklyState } from "@/lib/blocks/program";
import { compileProject, MAX_SPRITES, newSprite, normalizeProject, type ProjectState } from "@/lib/blocks/project";
import type { CheckItem } from "@/lib/checker";
import { drawBackdrop, drawCharacter, playSound } from "./art";
import type { BlockEditorHandle, EditorContext } from "./block-editor";
import { Stage } from "./stage";

const BlockEditor = dynamic(() => import("./block-editor"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[420px] place-items-center font-bold text-muted">Carregando blocos…</div>,
});

export type VerifyOutcome =
  | { ok: true; passed: boolean; stars: number; summary: string; items: CheckItem[]; xpGained: number; newBadges?: { id: string; name: string; icon: string }[] }
  | { ok: false; error: string };

type Props = {
  lessonId: string;
  allowedBlocks: string[];
  starter: unknown;
  saved: unknown;
  /** Mostra o painel de atores e cenários (lições de jogos). */
  showSprites: boolean;
  nextHref: string | null;
  /** Recebe o projeto como JSON (texto). */
  verify: (projectJson: string) => Promise<VerifyOutcome>;
};

const MAX_RUN_SECONDS = 600;
const STAGE_ID = "__palco__";

const KEY_NAMES: Record<string, string> = { " ": "space", ArrowUp: "up arrow", ArrowDown: "down arrow", ArrowLeft: "left arrow", ArrowRight: "right arrow" };
const toScratchKey = (e: KeyboardEvent) => KEY_NAMES[e.key] ?? (e.key.length === 1 ? e.key.toLowerCase() : null);

function readDraft(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const snapshot = (s: WorldState): WorldState => ({ ...s, targets: s.targets.map((t) => ({ ...t })), lines: s.lines.slice(), vars: { ...s.vars } });

export function LessonPlayer({ lessonId, allowedBlocks, starter, saved, showSprites, nextHref, verify }: Props) {
  const draftKey = `blocos:licao:${lessonId}`;
  const starterProject = useMemo(() => normalizeProject(starter), [starter]);
  const [project, setProject] = useState<ProjectState>(() =>
    normalizeProject((typeof window === "undefined" ? null : readDraft(draftKey)) ?? saved ?? starter),
  );
  const projectRef = useRef(project);
  const [selected, setSelected] = useState<string>(project.sprites[0].id);
  const editor = useRef<BlockEditorHandle>(null);
  const world = useRef<World | null>(null);
  const frame = useRef<number | null>(null);
  const [stage, setStage] = useState<WorldState>(() => new World(compileProject(project)).state);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [picker, setPicker] = useState<"sprite" | "backdrop" | null>(null);
  const dragging = useRef<string | null>(null);

  const commit = useCallback((next: ProjectState, preview = true) => {
    projectRef.current = next;
    setProject(next);
    try {
      localStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      /* sem armazenamento local: tudo bem */
    }
    if (preview && !world.current) setStage(new World(compileProject(next)).state);
  }, [draftKey]);

  const contextFor = useCallback((p: ProjectState, id: string): EditorContext => {
    const sprite = p.sprites.find((s) => s.id === id);
    return {
      sprites: p.sprites.map((s) => s.name),
      self: sprite?.name ?? "",
      costumes: sprite ? CHARACTERS[sprite.character].costumes : [],
      backdrops: p.stage.backdrops.map((b) => [BACKDROPS[b], b]),
      isStage: id === STAGE_ID,
    };
  }, []);

  const workspaceOf = (p: ProjectState, id: string): BlocklyState => {
    const ws = id === STAGE_ID ? p.stage.workspace : p.sprites.find((s) => s.id === id)?.workspace ?? {};
    return { ...ws, variables: p.variables };
  };

  // ───────────── edição ─────────────

  const onBlocksChange = (state: BlocklyState) => {
    const p = projectRef.current;
    const blocks = { blocks: state.blocks };
    const variables = (state.variables ?? p.variables).map((v) => ({ id: v.id, name: v.name }));
    const next: ProjectState =
      selected === STAGE_ID
        ? { ...p, variables, stage: { ...p.stage, workspace: blocks } }
        : { ...p, variables, sprites: p.sprites.map((s) => (s.id === selected ? { ...s, workspace: blocks } : s)) };
    commit(next, false);
  };

  const select = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    editor.current?.load(workspaceOf(projectRef.current, id), contextFor(projectRef.current, id));
  };

  const addSprite = (character: CharacterId) => {
    const p = project;
    if (p.sprites.length >= MAX_SPRITES) return;
    let name = CHARACTERS[character].name;
    for (let k = 2; p.sprites.some((s) => s.name === name); k++) name = `${CHARACTERS[character].name} ${k}`;
    // cada ator novo aparece num lugar diferente (o aluno arrasta para onde quiser)
    const slot = p.sprites.length;
    const s = newSprite(character, name, { x: ((slot * 70) % 320) - 160, y: slot % 2 ? 60 : -60 });
    const next = { ...p, sprites: [...p.sprites, s] };
    commit(next);
    setPicker(null);
    setSelected(s.id);
    editor.current?.load(workspaceOf(next, s.id), contextFor(next, s.id));
  };

  const onPickSprite = (e: React.MouseEvent<HTMLButtonElement>) => addSprite(e.currentTarget.dataset.item as CharacterId);
  const onPickBackdrop = (e: React.MouseEvent<HTMLButtonElement>) => addBackdrop(e.currentTarget.dataset.item as BackdropId);

  const renameSprite = (id: string) => {
    const p = projectRef.current;
    const s = p.sprites.find((x) => x.id === id);
    const name = s && prompt("Novo nome do ator:", s.name)?.trim().slice(0, 30);
    if (!s || !name || p.sprites.some((x) => x.name === name && x.id !== id)) return;
    commit({ ...p, sprites: p.sprites.map((x) => (x.id === id ? { ...x, name } : x)) });
  };

  const removeSprite = (id: string) => {
    const p = projectRef.current;
    if (p.sprites.length <= 1 || !confirm("Apagar este ator e todos os blocos dele?")) return;
    const next = { ...p, sprites: p.sprites.filter((s) => s.id !== id) };
    commit(next);
    const first = next.sprites[0].id;
    setSelected(first);
    editor.current?.load(workspaceOf(next, first), contextFor(next, first));
  };

  const addBackdrop = (id: BackdropId) => {
    const p = project;
    setPicker(null);
    if (p.stage.backdrops.includes(id) || p.stage.backdrops.length >= 10) return;
    commit({ ...p, stage: { ...p.stage, backdrops: [...p.stage.backdrops, id] } });
  };
  const removeBackdrop = (id: BackdropId) => {
    const p = projectRef.current;
    if (p.stage.backdrops.length <= 1) return;
    commit({ ...p, stage: { ...p.stage, backdrops: p.stage.backdrops.filter((b) => b !== id) } });
  };

  // ───────────── execução ─────────────

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    world.current = null;
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(() => {
    stop();
    const w = new World(compileProject(projectRef.current), Date.now() % 100000);
    w.onSound = playSound;
    w.start();
    world.current = w;
    setStage(snapshot(w.state));
    setRunning(true);
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      if (world.current !== w) return;
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= 1000 / FPS && !w.state.stopped) {
        w.tick();
        acc -= 1000 / FPS;
      }
      setStage(snapshot(w.state));
      // jogos com teclado ou clique continuam “vivos” esperando o jogador
      if (w.state.stopped || (w.done && !w.interactive) || w.state.time >= MAX_RUN_SECONDS) {
        frame.current = null;
        world.current = null;
        setRunning(false);
        return;
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, [stop]);

  // teclado durante o jogo
  useEffect(() => {
    if (!running) return;
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const k = toScratchKey(e);
      if (!k || !world.current) return;
      if (k === "space" || k.endsWith("arrow")) e.preventDefault();
      world.current.keyDown(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = toScratchKey(e);
      if (k && world.current) world.current.keyUp(k);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [running]);

  const onMouse = (m: { x: number; y: number; down?: boolean }) => {
    if (world.current) {
      world.current.mouse = { x: m.x, y: m.y, down: m.down ?? world.current.mouse.down };
      return;
    }
    if (!showSprites) return;
    // parado: arrastar atores define a posição inicial
    const p = projectRef.current;
    if (m.down === true) {
      const hit = [...p.sprites].reverse().find((s) => Math.hypot(s.x - m.x, s.y - m.y) <= CHARACTERS[s.character].radius * (s.size / 100) + 6);
      dragging.current = hit?.id ?? null;
      if (hit) select(hit.id);
    } else if (m.down === false) {
      dragging.current = null;
    } else if (dragging.current) {
      const x = Math.max(-240, Math.min(240, m.x)), y = Math.max(-180, Math.min(180, m.y));
      commit({ ...p, sprites: p.sprites.map((s) => (s.id === dragging.current ? { ...s, x, y } : s)) });
    }
  };

  const onVerify = () => {
    const json = JSON.stringify(projectRef.current);
    run();
    startTransition(async () => {
      try {
        setOutcome(await verify(json));
        setResultOpen(true);
      } catch {
        setOutcome({ ok: false, error: "Não foi possível verificar agora. Tente de novo." });
        setResultOpen(true);
      }
    });
  };

  const restart = () => {
    if (!confirm("Apagar seus blocos e começar de novo?")) return;
    stop();
    commit(starterProject);
    const first = starterProject.sprites[0].id;
    setSelected(first);
    editor.current?.load(workspaceOf(starterProject, first), contextFor(starterProject, first));
    setOutcome(null);
  };

  const allowed = allowedBlocks.length ? BLOCKS.filter((b) => allowedBlocks.includes(b.opcode)) : BLOCKS;
  const selectedName = selected === STAGE_ID ? "Palco" : project.sprites.find((s) => s.id === selected)?.name;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px]">
      {/* Altura FIXA: o resultado e os painéis ao lado não esticam o editor. */}
      <div className="clay blocos-editor relative flex h-[min(78vh,760px)] min-h-[520px] flex-col overflow-hidden">
        <div className="flex min-h-12 items-center gap-2 border-b-2 border-line px-3 py-1.5 text-sm font-extrabold">
          {showSprites && (
            <>
              <Puzzle aria-hidden className="h-4 w-4 text-brand" /> Blocos de: <span className="text-brand-shadow">{selectedName}</span>
            </>
          )}
          <button
            type="button"
            onClick={() => setHelpOpen(!helpOpen)}
            aria-expanded={helpOpen}
            aria-controls="ajuda-blocos"
            className={`ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl px-3 font-extrabold shadow-[0_3px_0_rgb(15_23_42/0.15)] ${helpOpen ? "bg-brand text-brand-text" : "bg-star text-night"}`}
          >
            <BookOpen aria-hidden className="h-4 w-4" /> Como funciona cada bloco
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          <BlockEditor
            handle={editor}
            allowedBlocks={allowedBlocks}
            initialState={workspaceOf(project, selected)}
            initialContext={contextFor(project, selected)}
            onChange={onBlocksChange}
          />
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
                    <span className="w-fit rounded-lg px-2.5 py-1 text-sm font-extrabold text-white shadow-[0_2px_0_rgb(15_23_42/0.2)]" style={{ background: CATEGORIES[b.category].colour }}>
                      {b.text.split("|")[0].replace(/%\d/g, "▢")}
                    </span>
                    <span className="font-semibold text-muted">{b.help}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="clay overflow-hidden p-2">
          <Stage state={stage} onMouse={onMouse} onStageClick={(x, y) => world.current?.click(x, y)} />
          <p className="flex justify-between gap-2 px-2 pt-2 text-xs font-bold text-muted">
            <span>{running ? "Jogando! Use o teclado e o mouse no palco." : showSprites ? "Arraste os atores para mudar onde eles começam." : ""}</span>
            {stage.targets[0] && <span className="font-mono">x: {Math.round(stage.targets[0].x)} · y: {Math.round(stage.targets[0].y)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={run} className={buttonClass("success", "md", "btn-go")}>
            <Flag aria-hidden className="h-5 w-5" /> Executar
          </button>
          <button onClick={stop} disabled={!running} className={buttonClass("danger", "md", "btn-stop")}>
            <Square aria-hidden className="h-4 w-4 fill-current" /> Parar
          </button>
          <button onClick={onVerify} disabled={pending} className={buttonClass("primary", "md", "flex-1 sm:flex-none")}>
            <CircleCheck aria-hidden className="h-5 w-5" /> {pending ? "Verificando…" : "Verificar"}
          </button>
          <button onClick={restart} className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-muted hover:text-foreground">
            <RotateCcw aria-hidden className="h-4 w-4" /> Recomeçar
          </button>
        </div>

        {outcome && !resultOpen && (
          <button type="button" onClick={() => setResultOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-2 text-left font-extrabold hover:border-[#8b6cff]">
            {outcome.ok ? <Stars value={outcome.stars} /> : <CircleX aria-hidden className="h-5 w-5 text-red-600" />}
            <span className="flex-1 truncate">{outcome.ok ? outcome.summary : outcome.error}</span>
            <span className="text-sm text-star">Ver resultado</span>
          </button>
        )}
        {outcome && resultOpen && <ResultDialog outcome={outcome} nextHref={nextHref} onClose={() => setResultOpen(false)} />}

        {showSprites && (
          <div className="clay space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Atores e palco</h3>
              <div className="flex gap-1">
                <button onClick={() => setPicker(picker === "sprite" ? null : "sprite")} className={buttonClass("secondary", "sm")} disabled={project.sprites.length >= MAX_SPRITES}>
                  <Plus aria-hidden className="h-4 w-4" /> Ator
                </button>
                <button onClick={() => setPicker(picker === "backdrop" ? null : "backdrop")} className={buttonClass("secondary", "sm")}>
                  <ImageIcon aria-hidden className="h-4 w-4" /> Cenário
                </button>
              </div>
            </div>

            {picker && (
              <div className="grid grid-cols-4 gap-2 rounded-2xl bg-brand-soft p-2" aria-label={picker === "sprite" ? "Escolha um ator" : "Escolha um cenário"}>
                {picker === "sprite"
                  ? (Object.keys(CHARACTERS) as CharacterId[]).map((c) => (
                      <button key={c} data-item={c} onClick={onPickSprite} className="flex flex-col items-center gap-1 rounded-xl bg-white p-1.5 text-xs font-bold text-night hover:ring-2 hover:ring-brand">
                        <Thumb character={c} /> {CHARACTERS[c].name}
                      </button>
                    ))
                  : (Object.keys(BACKDROPS) as BackdropId[]).map((b) => (
                      <button key={b} data-item={b} onClick={onPickBackdrop} disabled={project.stage.backdrops.includes(b)} className="flex flex-col items-center gap-1 rounded-xl bg-white p-1.5 text-xs font-bold text-night hover:ring-2 hover:ring-brand disabled:opacity-40">
                        <Thumb backdrop={b} /> {BACKDROPS[b]}
                      </button>
                    ))}
              </div>
            )}

            <ul className="grid grid-cols-3 gap-2">
              <li>
                <button
                  onClick={() => select(STAGE_ID)}
                  aria-pressed={selected === STAGE_ID}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-xs font-extrabold ${selected === STAGE_ID ? "border-brand bg-brand-soft" : "border-line"}`}
                >
                  <Thumb backdrop={project.stage.backdrops[0]} /> Palco
                </button>
              </li>
              {project.sprites.map((s) => (
                <li key={s.id} className="relative">
                  <button
                    onClick={() => select(s.id)}
                    aria-pressed={selected === s.id}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-xs font-extrabold ${selected === s.id ? "border-brand bg-brand-soft" : "border-line"}`}
                  >
                    <Thumb character={s.character} /> <span className="max-w-full truncate">{s.name}</span>
                  </button>
                  {selected === s.id && (
                    <span className="absolute -top-2 -right-1 flex gap-0.5">
                      <button onClick={() => renameSprite(s.id)} aria-label={`Renomear ${s.name}`} className="grid h-7 w-7 place-items-center rounded-full bg-white text-night shadow ring-1 ring-line">
                        <Pencil aria-hidden className="h-3.5 w-3.5" />
                      </button>
                      {project.sprites.length > 1 && (
                        <button onClick={() => removeSprite(s.id)} aria-label={`Apagar ${s.name}`} className="grid h-7 w-7 place-items-center rounded-full bg-white text-red-600 shadow ring-1 ring-line">
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {selected === STAGE_ID && (
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Cenários do palco</p>
                <ul className="flex flex-wrap gap-2">
                  {project.stage.backdrops.map((b) => (
                    <li key={b} className="flex items-center gap-1 rounded-full bg-black/5 py-1 pr-1 pl-3 text-xs font-bold">
                      {BACKDROPS[b]}
                      {project.stage.backdrops.length > 1 && (
                        <button onClick={() => removeBackdrop(b)} aria-label={`Remover cenário ${BACKDROPS[b]}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/10">
                          <Trash2 aria-hidden className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/** Miniatura de personagem ou cenário. */
function Thumb({ character, backdrop }: { character?: CharacterId; backdrop?: BackdropId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 96, 72);
    if (backdrop) {
      ctx.save();
      ctx.scale(96 / 480, 72 / 360);
      drawBackdrop(ctx, backdrop, 480, 360);
      ctx.restore();
    } else if (character) {
      ctx.save();
      ctx.translate(48, 38);
      const k = Math.min(1.2, 26 / CHARACTERS[character].radius);
      ctx.scale(k, k);
      ctx.strokeStyle = "#111827";
      drawCharacter(ctx, character, 0);
      ctx.restore();
    }
  }, [character, backdrop]);
  return <canvas ref={ref} width={96} height={72} className="h-12 w-16 rounded-lg bg-slate-50" aria-hidden />;
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
