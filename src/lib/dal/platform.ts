import "server-only";
import { db } from "../db";
import type { CurrentUser } from "./auth";

export async function getPlatformOverview(user: CurrentUser) {
  if (user.role !== "SUPER_ADMIN") throw new Error("Acesso negado.");
  const [orgs, students, teachers] = await Promise.all([
    db.organization.findMany({
      include: {
        subscription: { include: { plan: true } },
        domains: true,
        _count: { select: { users: true, classes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: { in: ["TEACHER", "ORG_ADMIN"] } } }),
  ]);
  return { orgs, students, teachers };
}
