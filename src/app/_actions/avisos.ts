"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal/auth";
import { markAllAnnouncementsRead } from "@/lib/dal/platform";

export async function markAnnouncementsReadAction() {
  const user = await requireUser(["ORG_ADMIN", "TEACHER"]);
  await markAllAnnouncementsRead(user);
  revalidatePath("/", "layout");
}
