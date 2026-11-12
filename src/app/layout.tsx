import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Nunito } from "next/font/google";
import { getBrand } from "@/lib/branding";
import "./globals.css";

// A marca depende do domínio acessado (white-label), então todas as rotas são renderizadas por requisição.
export const instant = false;

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description: "Aprenda programação em blocos brincando: trilhas, desafios e game jams.",
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  const style = {
    "--brand-primary": brand.primary,
    "--brand-primary-text": brand.primaryText,
    "--brand-secondary": brand.secondary,
  } as CSSProperties;

  return (
    <html lang="pt-BR" style={style} className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
