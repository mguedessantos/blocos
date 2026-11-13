import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBrand } from "@/lib/branding";
import { requireUser } from "@/lib/dal/auth";
import { guidesFor } from "@/lib/manual";
import { buildManualPdf } from "@/lib/manual-pdf";

export async function GET(req: Request) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN", "JUDGE", "SUPER_ADMIN"]);
  const wanted = new URL(req.url).searchParams.get("guia");
  const guides = guidesFor(user.role);
  const guide = guides.find((g) => g.slug === wanted) ?? guides[0];
  const brand = await getBrand();

  // As capturas são arquivos de public/manual (incluídos na função pelo next.config); ids vêm do conteúdo ([a-z0-9-]).
  const image = async (id: string) => {
    try {
      return new Uint8Array(await readFile(join(process.cwd(), "public", "manual", `${id}.png`)));
    } catch {
      return null;
    }
  };
  const pdf = await buildManualPdf(guide, { brandName: brand.name, primary: brand.primary, image });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="manual-${guide.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
