import type { Brand } from "@/lib/branding";

export function BrandLogo({ brand, size = "md" }: { brand: Brand; size?: "md" | "lg" }) {
  const h = size === "lg" ? "h-14" : "h-9";
  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- logos de clientes vêm de domínios variados
    return <img src={brand.logoUrl} alt={brand.name} className={`${h} w-auto`} />;
  }
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold ${size === "lg" ? "text-3xl" : "text-xl"}`}>
      <span aria-hidden className="grid grid-cols-2 gap-0.5">
        <span className="size-2.5 rounded-sm bg-brand" />
        <span className="size-2.5 rounded-sm bg-brand-2" />
        <span className="size-2.5 rounded-sm bg-brand-2" />
        <span className="size-2.5 rounded-sm bg-brand" />
      </span>
      {brand.name}
    </span>
  );
}

export function PoweredBy({ brand }: { brand: Brand }) {
  if (!brand.whiteLabel || !brand.showPlatformBrand) return null;
  return <p className="text-xs text-black/40">com tecnologia {process.env.PLATFORM_NAME ?? "Blocos"}</p>;
}
