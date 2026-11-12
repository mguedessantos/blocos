// Interpretador determinístico, sem eval: roda igual no navegador (animado) e no servidor (verificação).
// Semântica parecida com a do Scratch: cada script é uma "thread"; a cada quadro (1/30 s) cada thread
// roda até o fim de uma volta de laço ou até uma espera.

import type { Expr, Program, Stmt } from "./program";

export const STAGE_W = 480;
export const STAGE_H = 360;
export const FPS = 30;
const DT = 1 / FPS;

export type Line = [number, number, number, number];

export type StageState = {
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  bubble: string | null;
  penDown: boolean;
  lines: Line[];
  vars: Record<string, number | string>;
  /** Tudo o que o personagem falou, em ordem (usado pelo verificador). */
  said: string[];
  time: number;
  /** Maiores distâncias da origem atingidas, útil para checagens futuras. */
  steps: number;
};

export function initialState(): StageState {
  return { x: 0, y: 0, direction: 90, size: 100, visible: true, bubble: null, penDown: false, lines: [], vars: Object.create(null), said: [], time: 0, steps: 0 };
}

const MAX_LINES = 5000;
const MAX_TEXT = 200;

function toNum(v: number | string): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v.trim().replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? 0 : n;
}

function compare(a: number | string, b: number | string) {
  const na = Number(a), nb = Number(b);
  if (String(a).trim() !== "" && String(b).trim() !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const normDir = (d: number) => {
  let r = ((d + 180) % 360 + 360) % 360 - 180;
  if (r === -180) r = 180;
  return round(r);
};

/** Gerador de números pseudoaleatórios com semente (verificação reproduzível). */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Runtime {
  state: StageState = initialState();
  private threads: Generator<void, void, void>[] = [];
  private random: () => number;
  ticks = 0;

  constructor(private program: Program, seed = 42) {
    this.random = mulberry32(seed);
  }

  start() {
    this.state = initialState();
    this.ticks = 0;
    this.threads = this.program.scripts.filter((s) => s.hat === "event_whenflagclicked").map((s) => this.run(s.body));
  }

  get done() {
    return this.threads.length === 0;
  }

  /** Avança um quadro. */
  tick() {
    this.ticks++;
    this.state.time = round(this.ticks * DT);
    this.threads = this.threads.filter((t) => !t.next().done);
  }

  /** Roda sem animação até terminar ou até `maxSeconds` (laços "sempre" param no limite). */
  runToEnd(maxSeconds = 30) {
    this.start();
    const limit = maxSeconds * FPS;
    while (!this.done && this.ticks < limit) this.tick();
    return this.state;
  }

  private eval(e: Expr | undefined): number | string {
    if (!e) return "";
    if (e.kind === "lit") return e.value;
    if (e.kind === "var") return this.state.vars[e.name] ?? 0;
    const a = e.args;
    switch (e.opcode) {
      case "operator_add": return round(toNum(this.eval(a.NUM1)) + toNum(this.eval(a.NUM2)));
      case "operator_subtract": return round(toNum(this.eval(a.NUM1)) - toNum(this.eval(a.NUM2)));
      case "operator_multiply": return round(toNum(this.eval(a.NUM1)) * toNum(this.eval(a.NUM2)));
      case "operator_divide": {
        const d = toNum(this.eval(a.NUM2));
        return d === 0 ? 0 : round(toNum(this.eval(a.NUM1)) / d);
      }
      case "operator_random": {
        const lo = toNum(this.eval(a.FROM)), hi = toNum(this.eval(a.TO));
        const [min, max] = lo <= hi ? [lo, hi] : [hi, lo];
        if (Number.isInteger(min) && Number.isInteger(max)) return min + Math.floor(this.random() * (max - min + 1));
        return round(min + this.random() * (max - min));
      }
      case "operator_join": return (String(this.eval(a.STRING1)) + String(this.eval(a.STRING2))).slice(0, MAX_TEXT);
      case "operator_gt": return compare(this.eval(a.OPERAND1), this.eval(a.OPERAND2)) > 0 ? 1 : 0;
      case "operator_lt": return compare(this.eval(a.OPERAND1), this.eval(a.OPERAND2)) < 0 ? 1 : 0;
      case "operator_equals": return compare(this.eval(a.OPERAND1), this.eval(a.OPERAND2)) === 0 ? 1 : 0;
      case "motion_xposition": return round(this.state.x);
      case "motion_yposition": return round(this.state.y);
      default: return "";
    }
  }

  private truthy(e: Expr | undefined) {
    if (!e) return false;
    const v = this.eval(e);
    return v === 1 || v === "true";
  }

  private moveTo(x: number, y: number) {
    const s = this.state;
    // O personagem não sai totalmente do palco (como a "cerca" do Scratch).
    const nx = round(Math.max(-STAGE_W / 2, Math.min(STAGE_W / 2, x)));
    const ny = round(Math.max(-STAGE_H / 2, Math.min(STAGE_H / 2, y)));
    if (s.penDown && (nx !== s.x || ny !== s.y) && s.lines.length < MAX_LINES) s.lines.push([s.x, s.y, nx, ny]);
    s.steps += Math.hypot(nx - s.x, ny - s.y);
    s.x = nx;
    s.y = ny;
  }

  private say(text: number | string) {
    const t = String(text).slice(0, MAX_TEXT);
    this.state.bubble = t === "" ? null : t;
    if (t !== "") this.state.said.push(t);
  }

  private *wait(seconds: number): Generator<void, void, void> {
    const until = this.state.time + Math.max(0, Math.min(seconds, 3600));
    yield; // toda espera cede pelo menos um quadro
    while (this.state.time < until - 1e-9) yield;
  }

  private *run(stmts: Stmt[]): Generator<void, void, void> {
    const s = this.state;
    for (const st of stmts) {
      const a = st.args;
      switch (st.opcode) {
        case "motion_movesteps": {
          const n = toNum(this.eval(a.STEPS));
          const rad = ((90 - s.direction) * Math.PI) / 180;
          this.moveTo(s.x + n * Math.cos(rad), s.y + n * Math.sin(rad));
          break;
        }
        case "motion_turnright": s.direction = normDir(s.direction + toNum(this.eval(a.DEGREES))); break;
        case "motion_turnleft": s.direction = normDir(s.direction - toNum(this.eval(a.DEGREES))); break;
        case "motion_gotoxy": this.moveTo(toNum(this.eval(a.X)), toNum(this.eval(a.Y))); break;
        case "motion_changexby": this.moveTo(s.x + toNum(this.eval(a.DX)), s.y); break;
        case "motion_changeyby": this.moveTo(s.x, s.y + toNum(this.eval(a.DY))); break;
        case "motion_setx": this.moveTo(toNum(this.eval(a.X)), s.y); break;
        case "motion_sety": this.moveTo(s.x, toNum(this.eval(a.Y))); break;
        case "motion_pointindirection": s.direction = normDir(toNum(this.eval(a.DIRECTION))); break;
        case "motion_ifonedgebounce": {
          const r = 20;
          if (Math.abs(s.x) >= STAGE_W / 2 - r) s.direction = normDir(-s.direction);
          if (Math.abs(s.y) >= STAGE_H / 2 - r) s.direction = normDir(180 - s.direction);
          break;
        }
        case "looks_say": this.say(this.eval(a.MESSAGE)); break;
        case "looks_sayforsecs":
          this.say(this.eval(a.MESSAGE));
          yield* this.wait(toNum(this.eval(a.SECS)));
          s.bubble = null;
          break;
        case "looks_show": s.visible = true; break;
        case "looks_hide": s.visible = false; break;
        case "looks_changesizeby": s.size = Math.max(5, Math.min(500, s.size + toNum(this.eval(a.CHANGE)))); break;
        case "looks_setsizeto": s.size = Math.max(5, Math.min(500, toNum(this.eval(a.SIZE)))); break;
        case "control_wait": yield* this.wait(toNum(this.eval(a.DURATION))); break;
        case "control_repeat": {
          const times = Math.min(Math.round(toNum(this.eval(a.TIMES))), 10000);
          for (let i = 0; i < times; i++) {
            yield* this.run(st.substack ?? []);
            yield;
          }
          break;
        }
        case "control_forever":
          for (;;) {
            yield* this.run(st.substack ?? []);
            yield;
          }
        case "control_if":
          if (this.truthy(a.CONDITION)) yield* this.run(st.substack ?? []);
          break;
        case "control_if_else":
          yield* this.run((this.truthy(a.CONDITION) ? st.substack : st.substack2) ?? []);
          break;
        case "data_setvariableto":
          if (st.variable) s.vars[st.variable] = this.eval(a.VALUE);
          break;
        case "data_changevariableby":
          if (st.variable) s.vars[st.variable] = round(toNum(s.vars[st.variable] ?? 0) + toNum(this.eval(a.VALUE)));
          break;
        case "pen_penDown": s.penDown = true; break;
        case "pen_penUp": s.penDown = false; break;
        case "pen_clear": s.lines = []; break;
      }
    }
  }
}
