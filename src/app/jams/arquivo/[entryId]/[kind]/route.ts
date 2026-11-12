import { getCurrentUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { auditJam, authorizeDownload } from "@/lib/dal/jams";
import { getFile } from "@/lib/storage";

const TYPES = { sb3: "application/x.scratch.sb3", pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } as const;

/** Baixa o projeto ou a documentação com nome ANÔNIMO (projeto-K7Q2.sb3). */
export async function GET(_: Request, ctx: RouteContext<"/jams/arquivo/[entryId]/[kind]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login.", { status: 401 });
  const { entryId, kind } = await ctx.params;
  if (kind !== "projeto" && kind !== "documentacao") return new Response("Não encontrado.", { status: 404 });
  try {
    const { entry, asJudge } = await authorizeDownload(user, entryId);
    const ext = kind === "projeto" ? "sb3" : (entry.docExt as "pdf" | "docx");
    const bytes = await getFile(kind === "projeto" ? entry.projectKey : entry.docKey);
    if (asJudge) await auditJam(user, `jam.arquivo.baixar.${kind}`, entry.id, { anonCode: entry.anonCode });
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": TYPES[ext],
        "Content-Disposition": `attachment; filename="${kind}-${entry.anonCode}.${ext}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof AccessError) return new Response("Não encontrado.", { status: 404 });
    throw e;
  }
}
