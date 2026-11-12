// Desenhos originais dos personagens e cenários (canvas). Cada personagem fica centrado em (0,0)
// e olha para a direita; o palco cuida de posição, rotação e tamanho.
import type { BackdropId, CharacterId, SoundId } from "@/lib/blocks/library";

type Ctx = CanvasRenderingContext2D;

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string, stroke?: string, lw = 3) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function eyes(ctx: Ctx, x: number, dy: number, look = 3) {
  for (const ey of [-dy, dy]) {
    circle(ctx, x, ey, 6, "#fff");
    circle(ctx, x + look, ey, 3, "#111827");
  }
}

function star(ctx: Ctx, r: number, fill: string, stroke: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

export function drawCharacter(ctx: Ctx, id: CharacterId, costume: number) {
  const alt = costume % 2 === 1;
  switch (id) {
    case "bloquinho": {
      rect(ctx, -22, -20, 44, 40, 10, "#ff8a3d", "#7c2d12");
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(alt ? 4 : 0, -30);
      ctx.stroke();
      circle(ctx, alt ? 4 : 0, -32, 4, "#facc15");
      eyes(ctx, 8, 7);
      // pés (alternam ao andar)
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(alt ? -16 : -12, 20, 9, 5);
      ctx.fillRect(alt ? 6 : 2, 20, 9, 5);
      break;
    }
    case "moeda": {
      ctx.save();
      ctx.scale(alt ? 0.35 : 1, 1);
      circle(ctx, 0, 0, 14, "#facc15", "#a16207");
      circle(ctx, 0, 0, 8, "#fde047");
      ctx.restore();
      break;
    }
    case "estrela":
      star(ctx, 17, alt ? "#fef08a" : "#fbbf24", "#b45309");
      break;
    case "glitch": {
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI / 6) * i;
        const rr = i % 2 ? 16 : 23;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = alt ? "#c026d3" : "#7c3aed";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#3b0764";
      ctx.stroke();
      if (alt) {
        ctx.fillStyle = "#111827";
        ctx.fillRect(2, -9, 12, 3);
        ctx.fillRect(2, 6, 12, 3);
      } else {
        eyes(ctx, 6, 7, 3);
        ctx.strokeStyle = "#111827";
        ctx.beginPath();
        ctx.moveTo(-2, -15);
        ctx.lineTo(12, -9);
        ctx.moveTo(-2, 15);
        ctx.lineTo(12, 9);
        ctx.stroke();
      }
      break;
    }
    case "nave": {
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-16, -16);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-16, 16);
      ctx.closePath();
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0c4a6e";
      ctx.stroke();
      circle(ctx, 6, 0, 5, "#e0f2fe", "#0c4a6e", 2);
      if (alt) {
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-28, 0);
        ctx.lineTo(-10, 6);
        ctx.fillStyle = "#f97316";
        ctx.fill();
      }
      break;
    }
    case "meteoro": {
      if (alt) {
        ctx.beginPath();
        ctx.moveTo(-6, -14);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-6, 14);
        ctx.fillStyle = "#f97316";
        ctx.fill();
      }
      circle(ctx, 0, 0, 16, "#78716c", "#292524");
      circle(ctx, -5, -4, 4, "#57534e");
      circle(ctx, 6, 5, 3, "#57534e");
      break;
    }
    case "bola":
      circle(ctx, 0, 0, 14, alt ? "#ef4444" : "#3b82f6", alt ? "#7f1d1d" : "#1e3a8a");
      circle(ctx, -4, -5, 4, "rgba(255,255,255,0.7)");
      break;
    case "bandeira": {
      ctx.fillStyle = "#57534e";
      ctx.fillRect(-12, -20, 4, 40);
      ctx.beginPath();
      ctx.moveTo(-8, -20);
      ctx.lineTo(16, -12);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fillStyle = alt ? "#facc15" : "#22c55e";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#14532d";
      ctx.stroke();
      break;
    }
    case "parede": {
      rect(ctx, -26, -26, 52, 52, 4, alt ? "#9ca3af" : "#b45309", alt ? "#374151" : "#7c2d12");
      ctx.strokeStyle = alt ? "#4b5563" : "#7c2d12";
      ctx.lineWidth = 2;
      for (const y of [-9, 8]) {
        ctx.beginPath();
        ctx.moveTo(-26, y);
        ctx.lineTo(26, y);
        ctx.stroke();
      }
      break;
    }
    case "botao": {
      rect(ctx, -44, -18, 88, 36, 14, alt ? "#f59e0b" : "#22c55e", alt ? "#92400e" : "#14532d");
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(alt ? "DE NOVO" : "JOGAR", 0, 1);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      break;
    }
    case "coracao": {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-20, -2, -12, -18, 0, -8);
      ctx.bezierCurveTo(12, -18, 20, -2, 0, 12);
      ctx.fillStyle = alt ? "#e5e7eb" : "#ef4444";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = alt ? "#9ca3af" : "#7f1d1d";
      ctx.stroke();
      break;
    }
    case "fruta": {
      if (alt) {
        ctx.beginPath();
        ctx.arc(0, -10, 20, Math.PI * 0.25, Math.PI * 0.85);
        ctx.lineWidth = 9;
        ctx.strokeStyle = "#facc15";
        ctx.stroke();
      } else {
        circle(ctx, 0, 2, 13, "#ef4444", "#7f1d1d");
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(-1, -16, 3, 7);
      }
      break;
    }
  }
}

export function drawBackdrop(ctx: Ctx, id: BackdropId, w: number, h: number) {
  const grad = (top: string, bottom: string) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  switch (id) {
    case "branco":
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      break;
    case "ceu":
      grad("#7dd3fc", "#e0f2fe");
      for (const [x, y] of [[90, 70], [330, 50], [400, 120]]) {
        circle(ctx, x, y, 18, "#fff");
        circle(ctx, x + 18, y + 4, 14, "#fff");
        circle(ctx, x - 16, y + 6, 12, "#fff");
      }
      break;
    case "floresta":
      grad("#bbf7d0", "#86efac");
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, h - 50, w, 50);
      for (const x of [40, 140, 360, 440]) {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(x - 5, h - 110, 10, 60);
        circle(ctx, x, h - 120, 28, "#15803d");
      }
      break;
    case "espaco":
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) circle(ctx, (i * 97) % w, (i * 53) % h, (i % 3) * 0.6 + 0.6, "#e2e8f0");
      circle(ctx, 400, 70, 26, "#a78bfa");
      break;
    case "cidade":
      grad("#fde68a", "#fdba74");
      for (const [x, bw, bh] of [[0, 70, 140], [80, 60, 200], [150, 90, 110], [250, 70, 170], [330, 80, 130], [420, 60, 190]]) {
        ctx.fillStyle = "#475569";
        ctx.fillRect(x, h - bh, bw, bh);
        ctx.fillStyle = "#fef08a";
        for (let wy = h - bh + 12; wy < h - 20; wy += 24) for (let wx = x + 10; wx < x + bw - 10; wx += 18) ctx.fillRect(wx, wy, 8, 10);
      }
      break;
    case "castelo":
      grad("#c4b5fd", "#ede9fe");
      ctx.fillStyle = "#64748b";
      ctx.fillRect(140, 120, 200, 240);
      for (let x = 140; x < 340; x += 40) ctx.fillRect(x, 100, 24, 24);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(215, 260, 50, 100, [25, 25, 0, 0]);
      ctx.fill();
      break;
    case "inicio":
    case "fim": {
      grad(id === "inicio" ? "#4f46e5" : "#be123c", id === "inicio" ? "#7c3aed" : "#f43f5e");
      ctx.fillStyle = "#fff";
      ctx.font = "bold 44px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(id === "inicio" ? "MEU JOGO" : "FIM DE JOGO", w / 2, 110);
      ctx.textAlign = "start";
      break;
    }
  }
}

// ───────────── Sons sintetizados (Web Audio) ─────────────

let audio: AudioContext | null = null;

export function playSound(id: SoundId) {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    const now = ctx.currentTime;
    const tone = (freq: number, start: number, dur: number, type: OscillatorType = "square", endFreq?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now + start);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, now + start + dur);
      g.gain.setValueAtTime(0.12, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now + start);
      o.stop(now + start + dur);
    };
    switch (id) {
      case "pop": tone(600, 0, 0.08, "sine", 900); break;
      case "moeda": tone(988, 0, 0.08); tone(1319, 0.08, 0.25); break;
      case "pulo": tone(300, 0, 0.2, "square", 700); break;
      case "explosao": tone(160, 0, 0.4, "sawtooth", 40); break;
      case "vitoria": tone(523, 0, 0.12); tone(659, 0.12, 0.12); tone(784, 0.24, 0.3); break;
      case "derrota": tone(392, 0, 0.18); tone(330, 0.18, 0.18); tone(262, 0.36, 0.35); break;
    }
  } catch {
    /* sem áudio no navegador: tudo bem */
  }
}
