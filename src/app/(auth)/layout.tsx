import Link from "next/link";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { getBrand } from "@/lib/branding";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand/10 to-transparent p-6">
      <Link href="/"><BrandLogo brand={brand} size="lg" /></Link>
      <div className="w-full max-w-sm">{children}</div>
      <PoweredBy brand={brand} />
    </main>
  );
}
