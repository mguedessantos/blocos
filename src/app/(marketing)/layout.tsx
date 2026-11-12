import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { getBrand } from "@/lib/branding";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-3">
        <Link href="/"><BrandLogo brand={brand} /></Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/precos" className="hover:text-brand">Preços</Link>
          <Link href="/entrar" className="hover:text-brand">Entrar</Link>
          <Link href="/cadastro" className="rounded-xl bg-brand px-4 py-2 text-brand-text">Teste grátis</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      <footer className="flex justify-center gap-4 p-6 text-sm text-black/50">
        <Link href="/termos">Termos de Uso</Link>
        <Link href="/privacidade">Privacidade</Link>
      </footer>
    </div>
  );
}
