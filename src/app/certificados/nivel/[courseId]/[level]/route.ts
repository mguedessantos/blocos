import { getLevelCertificate } from "@/lib/dal/certificates";
import { certificateResponse } from "../../../pdf-response";

/** /certificados/nivel/<curso>/<1|2|3>: conclusão do nível Básico, Intermediário ou Avançado. */
export async function GET(req: Request, ctx: RouteContext<"/certificados/nivel/[courseId]/[level]">) {
  const { courseId, level } = await ctx.params;
  return certificateResponse(req, (user, studentId) => getLevelCertificate(user, courseId, Number(level), studentId));
}
