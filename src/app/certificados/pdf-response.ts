import { buildCertificate, type CertificateData } from "@/lib/certificate";
import { getCurrentUser, type CurrentUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** PDF do certificado; ?aluno=<id> para professor/coordenação. */
export async function certificateResponse(req: Request, load: (user: CurrentUser, studentId?: string) => Promise<CertificateData>) {
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login.", { status: 401 });
  const studentId = new URL(req.url).searchParams.get("aluno") ?? undefined;
  try {
    const data = await load(user, studentId);
    const pdf = await buildCertificate(data);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${slug(data.title)}-${slug(data.studentName)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof AccessError) return new Response(e.message, { status: 404 });
    throw e;
  }
}
