"use server";

import type { VerifyOutcome } from "@/components/editor/lesson-player";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { previewAttempt } from "@/lib/dal/lessons";

/** Verificar durante a aula: mesmo resultado que o aluno veria, sem gravar progresso. */
export async function previewVerifyAction(lessonId: string, workspaceJson: string): Promise<VerifyOutcome> {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  try {
    const r = await previewAttempt(user, lessonId, workspaceJson);
    if (!r.ok) return r;
    const { passed, stars, summary, items } = r.result;
    return { ok: true, passed, stars, summary, items, xpGained: 0, extra: r.extra };
  } catch (err) {
    if (err instanceof AccessError) return { ok: false, error: err.message };
    throw err;
  }
}
