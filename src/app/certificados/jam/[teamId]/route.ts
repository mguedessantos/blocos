import { getJamCertificate } from "@/lib/dal/certificates";
import { certificateResponse } from "../../pdf-response";

/** /certificados/jam/<equipe>: participação na Game Jam. */
export async function GET(req: Request, ctx: RouteContext<"/certificados/jam/[teamId]">) {
  const { teamId } = await ctx.params;
  return certificateResponse(req, (user, studentId) => getJamCertificate(user, teamId, studentId));
}
