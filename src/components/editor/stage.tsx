"use client";

import { useEffect, useRef } from "react";
import { STAGE_H, STAGE_W, type TargetState, type WorldState } from "@/lib/blocks/interpreter";
import { drawBackdrop, drawCharacter } from "./art";

// Palco 480×360 com coordenadas do Scratch (0,0 no centro, y para cima).

function drawTarget(ctx: CanvasRenderingContext2D, t: TargetState) {
  if (!t.visible || t.ghost >= 100) return;
  ctx.save();
  ctx.translate(STAGE_W / 2 + t.x, STAGE_H / 2 - t.y);
  if (t.rotationStyle === "all around") ctx.rotate(((t.direction - 90) * Math.PI) / 180);
  else if (t.rotationStyle === "left-right" && t.direction < 0) ctx.scale(-1, 1);
  ctx.scale(t.size / 100, t.size / 100);
  ctx.globalAlpha = 1 - t.ghost / 100;
  if (t.color) ctx.filter = `hue-rotate(${Math.round(t.color * 1.8)}deg)`;
  ctx.strokeStyle = "#111827";
  drawCharacter(ctx, t.character, t.costume);
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, t: TargetState) {
  if (!t.bubble || !t.visible) return;
  ctx.font = "bold 14px system-ui, sans-serif";
  const text = t.bubble.length > 40 ? t.bubble.slice(0, 39) + "…" : t.bubble;
  const w = Math.max(40, ctx.measureText(text).width + 20);
  const h = 32;
  const bx = Math.max(4, Math.min(STAGE_W - w - 4, STAGE_W / 2 + t.x + 18));
  const by = Math.max(4, STAGE_H / 2 - t.y - 40 - h);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111827";
  ctx.fillText(text, bx + 10, by + 21);
}

function drawMonitors(ctx: CanvasRenderingContext2D, vars: WorldState["vars"]) {
  let y = 6;
  ctx.font = "bold 13px system-ui, sans-serif";
  for (const [name, value] of Object.entries(vars)) {
    const label = `${name}: ${value}`;
    const w = ctx.measureText(label).width + 16;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "#FF8C1A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(6, y, w, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#7c2d12";
    ctx.fillText(label, 14, y + 16);
    y += 28;
  }
}

type Props = {
  state: WorldState;
  /** Coordenadas do Scratch. */
  onMouse?: (m: { x: number; y: number; down?: boolean }) => void;
  onStageClick?: (x: number, y: number) => void;
  label?: string;
};

export function Stage({ state, onMouse, onStageClick, label }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    drawBackdrop(ctx, state.backdrops[state.backdrop] ?? "branco", STAGE_W, STAGE_H);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of state.lines) {
      ctx.moveTo(STAGE_W / 2 + x1, STAGE_H / 2 - y1);
      ctx.lineTo(STAGE_W / 2 + x2, STAGE_H / 2 - y2);
    }
    ctx.stroke();
    for (const t of state.targets) drawTarget(ctx, t);
    for (const t of state.targets) drawBubble(ctx, t);
    drawMonitors(ctx, state.vars);
  }, [state]);

  const toStage = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - r.left) / r.width) * STAGE_W - STAGE_W / 2),
      y: Math.round(STAGE_H / 2 - ((e.clientY - r.top) / r.height) * STAGE_H),
    };
  };

  const first = state.targets.find((t) => !t.isClone);
  return (
    <canvas
      ref={canvas}
      width={STAGE_W}
      height={STAGE_H}
      tabIndex={0}
      className="aspect-[4/3] w-full rounded-xl bg-white ring-2 ring-black/10 focus-visible:ring-4 focus-visible:ring-brand"
      role="img"
      aria-label={label ?? `Palco: ${first ? `${first.name} em x ${Math.round(first.x)}, y ${Math.round(first.y)}` : "vazio"}${first?.bubble ? `, dizendo ${first.bubble}` : ""}`}
      onMouseMove={(e) => onMouse?.(toStage(e))}
      onMouseDown={(e) => onMouse?.({ ...toStage(e), down: true })}
      onMouseUp={(e) => onMouse?.({ ...toStage(e), down: false })}
      onClick={(e) => {
        const p = toStage(e);
        onStageClick?.(p.x, p.y);
      }}
    />
  );
}
