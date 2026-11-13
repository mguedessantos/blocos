import { getCurrentUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { clearLessonProject, getLessonProject, saveLessonProject } from "@/lib/dal/lessons";
import { MAX_SB3_BYTES, Sb3Error } from "@/lib/sb3/project";

// Projeto do editor de blocos (.sb3 completo) do aluno nesta lição: guardar (PUT), reabrir (GET) e recomeçar (DELETE).
// Route handler (e não server action) porque projetos com desenhos e sons podem ter alguns MB.

async function student() {
  const user = await getCurrentUser();
  return user?.role === "STUDENT" ? user : null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/licoes/[id]/projeto">) {
  const user = await student();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  try {
    const p = await getLessonProject(user, id);
    if (!p) return new Response(null, { status: 204 });
    return new Response(Buffer.from(p.bytes), {
      headers: { "Content-Type": "application/x.scratch.sb3", "X-Saved-At": p.savedAt.toISOString(), "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    if (err instanceof AccessError) return new Response(null, { status: 404 });
    throw err;
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/licoes/[id]/projeto">) {
  const user = await student();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_SB3_BYTES) return Response.json({ ok: false, error: "O projeto é grande demais (máximo 25 MB)." }, { status: 413 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_SB3_BYTES) return Response.json({ ok: false, error: "O projeto é grande demais (máximo 25 MB)." }, { status: 413 });
  const { id } = await ctx.params;
  try {
    const savedAt = await saveLessonProject(user, id, bytes);
    return Response.json({ ok: true, savedAt: savedAt.toISOString() });
  } catch (err) {
    if (err instanceof AccessError) return Response.json({ ok: false, error: err.message }, { status: 404 });
    if (err instanceof Sb3Error) return Response.json({ ok: false, error: err.message }, { status: 422 });
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/licoes/[id]/projeto">) {
  const user = await student();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  try {
    await clearLessonProject(user, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof AccessError) return new Response(null, { status: 404 });
    throw err;
  }
}
