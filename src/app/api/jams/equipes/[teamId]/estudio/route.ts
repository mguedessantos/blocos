import { getCurrentUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { getTeamStudio, saveTeamStudio } from "@/lib/dal/jams";
import { MAX_SB3_BYTES, Sb3Error } from "@/lib/sb3/project";

// Projeto do estúdio da equipe (.sb3): reabrir (GET) e guardar (PUT).

export async function GET(_req: Request, ctx: RouteContext<"/api/jams/equipes/[teamId]/estudio">) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { teamId } = await ctx.params;
  try {
    const p = await getTeamStudio(user, teamId);
    if (!p) return new Response(null, { status: 204 });
    return new Response(Buffer.from(p.bytes), {
      headers: { "Content-Type": "application/x.scratch.sb3", "X-Saved-At": p.savedAt.toISOString(), "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    if (err instanceof AccessError) return new Response(null, { status: 404 });
    throw err;
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/jams/equipes/[teamId]/estudio">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_SB3_BYTES) return Response.json({ ok: false, error: "O projeto é grande demais (máximo 25 MB)." }, { status: 413 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_SB3_BYTES) return Response.json({ ok: false, error: "O projeto é grande demais (máximo 25 MB)." }, { status: 413 });
  const { teamId } = await ctx.params;
  try {
    const savedAt = await saveTeamStudio(user, teamId, bytes);
    return Response.json({ ok: true, savedAt: savedAt.toISOString() });
  } catch (err) {
    if (err instanceof AccessError) return Response.json({ ok: false, error: err.message }, { status: 404 });
    if (err instanceof Sb3Error) return Response.json({ ok: false, error: err.message }, { status: 422 });
    throw err;
  }
}
