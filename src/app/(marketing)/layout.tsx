import { billingEnabled } from "@/lib/billing/entitlements";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/ui";
import { getBrand } from "@/lib/branding";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-line bg-white/90 px-6 py-3 backdrop-blur">
        <Link href="/"><BrandLogo brand={brand} /></Link>
        <nav aria-label="Principal" className="flex items-center gap-2 text-sm font-extrabold">
          {billingEnabled() && <Link href="/precos" className="rounded-xl px-3 py-2 hover:bg-black/5">Preços</Link>}
          <Link href="/entrar" className="rounded-xl px-3 py-2 hover:bg-black/5">Entrar</Link>
          <Link href="/cadastro" className={buttonClass("primary", "sm")}>{billingEnabled() ? "Teste grátis" : "Criar conta"}</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <footer className="flex justify-center gap-6 p-6 text-sm font-bold text-muted">
        <Link href="/termos">Termos de Uso</Link>
        <Link href="/privacidade">Privacidade</Link>
      </footer>
    </div>
  );
}
