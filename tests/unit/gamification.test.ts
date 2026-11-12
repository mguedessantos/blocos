import { describe, expect, it } from "vitest";
import { BADGES, earnedBadges, LEVELS, levelFor, statsFrom } from "@/lib/gamification";

describe("níveis", () => {
  it("começa no nível 1 e sobe nos limites", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, pct: 0, next: { xp: 50 } });
    expect(levelFor(49).level).toBe(1);
    expect(levelFor(50)).toMatchObject({ level: 2, pct: 0 });
    expect(levelFor(100)).toMatchObject({ level: 2, pct: 50 });
  });
  it("nível máximo não tem próximo", () => {
    const max = levelFor(99_999);
    expect(max.level).toBe(LEVELS.length);
    expect(max.next).toBeNull();
    expect(max.pct).toBe(100);
  });
});

const lesson = (o: Partial<{ type: string; mode: string; optional: boolean; trackId: string }> = {}) => ({ type: "EXERCICIO", mode: "EDITOR", optional: false, trackId: "t1", ...o });
const done = (o: Partial<{ stars: number; attempts: number }> = {}, l = lesson()) => ({ status: "CONCLUIDO", stars: 3, attempts: 1, ...o, lesson: l });

describe("medalhas", () => {
  const tracks = [
    { id: "t1", level: 1, required: 2 },
    { id: "t2", level: 1, required: 1 },
    { id: "t3", level: 2, required: 1 },
  ];

  it("ids são únicos", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });

  it("aluno sem nada não tem medalhas", () => {
    expect(earnedBadges(statsFrom([], tracks))).toEqual([]);
  });

  it("primeira lição, persistência e PictoBlox", () => {
    const s = statsFrom(
      [done({ attempts: 4, stars: 2 }), done({}, lesson({ optional: true, mode: "SB3" })), { status: "EM_ANDAMENTO", stars: 0, attempts: 9, lesson: lesson() }],
      tracks,
    );
    expect(s).toMatchObject({ completed: 2, persistent: 1, pictoblox: 1, exercisesFirstTry: 1 });
    expect(earnedBadges(s)).toEqual(expect.arrayContaining(["primeiro-passo", "persistente", "explorador-pictoblox"]));
    expect(earnedBadges(s)).not.toContain("primeiro-mundo"); // a extra não conta para terminar a trilha
  });

  it("terminar trilhas e o nível inteiro", () => {
    const one = statsFrom([done(), done()], tracks);
    expect(one.tracksFinished).toBe(1);
    expect(one.levelsFinished).toEqual([]);
    const all = statsFrom([done(), done(), done({}, lesson({ trackId: "t2" }))], tracks);
    expect(all.levelsFinished).toEqual([1]);
    expect(earnedBadges(all)).toEqual(expect.arrayContaining(["primeiro-mundo", "nivel-basico"]));
    expect(earnedBadges(all)).not.toContain("nivel-intermediario");
  });

  it("teoria não conta como 'de primeira'", () => {
    const s = statsFrom([done({ attempts: 0 }, lesson({ type: "TEORIA" }))], tracks);
    expect(s.exercisesFirstTry).toBe(0);
  });
});
