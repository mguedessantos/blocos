import { getCurrentUser } from "@/lib/dal/auth";
import { listPlatformSchools } from "@/lib/dal/platform";
import { parsePlatformFilters, toCsv } from "@/lib/platform-filters";

/** CSV das escolas com os mesmos filtros e ordem do painel. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return new Response("Acesso negado.", { status: 403 });
  const f = parsePlatformFilters(Object.fromEntries(new URL(req.url).searchParams));
  const rows = await listPlatformSchools(user, f);
  const csv = toCsv(
    ["Nome", "Tipo", "Endereço", "Cidade", "UF", "Plano", "Status", "Professores", "Alunos", "Turmas", "Lições concluídas", "Tentativas", "Última atividade", "Criada em"],
    rows.map((r) => [r.name, r.type === "ESCOLA" ? "Escola" : "Professor(a)", r.slug, r.city, r.state, r.plan, r.status, r.teachers, r.students, r.classes, r.completed, r.attempts, r.lastActivity, r.createdAt]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="escolas-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
