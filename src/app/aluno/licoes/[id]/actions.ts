"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VerifyOutcome } from "@/components/editor/lesson-player";
import { requireUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { completeTheory, getStudentLesson, submitAttempt } from "@/lib/dal/lessons";

export async function verifyLessonAction(lessonId: string, workspaceJson: string): Promise<VerifyOutcome> {
  const user = await requireUser(["STUDENT"]);
  try {
    const r = await submitAttempt(user, lessonId, workspaceJson);
    if (!r.ok) return r;
    revalidatePath("/aluno", "layout");
    const { passed, stars, summary, items } = r.result;
    return { ok: true, passed, stars, summary, items, xpGained: r.xpGained, newBadges: r.newBadges, extra: r.extra ?? null };
  } catch (err) {
    if (err instanceof AccessError) return { ok: false, error: err.message };
    throw err;
  }
}

export async function completeTheoryAction(lessonId: string): Promise<{ error?: string }> {
  const user = await requireUser(["STUDENT"]);
  const r = await completeTheory(user, lessonId);
  if (!r.ok) return { error: r.error };
  revalidatePath("/aluno", "layout");
  const { nextLessonId, lesson } = await getStudentLesson(user, lessonId);
  redirect(nextLessonId ? `/aluno/licoes/${nextLessonId}` : `/aluno/trilhas/${lesson.module.track.id}`);
}
