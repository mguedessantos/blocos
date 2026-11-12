import { buildCertificate } from "@/lib/certificate";
import { getCurrentUser } from "@/lib/dal/auth";
import { getCertificate } from "@/lib/dal/certificates";
import { AccessError } from "@/lib/dal/classes";

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** PDF do certificado: /certificados/<trilha> (aluno) ou ?aluno=<id> (professor/coordenação). */
export async function GET(req: Request, ctx: RouteContext<"/certificados/[trackId]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login.", { status: 401 });
  const { trackId } = await ctx.params;
  const studentId = new URL(req.url).searchParams.get("aluno") ?? undefined;
  try {
    const data = await getCertificate(user, trackId, studentId);
    const pdf = await buildCertificate(data);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${slug(data.trackTitle)}-${slug(data.studentName)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof AccessError) return new Response(e.message, { status: 404 });
    throw e;
  }
}
