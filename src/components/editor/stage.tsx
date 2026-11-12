"use client";

import { useEffect, useRef } from "react";
import { STAGE_H, STAGE_W, type StageState } from "@/lib/blocks/interpreter";

// Palco 480×360 com coordenadas do Scratch (0,0 no centro, y para cima).
// O personagem é o “Bloquinho”, um robozinho desenhado em código (sem arte de terceiros).

function drawBloquinho(ctx: CanvasRenderingContext2D, s: StageState) {
  const scale = s.size / 100;
  ctx.save();
  ctx.translate(STAGE_W / 2 + s.x, STAGE_H / 2 - s.y);
  ctx.rotate(((s.direction - 90) * Math.PI) / 180);
  ctx.scale(scale, scale);
  // corpo
  ctx.fillStyle = "#ff8a3d";
  ctx.strokeStyle = "#7c2d12";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-22, -20, 44, 40, 10);
  ctx.fill();
  ctx.stroke();
  // antena
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, -30);
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(0, -32, 4, 0, Math.PI * 2);
  ctx.fill();
  // olhos (olhando para a frente = direita, na direção do movimento)
  ctx.fillStyle = "#fff";
  for (const ey of [-7, 7]) {
    ctx.beginPath();
    ctx.arc(8, ey, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#111827";
  for (const ey of [-7, 7]) {
    ctx.beginPath();
    ctx.arc(11, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, s: StageState) {
  if (!s.bubble || !s.visible) return;
  ctx.font = "bold 14px system-ui, sans-serif";
  const text = s.bubble.length > 40 ? s.bubble.slice(0, 39) + "…" : s.bubble;
  const w = Math.max(40, ctx.measureText(text).width + 20);
  const h = 32;
  let bx = STAGE_W / 2 + s.x + 20;
  let by = STAGE_H / 2 - s.y - 40 - h;
  bx = Math.max(4, Math.min(STAGE_W - w - 4, bx));
  by = Math.max(4, by);
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

export function Stage({ state }: { state: StageState }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    // eixos discretos para ajudar com x/y
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(STAGE_W / 2, 0);
    ctx.lineTo(STAGE_W / 2, STAGE_H);
    ctx.moveTo(0, STAGE_H / 2);
    ctx.lineTo(STAGE_W, STAGE_H / 2);
    ctx.stroke();
    // desenhos da caneta
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of state.lines) {
      ctx.moveTo(STAGE_W / 2 + x1, STAGE_H / 2 - y1);
      ctx.lineTo(STAGE_W / 2 + x2, STAGE_H / 2 - y2);
    }
    ctx.stroke();
    if (state.visible) drawBloquinho(ctx, state);
    drawBubble(ctx, state);
  }, [state]);

  return (
    <canvas
      ref={canvas}
      width={STAGE_W}
      height={STAGE_H}
      className="aspect-[4/3] w-full rounded-xl bg-white ring-2 ring-black/10"
      role="img"
      aria-label={`Palco: personagem em x ${Math.round(state.x)}, y ${Math.round(state.y)}${state.bubble ? `, dizendo ${state.bubble}` : ""}`}
    />
  );
}
