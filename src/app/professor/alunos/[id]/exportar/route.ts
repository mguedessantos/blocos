import { requireUser } from "@/lib/dal/auth";
import { AccessError, exportStudentData } from "@/lib/dal/classes";

// LGPD: download dos dados de um aluno em JSON.
export async function GET(_: Request, ctx: RouteContext<"/professor/alunos/[id]/exportar">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN"]);
  const { id } = await ctx.params;
  try {
    const data = await exportStudentData(user, id);
    return new Response(JSON.stringify({ exportadoEm: new Date().toISOString(), aluno: data }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aluno-${data.username ?? id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AccessError) return Response.json({ error: err.message }, { status: 404 });
    throw err;
  }
}
