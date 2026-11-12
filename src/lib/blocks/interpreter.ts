// Motor de jogo do editor do site. Determinístico e sem eval: o MESMO código anima no navegador
// e verifica no servidor (com teclas e cliques simulados). Semântica parecida com a do Scratch:
// cada script é uma "thread"; a cada quadro (1/30 s) cada thread roda até o fim de uma volta de
// laço ou até uma espera.

import { CHARACTERS, type BackdropId, type CharacterId, type SoundId } from "./library";
import type { Expr, Program, Stmt } from "./program";
import { singleSpriteProject, type ProjectProgram } from "./project";

export const STAGE_W = 480;
export const STAGE_H = 360;
export const FPS = 30;
const DT = 1 / FPS;
const MAX_LINES = 5000;
const MAX_TEXT = 200;
const MAX_CLONES = 300;
const MAX_THREADS = 2000;

export type Line = [number, number, number, number];
export type RotationStyle = "all around" | "left-right" | "don't rotate";

export type TargetState = {
  uid: number;
  name: string;
  character: CharacterId;
  isClone: boolean;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costume: number;
  rotationStyle: RotationStyle;
  ghost: number;
  color: number;
  bubble: string | null;
  penDown: boolean;
  /** Distância realmente percorrida (útil para checagens). */
  steps: number;
};

export type WorldState = {
  targets: TargetState[];
  lines: Line[];
  vars: Record<string, number | string>;
  /** Tudo o que foi falado, em ordem. */
  said: string[];
  sounds: SoundId[];
  backdrops: BackdropId[];
  backdrop: number;
  time: number;
  timerStart: number;
  maxClones: number;
  /** Total de clones criados desde o início. */
  clonesCreated: number;
  stopped: boolean;
};

/** Teclas e cliques simulados na verificação (segundos desde o início). */
export type SimulatedInput =
  | { key: string; from: number; to: number }
  | { click: string; at: number };

export type Mouse = { x: number; y: number; down: boolean };

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const normDir = (d: number) => {
  let r = ((((d + 180) % 360) + 360) % 360) - 180;
  if (r === -180) r = 180;
  return round(r);
};

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

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Script = Program["scripts"][number];
type Thread = { target: TargetState; key: string; gen: Generator<void, void, void>; done: boolean };

const STAGE_TARGET_NAME = "__palco__";

export class World {
  state!: WorldState;
  ticks = 0;
  mouse: Mouse = { x: 0, y: 0, down: false };
  onSound?: (s: SoundId) => void;
  private threads: Thread[] = [];
  private random: () => number = Math.random;
  private keysDown = new Set<string>();
  private pending: (() => void)[] = [];
  private uid = 0;
  /** Programa de cada ator original, por nome (clones usam o do original). */
  private programs = new Map<string, Program>();
  private stageTarget!: TargetState;

  constructor(private project: ProjectProgram, private seed = 42) {
    for (const s of project.sprites) this.programs.set(s.name, s.program);
    this.programs.set(STAGE_TARGET_NAME, project.stage.program);
    this.reset();
  }

  /** Volta tudo à posição inicial, sem rodar nada. */
  reset() {
    this.random = mulberry32(this.seed);
    this.threads = [];
    this.pending = [];
    this.keysDown.clear();
    this.ticks = 0;
    const vars = Object.create(null) as Record<string, number | string>;
    for (const v of this.project.variables) vars[v] = 0;
    this.state = {
      targets: this.project.sprites.map((s) => this.makeTarget(s.name, s.character, s)),
      lines: [],
      vars,
      said: [],
      sounds: [],
      backdrops: this.project.stage.backdrops,
      backdrop: 0,
      time: 0,
      timerStart: 0,
      maxClones: 0,
      clonesCreated: 0,
      stopped: false,
    };
    this.stageTarget = this.makeTarget(STAGE_TARGET_NAME, "bloquinho", { visible: false });
  }

  private makeTarget(name: string, character: CharacterId, s: Partial<TargetState>): TargetState {
    return {
      uid: ++this.uid, name, character, isClone: false, x: s.x ?? 0, y: s.y ?? 0, direction: s.direction ?? 90, size: s.size ?? 100,
      visible: s.visible ?? true, costume: 0, rotationStyle: "all around", ghost: 0, color: 0, bubble: null, penDown: false, steps: 0,
    };
  }

  /** Clique na bandeira verde. */
  start() {
    this.reset();
    this.fire((s) => s.hat === "event_whenflagclicked");
  }

  get done() {
    return this.state.stopped || (this.threads.length === 0 && this.pending.length === 0);
  }

  /** Há scripts esperando teclas ou cliques? (o jogo continua “vivo” mesmo sem threads rodando) */
  get interactive() {
    return [...this.programs.values()].some((p) => p.scripts.some((s) => s.hat === "event_whenkeypressed" || s.hat === "event_whenthisspriteclicked"));
  }

  // ───────────── Entrada do jogador ─────────────

  keyDown(key: string) {
    if (this.keysDown.has(key)) return;
    this.keysDown.add(key);
    this.pending.push(() => this.fire((s) => s.hat === "event_whenkeypressed" && (s.fields.KEY_OPTION === key || s.fields.KEY_OPTION === "any"), false));
  }
  keyUp(key: string) {
    this.keysDown.delete(key);
  }
  /** Clique no palco (coordenadas do Scratch): dispara “quando este ator for clicado” no ator de cima. */
  click(x: number, y: number) {
    const hit = [...this.state.targets].reverse().find((t) => t.visible && Math.hypot(t.x - x, t.y - y) <= this.radius(t) + 4);
    if (hit) this.pending.push(() => this.fireFor(hit, (s) => s.hat === "event_whenthisspriteclicked", true));
  }
  clickSprite(name: string) {
    const t = this.state.targets.find((tt) => tt.name === name && !tt.isClone);
    if (t) this.pending.push(() => this.fireFor(t, (s) => s.hat === "event_whenthisspriteclicked", true));
  }

  /** Avança um quadro. */
  tick() {
    if (this.state.stopped) return;
    this.ticks++;
    this.state.time = round(this.ticks * DT);
    for (const ev of this.pending.splice(0)) ev();
    // Scripts iniciados durante o quadro (ex.: por uma mensagem) também rodam neste quadro, como no Scratch.
    // O limite evita laços infinitos de mensagens que se reiniciam no mesmo quadro.
    let budget = MAX_THREADS * 2;
    for (let i = 0; i < this.threads.length && budget-- > 0; i++) {
      const th = this.threads[i];
      if (th.done || this.state.stopped) continue;
      if (th.gen.next().done) th.done = true;
    }
    this.threads = this.threads.filter((t) => !t.done && (t.target === this.stageTarget || this.state.targets.includes(t.target)));
  }

  /** Roda sem animação até terminar ou até `maxSeconds`, aplicando entradas simuladas. */
  runToEnd(maxSeconds = 30, inputs: SimulatedInput[] = []) {
    this.start();
    const limit = Math.round(maxSeconds * FPS);
    const lastInput = Math.max(0, ...inputs.map((i) => ("key" in i ? i.to : i.at)));
    while (this.ticks < limit && !this.state.stopped) {
      const t = (this.ticks + 1) * DT;
      // teclas seguradas neste quadro (um mesmo botão pode ter vários intervalos)
      const held = new Set(inputs.flatMap((i) => ("key" in i && t >= i.from && t < i.to ? [i.key] : [])));
      for (const k of [...this.keysDown]) if (!held.has(k)) this.keyUp(k);
      for (const k of held) this.keyDown(k);
      for (const inp of inputs) if ("click" in inp && Math.abs(t - inp.at) < DT / 2) this.clickSprite(inp.click);
      this.tick();
      if (this.done && t > lastInput) break;
    }
    return this.state;
  }

  // ───────────── Disparo de scripts ─────────────

  private fire(match: (s: Script) => boolean, restart = true) {
    for (const t of [...this.state.targets]) this.fireFor(t, match, restart);
    this.fireFor(this.stageTarget, match, restart);
  }

  private fireFor(t: TargetState, match: (s: Script) => boolean, restart: boolean) {
    const program = this.programs.get(t.name);
    if (!program) return;
    program.scripts.forEach((s, i) => {
      if (match(s)) this.startThread(t, `${t.uid}:${i}`, s.body, restart);
    });
  }

  private startThread(target: TargetState, key: string, body: Stmt[], restart: boolean) {
    const running = this.threads.find((th) => th.key === key && !th.done);
    if (running && !restart) return;
    if (running) running.done = true;
    if (this.threads.length >= MAX_THREADS) return;
    this.threads.push({ target, key, gen: this.run(target, body), done: false });
  }

  // ───────────── Avaliação ─────────────

  private radius(t: TargetState) {
    return CHARACTERS[t.character].radius * (t.size / 100);
  }

  private touchingEdge(t: TargetState) {
    const r = this.radius(t);
    return Math.abs(t.x) + r >= STAGE_W / 2 || Math.abs(t.y) + r >= STAGE_H / 2;
  }

  private touching(t: TargetState, what: string | undefined) {
    if (!t.visible && t.name !== STAGE_TARGET_NAME) return false;
    if (!what || what === "_edge_") return this.touchingEdge(t);
    if (what === "_mouse_") return Math.hypot(t.x - this.mouse.x, t.y - this.mouse.y) <= this.radius(t);
    return this.state.targets.some((o) => o !== t && o.visible && o.name === what && Math.hypot(o.x - t.x, o.y - t.y) < this.radius(o) + this.radius(t));
  }

  private pointOf(what: string | undefined, self: TargetState): { x: number; y: number } | null {
    if (what === "_mouse_") return this.mouse;
    if (what === "_random_") return { x: Math.round(this.random() * 440 - 220), y: Math.round(this.random() * 320 - 160) };
    const o = this.state.targets.find((tt) => tt.name === what && !tt.isClone && tt !== self) ?? this.state.targets.find((tt) => tt.name === what && tt !== self);
    return o ? { x: o.x, y: o.y } : null;
  }

  private eval(e: Expr | undefined, t: TargetState): number | string {
    if (!e) return "";
    if (e.kind === "lit") return e.value;
    if (e.kind === "var") return this.state.vars[e.name] ?? 0;
    const a = e.args;
    const n = (x: Expr | undefined) => toNum(this.eval(x, t));
    switch (e.opcode) {
      case "operator_add": return round(n(a.NUM1) + n(a.NUM2));
      case "operator_subtract": return round(n(a.NUM1) - n(a.NUM2));
      case "operator_multiply": return round(n(a.NUM1) * n(a.NUM2));
      case "operator_divide": { const d = n(a.NUM2); return d === 0 ? 0 : round(n(a.NUM1) / d); }
      case "operator_mod": { const m = n(a.NUM2); return m === 0 ? 0 : round(((n(a.NUM1) % m) + m) % m); }
      case "operator_round": return Math.round(n(a.NUM));
      case "operator_random": {
        const lo = n(a.FROM), hi = n(a.TO);
        const [min, max] = lo <= hi ? [lo, hi] : [hi, lo];
        if (Number.isInteger(min) && Number.isInteger(max)) return min + Math.floor(this.random() * (max - min + 1));
        return round(min + this.random() * (max - min));
      }
      case "operator_join": return (String(this.eval(a.STRING1, t)) + String(this.eval(a.STRING2, t))).slice(0, MAX_TEXT);
      case "operator_gt": return compare(this.eval(a.OPERAND1, t), this.eval(a.OPERAND2, t)) > 0 ? 1 : 0;
      case "operator_lt": return compare(this.eval(a.OPERAND1, t), this.eval(a.OPERAND2, t)) < 0 ? 1 : 0;
      case "operator_equals": return compare(this.eval(a.OPERAND1, t), this.eval(a.OPERAND2, t)) === 0 ? 1 : 0;
      case "operator_and": return this.truthy(a.OPERAND1, t) && this.truthy(a.OPERAND2, t) ? 1 : 0;
      case "operator_or": return this.truthy(a.OPERAND1, t) || this.truthy(a.OPERAND2, t) ? 1 : 0;
      case "operator_not": return this.truthy(a.OPERAND, t) ? 0 : 1;
      case "motion_xposition": return round(t.x);
      case "motion_yposition": return round(t.y);
      case "motion_direction": return t.direction;
      case "looks_size": return t.size;
      case "looks_costumenumbername": return t.costume + 1;
      case "sensing_touchingobject": return this.touching(t, e.fields.TOUCHINGOBJECTMENU) ? 1 : 0;
      case "sensing_keypressed": {
        const k = e.fields.KEY_OPTION ?? "space";
        return (k === "any" ? this.keysDown.size > 0 : this.keysDown.has(k)) ? 1 : 0;
      }
      case "sensing_mousedown": return this.mouse.down ? 1 : 0;
      case "sensing_mousex": return Math.round(this.mouse.x);
      case "sensing_mousey": return Math.round(this.mouse.y);
      case "sensing_distanceto": {
        const p = this.pointOf(e.fields.DISTANCETOMENU ?? "_mouse_", t);
        return p ? round(Math.hypot(p.x - t.x, p.y - t.y)) : 10000;
      }
      case "sensing_timer": return round(this.state.time - this.state.timerStart);
      default: return "";
    }
  }

  private truthy(e: Expr | undefined, t: TargetState) {
    if (!e) return false;
    const v = this.eval(e, t);
    return v === 1 || v === "true";
  }

  private moveTo(t: TargetState, x: number, y: number) {
    const nx = round(Math.max(-STAGE_W / 2, Math.min(STAGE_W / 2, x)));
    const ny = round(Math.max(-STAGE_H / 2, Math.min(STAGE_H / 2, y)));
    if (t.penDown && (nx !== t.x || ny !== t.y) && this.state.lines.length < MAX_LINES) this.state.lines.push([t.x, t.y, nx, ny]);
    t.steps += Math.hypot(nx - t.x, ny - t.y);
    t.x = nx;
    t.y = ny;
  }

  private say(t: TargetState, text: number | string) {
    const s = String(text).slice(0, MAX_TEXT);
    t.bubble = s === "" ? null : s;
    if (s !== "" && this.state.said.length < 1000) this.state.said.push(s);
  }

  private *wait(seconds: number): Generator<void, void, void> {
    const until = this.state.time + Math.max(0, Math.min(seconds, 3600));
    yield;
    while (this.state.time < until - 1e-9) yield;
  }

  private alive(t: TargetState) {
    return !this.state.stopped && (t === this.stageTarget || this.state.targets.includes(t));
  }

  private createClone(of: string | undefined, parent: TargetState) {
    const clones = this.state.targets.filter((t) => t.isClone).length;
    if (clones >= MAX_CLONES) return;
    const src = !of || of === "_myself_" ? parent : this.state.targets.find((t) => t.name === of && !t.isClone);
    if (!src || src === this.stageTarget) return;
    const clone: TargetState = { ...src, uid: ++this.uid, isClone: true, bubble: null, steps: 0 };
    this.state.targets.splice(this.state.targets.indexOf(src), 0, clone); // clones ficam atrás do original
    this.state.maxClones = Math.max(this.state.maxClones, clones + 1);
    this.state.clonesCreated++;
    this.pending.push(() => this.fireFor(clone, (s) => s.hat === "control_start_as_clone", true));
  }

  private *run(t: TargetState, stmts: Stmt[]): Generator<void, void, void> {
    for (const st of stmts) {
      if (!this.alive(t)) return;
      const a = st.args;
      const n = (x: Expr | undefined) => toNum(this.eval(x, t));
      switch (st.opcode) {
        // movimento
        case "motion_movesteps": {
          const steps = n(a.STEPS);
          const rad = ((90 - t.direction) * Math.PI) / 180;
          this.moveTo(t, t.x + steps * Math.cos(rad), t.y + steps * Math.sin(rad));
          break;
        }
        case "motion_turnright": t.direction = normDir(t.direction + n(a.DEGREES)); break;
        case "motion_turnleft": t.direction = normDir(t.direction - n(a.DEGREES)); break;
        case "motion_gotoxy": this.moveTo(t, n(a.X), n(a.Y)); break;
        case "motion_goto": {
          const p = this.pointOf(st.fields.TO ?? "_random_", t);
          if (p) this.moveTo(t, p.x, p.y);
          break;
        }
        case "motion_glidesecstoxy": {
          const secs = Math.max(0, n(a.SECS)), x0 = t.x, y0 = t.y, x1 = n(a.X), y1 = n(a.Y);
          const frames = Math.max(1, Math.round(secs * FPS));
          for (let i = 1; i <= frames; i++) {
            this.moveTo(t, x0 + ((x1 - x0) * i) / frames, y0 + ((y1 - y0) * i) / frames);
            yield;
            if (!this.alive(t)) return;
          }
          break;
        }
        case "motion_changexby": this.moveTo(t, t.x + n(a.DX), t.y); break;
        case "motion_changeyby": this.moveTo(t, t.x, t.y + n(a.DY)); break;
        case "motion_setx": this.moveTo(t, n(a.X), t.y); break;
        case "motion_sety": this.moveTo(t, t.x, n(a.Y)); break;
        case "motion_pointindirection": t.direction = normDir(n(a.DIRECTION)); break;
        case "motion_pointtowards": {
          const p = this.pointOf(st.fields.TOWARDS ?? "_mouse_", t);
          if (p && (p.x !== t.x || p.y !== t.y)) t.direction = normDir(90 - (Math.atan2(p.y - t.y, p.x - t.x) * 180) / Math.PI);
          break;
        }
        case "motion_ifonedgebounce": {
          const r = this.radius(t);
          const rad = ((90 - t.direction) * Math.PI) / 180;
          const dx = Math.cos(rad), dy = Math.sin(rad);
          if ((t.x + r >= STAGE_W / 2 && dx > 0) || (t.x - r <= -STAGE_W / 2 && dx < 0)) t.direction = normDir(-t.direction);
          if ((t.y + r >= STAGE_H / 2 && dy > 0) || (t.y - r <= -STAGE_H / 2 && dy < 0)) t.direction = normDir(180 - t.direction);
          break;
        }
        case "motion_setrotationstyle": {
          const v = st.fields.STYLE;
          t.rotationStyle = v === "left-right" || v === "don't rotate" ? v : "all around";
          break;
        }
        // aparência
        case "looks_say": this.say(t, this.eval(a.MESSAGE, t)); break;
        case "looks_sayforsecs":
          this.say(t, this.eval(a.MESSAGE, t));
          yield* this.wait(n(a.SECS));
          t.bubble = null;
          break;
        case "looks_show": t.visible = true; break;
        case "looks_hide": t.visible = false; break;
        case "looks_nextcostume": t.costume = (t.costume + 1) % CHARACTERS[t.character].costumes.length; break;
        case "looks_switchcostumeto": {
          const i = CHARACTERS[t.character].costumes.indexOf(st.fields.COSTUME ?? "");
          if (i >= 0) t.costume = i;
          break;
        }
        case "looks_switchbackdropto": {
          const i = this.state.backdrops.indexOf(st.fields.BACKDROP as BackdropId);
          if (i >= 0) this.state.backdrop = i;
          break;
        }
        case "looks_nextbackdrop": this.state.backdrop = (this.state.backdrop + 1) % this.state.backdrops.length; break;
        case "looks_changesizeby": t.size = Math.max(5, Math.min(500, t.size + n(a.CHANGE))); break;
        case "looks_setsizeto": t.size = Math.max(5, Math.min(500, n(a.SIZE))); break;
        case "looks_changeeffectby":
        case "looks_seteffectto": {
          const set = st.opcode === "looks_seteffectto";
          const v = n(set ? a.VALUE : a.CHANGE);
          if (st.fields.EFFECT === "ghost") t.ghost = Math.max(0, Math.min(100, set ? v : t.ghost + v));
          else t.color = set ? v : t.color + v;
          break;
        }
        case "looks_cleargraphiceffects": t.ghost = 0; t.color = 0; break;
        // som
        case "sound_play":
        case "sound_playuntildone": {
          const snd = (st.fields.SOUND_MENU ?? "pop") as SoundId;
          if (this.state.sounds.length < 1000) this.state.sounds.push(snd);
          this.onSound?.(snd);
          if (st.opcode === "sound_playuntildone") yield* this.wait(0.5);
          break;
        }
        // eventos
        case "event_broadcast":
        case "event_broadcastandwait": {
          const msg = st.fields.BROADCAST_OPTION ?? "";
          const before = new Set(this.threads);
          this.fire((s) => s.hat === "event_whenbroadcastreceived" && s.fields.BROADCAST_OPTION === msg);
          if (st.opcode === "event_broadcastandwait") {
            const started = this.threads.filter((th) => !before.has(th));
            yield;
            while (started.some((th) => !th.done)) yield;
          }
          break;
        }
        // controle
        case "control_wait": yield* this.wait(n(a.DURATION)); break;
        case "control_repeat": {
          const times = Math.min(Math.round(n(a.TIMES)), 10000);
          for (let i = 0; i < times; i++) {
            yield* this.run(t, st.substack ?? []);
            if (!this.alive(t)) return;
            yield;
          }
          break;
        }
        case "control_forever":
          for (;;) {
            yield* this.run(t, st.substack ?? []);
            if (!this.alive(t)) return;
            yield;
          }
        case "control_repeat_until": {
          let guard = 0;
          while (!this.truthy(a.CONDITION, t) && guard++ < 100000) {
            yield* this.run(t, st.substack ?? []);
            if (!this.alive(t)) return;
            yield;
          }
          break;
        }
        case "control_wait_until": {
          let guard = 0;
          while (!this.truthy(a.CONDITION, t) && guard++ < 100000) yield;
          break;
        }
        case "control_if":
          if (this.truthy(a.CONDITION, t)) yield* this.run(t, st.substack ?? []);
          break;
        case "control_if_else":
          yield* this.run(t, (this.truthy(a.CONDITION, t) ? st.substack : st.substack2) ?? []);
          break;
        case "control_stop": {
          const opt = st.fields.STOP_OPTION ?? "all";
          if (opt === "all") {
            this.state.stopped = true;
            return;
          }
          if (opt === "this script") return;
          break;
        }
        case "control_create_clone_of": this.createClone(st.fields.CLONE_OPTION, t); break;
        case "control_delete_this_clone":
          if (t.isClone) {
            this.state.targets = this.state.targets.filter((x) => x !== t);
            return;
          }
          break;
        // sensores
        case "sensing_resettimer": this.state.timerStart = this.state.time; break;
        // variáveis
        case "data_setvariableto":
          if (st.variable) this.state.vars[st.variable] = this.eval(a.VALUE, t);
          break;
        case "data_changevariableby":
          if (st.variable) this.state.vars[st.variable] = round(toNum(this.state.vars[st.variable] ?? 0) + n(a.VALUE));
          break;
        // caneta
        case "pen_penDown": t.penDown = true; break;
        case "pen_penUp": t.penDown = false; break;
        case "pen_clear": this.state.lines = []; break;
      }
    }
  }
}

// ───────────── Compatibilidade: um ator só ─────────────

export type StageState = TargetState & Pick<WorldState, "lines" | "vars" | "said" | "time">;

export function initialState(): StageState {
  const w = new World(singleSpriteProject({ scripts: [], opcodeCounts: {}, blockCount: 0 }));
  return { ...w.state.targets[0], lines: [], vars: {}, said: [], time: 0 };
}

/** Atalho para um programa de um ator só; `state` mostra o primeiro ator + dados do mundo. */
export class Runtime {
  readonly world: World;
  constructor(program: Program, seed = 42) {
    this.world = new World(singleSpriteProject(program), seed);
  }
  get state(): StageState {
    const w = this.world.state;
    return { ...w.targets[0], lines: w.lines, vars: w.vars, said: w.said, time: w.time };
  }
  get done() {
    return this.world.done;
  }
  start() {
    this.world.start();
  }
  tick() {
    this.world.tick();
  }
  runToEnd(maxSeconds = 30) {
    this.world.runToEnd(maxSeconds);
    return this.state;
  }
}
