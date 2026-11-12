import { beforeAll, describe, expect, it } from "vitest";
import { decryptSession, encryptSession } from "@/lib/session-token";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(40);
});

describe("token de sessão", () => {
  it("ida e volta", async () => {
    const token = await encryptSession({ userId: "u1", role: "TEACHER", orgId: "o1", expiresAt: new Date().toISOString() });
    expect(await decryptSession(token)).toMatchObject({ userId: "u1", role: "TEACHER", orgId: "o1" });
  });
  it("rejeita token adulterado ou ausente", async () => {
    const token = await encryptSession({ userId: "u1", role: "STUDENT", orgId: "o1", expiresAt: "" });
    expect(await decryptSession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await decryptSession(undefined)).toBeNull();
  });
});
