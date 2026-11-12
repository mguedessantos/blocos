import { describe, expect, it } from "vitest";
import { World } from "@/lib/blocks/interpreter";
import { compileProject, normalizeProject } from "@/lib/blocks/project";
import { checkProject, checksSchema } from "@/lib/checker";
import {
  broadcast, changeVar, changeX, compiled, createClone, deleteClone, flag, forever, gotoXY, hide, iff, keyPressed, move, random, setVar,
  show, stopAll, touching, wait, whenClicked, whenClone, whenKey, whenReceive, backdrop, sound,
} from "@/lib/blocks/build";

describe("projeto do editor", () => {
  it("aceita o formato antigo (um ator só) e limita entradas estranhas", () => {
    const p = normalizeProject({ blocks: { blocks: [] }, variables: [{ id: "a", name: "pontos" }] });
    expect(p.sprites).toHaveLength(1);
    expect(p.variables[0].name).toBe("pontos");
    const evil = normalizeProject({ v: 2, sprites: Array.from({ length: 50 }, () => ({ name: "X", character: "inexistente", x: 9999 })), stage: { backdrops: ["nada"] } });
    expect(evil.sprites).toHaveLength(20);
    expect(evil.sprites[0].character).toBe("bloquinho");
    expect(evil.sprites[0].x).toBe(240);
    expect(new Set(evil.sprites.map((s) => s.name)).size).toBe(20); // nomes únicos
    expect(evil.stage.backdrops).toEqual(["branco"]);
  });
});

describe("motor de jogo", () => {
  it("teclas: evento e sensor (controle suave)", () => {
    const w = new World(compiled({
      sprites: [{ code: [[whenKey("space"), changeX(10)], [flag(), forever(iff(keyPressed("up arrow"), b_changeY(5)))]] }],
    }));
    const s = w.runToEnd(2, [{ key: "space", from: 0.1, to: 0.2 }, { key: "up arrow", from: 0.5, to: 1 }]);
    expect(s.targets[0].x).toBe(10); // o evento dispara uma vez por toque
    expect(s.targets[0].y).toBeGreaterThan(60); // segurando a seta por 0,5 s ≈ 15 quadros × 5
  });

  it("clique em ator, mensagens e pare tudo", () => {
    const w = new World(compiled({
      sprites: [
        { name: "Botão", character: "botao", code: [[whenClicked(), broadcast("começar")]] },
        { name: "Herói", code: [[whenReceive("começar"), gotoXY(100, 50), stopAll()]] },
      ],
    }));
    const s = w.runToEnd(3, [{ click: "Botão", at: 0.5 }]);
    expect(s.targets[1]).toMatchObject({ x: 100, y: 50 });
    expect(s.stopped).toBe(true);
  });

  it("clones nascem, se movem e são apagados", () => {
    const w = new World(compiled({
      sprites: [{
        name: "Meteoro", character: "meteoro",
        code: [
          [flag(), hide(), b_repeat(5, createClone(), wait(0.1))],
          [whenClone(), show(), gotoXY(random(-200, 200), 150), b_repeat(10, b_changeY(-10)), deleteClone()],
        ],
      }],
    }));
    const s = w.runToEnd(5);
    expect(s.maxClones).toBeGreaterThanOrEqual(1);
    expect(s.targets.filter((t) => t.isClone)).toHaveLength(0);
  });

  it("colisão entre atores com placar", () => {
    const w = new World(compiled({
      variables: ["pontos"],
      sprites: [
        { name: "Herói", x: -100, code: [[flag(), setVar("pontos", n0()), forever(changeX(5))]] },
        { name: "Moeda", character: "moeda", x: 0, code: [[flag(), forever(iff(touching("Herói"), changeVar("pontos", n1()), gotoXY(200, 0)))]] },
      ],
    }));
    const s = w.runToEnd(3);
    expect(s.vars.pontos).toBeGreaterThanOrEqual(1);
  });

  it("cenários e sons ficam registrados", () => {
    const w = new World(compiled({ backdrops: ["inicio", "fim"], sprites: [{ code: [[flag(), sound("moeda"), backdrop("fim")]] }] }));
    const s = w.runToEnd(1);
    expect(s.backdrops[s.backdrop]).toBe("fim");
    expect(s.sounds).toEqual(["moeda"]);
  });

  it("palco também roda scripts", () => {
    const p = compileProject({ ...normalizeProject({ v: 2, sprites: [{}], stage: { backdrops: ["inicio", "fim"], workspace: {} } }) });
    p.stage.program = compiled({ sprites: [{ code: [[flag(), backdrop("fim")]] }] }).sprites[0].program;
    const s = new World(p).runToEnd(1);
    expect(s.backdrops[s.backdrop]).toBe("fim");
  });

  it("verificação com teclas simuladas", () => {
    const game = compiled({ sprites: [{ code: [[whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)]] }] });
    const checks = checksSchema.parse({
      inputs: [{ key: "right arrow", from: 0.1, to: 0.2 }, { key: "right arrow", from: 0.3, to: 0.4 }, { key: "left arrow", from: 0.5, to: 0.6 }],
      checks: [{ type: "keys", min: 2 }, { type: "finalPosition", x: 10, y: 0 }],
    });
    expect(checkProject(game, checks).passed).toBe(true);
    const lazy = compiled({ sprites: [{ code: [[whenKey("right arrow"), changeX(10)]] }] });
    expect(checkProject(lazy, checks).passed).toBe(false);
  });

  it("programas sem fim terminam no limite de tempo", () => {
    const w = new World(compiled({ sprites: [{ code: [[flag(), forever(move(1))]], }] }));
    w.runToEnd(1);
    expect(w.ticks).toBe(30);
  });
});

// atalhos locais
import { b, c, n } from "@/lib/blocks/build";
function b_changeY(d: number) { return b("motion_changeyby", { DY: n(d) }); }
function b_repeat(times: number, ...body: ReturnType<typeof b>[]) { return c("control_repeat", { TIMES: n(times) }, body); }
function n0() { return n(0); }
function n1() { return n(1); }
