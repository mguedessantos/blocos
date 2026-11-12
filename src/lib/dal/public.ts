import "server-only";
import { db } from "../db";

// Dados públicos (sem login). Nada específico de cliente aqui.
export async function listPublicPlans() {
  return db.plan.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true, name: true, description: true, priceCents: true, perSeat: true,
      minSeats: true, maxStudents: true, maxClasses: true, features: true, orgType: true,
    },
  });
}
