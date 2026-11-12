import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal/auth";
import { AccessError } from "@/lib/dal/classes";
import { submitSb3Attempt } from "@/lib/dal/lessons";
import { MAX_SB3_BYTES } from "@/lib/sb3/project";

// Envio do .sb3 de uma missão. Route handler (e não server action) porque projetos podem ter vários MB.
export async function POST(request: Request, ctx: RouteContext<"/api/licoes/[id]/sb3">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return Response.json({ ok: false, error: "Entre como aluno(a) para enviar." }, { status: 401 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_SB3_BYTES + 64 * 1024) return Response.json({ ok: false, error: "O arquivo é grande demais (máximo 25 MB)." }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("arquivo");
  } catch {
    return Response.json({ ok: false, error: "Não recebi o arquivo. Tente de novo." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ ok: false, error: "Escolha o arquivo .sb3 do seu projeto." }, { status: 400 });
  if (!/\.sb3$/i.test(file.name)) return Response.json({ ok: false, error: "O arquivo precisa terminar em .sb3. No PictoBlox, use Arquivo → Salvar no seu computador." }, { status: 400 });
  if (file.size > MAX_SB3_BYTES) return Response.json({ ok: false, error: "O arquivo é grande demais (máximo 25 MB)." }, { status: 413 });

  const { id } = await ctx.params;
  try {
    const r = await submitSb3Attempt(user, id, new Uint8Array(await file.arrayBuffer()));
    if (!r.ok) return Response.json(r, { status: 422 });
    revalidatePath("/aluno", "layout");
    const { passed, stars, summary, items } = r.result;
    return Response.json({ ok: true, passed, stars, summary, items, xpGained: r.xpGained });
  } catch (err) {
    if (err instanceof AccessError) return Response.json({ ok: false, error: err.message }, { status: 404 });
    throw err;
  }
}
