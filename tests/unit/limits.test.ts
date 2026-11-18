import { describe, expect, it } from "vitest";
import { checkCanAddClass, checkCanAddStudents, checkCanAddTeacher, studentLimit } from "@/lib/billing/entitlements";

const now = new Date("2026-11-11T12:00:00Z");
const professor = { features: [], perSeat: false, minSeats: 1, maxStudents: 40, maxClasses: 3 };
const escola = { features: [], perSeat: true, minSeats: 30, maxStudents: null, maxClasses: null };
const active = (plan: typeof professor | typeof escola, seats: number | null = null) =>
  ({ status: "ACTIVE" as const, trialEndsAt: null, seats, plan });

describe("limites do plano", () => {
  it("plano Professor: 40 alunos e 3 turmas", () => {
    expect(studentLimit(active(professor))).toBe(40);
    expect(checkCanAddStudents(active(professor), 39, 1, now)).toEqual({ ok: true });
    expect(checkCanAddStudents(active(professor), 39, 2, now).ok).toBe(false);
    expect(checkCanAddClass(active(professor), 3, now).ok).toBe(false);
  });
  it("plano por aluno usa os assentos contratados (ou o mínimo no teste)", () => {
    expect(studentLimit(active(escola, 120))).toBe(120);
    expect(studentLimit({ status: "TRIAL", trialEndsAt: null, plan: escola })).toBe(30);
    expect(checkCanAddClass(active(escola, 120), 500, now)).toEqual({ ok: true });
  });
  it("conta somente leitura não cria nada", () => {
    const ro = { status: "READ_ONLY" as const, trialEndsAt: null, plan: escola };
    expect(checkCanAddStudents(ro, 0, 1, now).ok).toBe(false);
    expect(checkCanAddClass(ro, 0, now).ok).toBe(false);
  });
});

describe("plano Professor Independente / Pequenas Escolas", () => {
  const prof = { features: ["white_label"], perSeat: false, minSeats: 1, maxStudents: 10, maxClasses: 3, maxTeachers: 1 };
  const sub = (extraStudents = 0) => ({ status: "ACTIVE" as const, trialEndsAt: null, extraStudents, plan: prof });
  it("10 alunos, mais os adicionais contratados", () => {
    expect(studentLimit(sub())).toBe(10);
    expect(checkCanAddStudents(sub(), 10, 1, now).ok).toBe(false);
    expect(studentLimit(sub(15))).toBe(25);
    expect(checkCanAddStudents(sub(5), 10, 5, now)).toEqual({ ok: true });
  });
  it("só 1 professor; plano Escola não limita professores", () => {
    expect(checkCanAddTeacher(sub(), 0)).toEqual({ ok: true });
    expect(checkCanAddTeacher(sub(), 1).ok).toBe(false);
    expect(checkCanAddTeacher({ status: "ACTIVE", trialEndsAt: null, plan: { features: [], maxTeachers: null } }, 50)).toEqual({ ok: true });
  });
});
