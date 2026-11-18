import { timingSafeEqual } from "node:crypto";
import { runInactivityJob } from "@/lib/dal/retention";

// Chamada 1x por dia pelo Cron da Vercel (vercel.json), que envia "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET ? Buffer.from(`Bearer ${process.env.CRON_SECRET}`) : null;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  if (!expected || got.length !== expected.length || !timingSafeEqual(got, expected)) return new Response("Não autorizado.", { status: 401 });
  return Response.json(await runInactivityJob());
}
