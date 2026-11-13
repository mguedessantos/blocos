import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal/auth";
import { guidesFor } from "@/lib/manual";

export default async function ManualPage() {
  const user = await requireUser(["TEACHER", "ORG_ADMIN", "JUDGE", "SUPER_ADMIN"]);
  redirect(`/manual/${guidesFor(user.role)[0].slug}`);
}
