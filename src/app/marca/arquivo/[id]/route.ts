import { IMAGE_TYPES, sniffImage } from "@/lib/brand-assets";
import { getFile } from "@/lib/storage";

/** Logo/favicon das escolas. Público (aparece na tela de login), com nome aleatório e cache longo. */
export async function GET(_: Request, ctx: RouteContext<"/marca/arquivo/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Não encontrado.", { status: 404 });
  let bytes: Uint8Array;
  try {
    bytes = await getFile(`marca/${id}`);
  } catch {
    return new Response("Não encontrado.", { status: 404 });
  }
  const kind = sniffImage(bytes);
  if (!kind) return new Response("Não encontrado.", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": IMAGE_TYPES[kind],
      "Cache-Control": "public, max-age=31536000, immutable", // cada upload tem um id novo
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
