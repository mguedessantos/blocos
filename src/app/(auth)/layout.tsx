import Link from "next/link";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { getBrand } from "@/lib/branding";

// Entrada da plataforma com o tema "Noite estrelada" (o mesmo da área do aluno).
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  return (
    <main className="tema-noite flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="rounded-xl"><BrandLogo brand={brand} size="lg" /></Link>
      <div className="w-full max-w-md">{children}</div>
      <PoweredBy brand={brand} />
    </main>
  );
}
