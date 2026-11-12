"use client";

import { CircleAlert, CircleCheck, Star } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { contrastRatio, isAcceptableBrandColor, isAcceptablePrimaryColor, isHexColor, readableTextOn } from "@/lib/color";
import { saveBrandingAction, type BrandState } from "./actions";

type Initial = {
  displayName: string; primaryColor: string; secondaryColor: string; emailSenderName: string; supportEmail: string;
  hidePlatformBrand: boolean; logoUrl: string | null; faviconUrl: string | null; orgName: string; platformName: string;
};

const PRESETS = ["#6d28d9", "#0f766e", "#1d4ed8", "#b91c1c", "#c2410c", "#15803d", "#be185d", "#334155"];
const PRESETS_2 = ["#f59e0b", "#facc15", "#38bdf8", "#4ade80", "#fb7185", "#a78bfa"];

function ColorField({ label, name, value, onChange, presets, onWhite }: { label: string; name: string; value: string; onChange: (v: string) => void; presets: string[]; onWhite?: boolean }) {
  const valid = isHexColor(value);
  const ok = valid && (onWhite ? isAcceptablePrimaryColor(value) : isAcceptableBrandColor(value));
  // a principal é medida contra o fundo branco; a de destaque, contra o texto que vai sobre ela
  const ratio = valid ? (onWhite ? Math.min(contrastRatio(value, "#ffffff"), contrastRatio(value, readableTextOn(value))) : contrastRatio(value, readableTextOn(value))) : 0;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`${label}: seletor`} className="h-12 w-14 cursor-pointer rounded-xl border-2 border-line bg-white p-1" />
        <input name={name} value={value} onChange={(e) => onChange(e.target.value.trim().toLowerCase())} aria-label={`${label} (hex)`} maxLength={7} className="min-h-12 w-32 rounded-2xl border-2 border-line bg-white px-3 font-mono font-bold uppercase" />
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${ok ? "text-green-700" : "text-red-700"}`}>
          {ok ? <CircleCheck aria-hidden className="h-4 w-4" /> : <CircleAlert aria-hidden className="h-4 w-4" />}
          {valid ? `contraste ${ratio.toFixed(1)}:1 ${ok ? "— legível" : "— pouco legível"}` : "use #RRGGBB"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} className="h-7 w-7 rounded-lg ring-2 ring-line ring-offset-1" style={{ background: c }} aria-label={`Usar ${c}`} />
        ))}
      </div>
    </fieldset>
  );
}

export function BrandEditor({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<BrandState, FormData>(saveBrandingAction, undefined);
  const [name, setName] = useState(initial.displayName);
  const [primary, setPrimary] = useState(initial.primaryColor);
  const [secondary, setSecondary] = useState(initial.secondaryColor);
  const [hide, setHide] = useState(initial.hidePlatformBrand);
  const [logo, setLogo] = useState<string | null>(initial.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);

  const p = isHexColor(primary) ? primary : "#6d28d9";
  const s = isHexColor(secondary) ? secondary : "#f59e0b";
  const shown = name.trim() || initial.orgName;

  function pickLogo(f: File | undefined) {
    if (logo?.startsWith("blob:")) URL.revokeObjectURL(logo);
    setLogo(f ? URL.createObjectURL(f) : initial.logoUrl);
    setRemoveLogo(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form action={action} className="space-y-5">
        <Input label="Nome exibido (no topo e na aba do navegador)" name="displayName" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={initial.orgName} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ColorField label="Cor principal" name="primaryColor" value={primary} onChange={setPrimary} presets={PRESETS} onWhite />
          <ColorField label="Cor de destaque" name="secondaryColor" value={secondary} onChange={setSecondary} presets={PRESETS_2} />
        </div>
        <p className="text-xs font-semibold text-muted">As cores dos blocos de programação não mudam: as crianças aprendem por elas.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Logo (PNG ou JPG, até 1 MB)
            <input type="file" name="logo" accept="image/png,image/jpeg" onChange={(e) => pickLogo(e.target.files?.[0])} className="text-sm file:mr-2 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-extrabold" />
            {initial.logoUrl && (
              <span className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" name="logoRemove" checked={removeLogo} onChange={(e) => { setRemoveLogo(e.target.checked); if (e.target.checked) setLogo(null); else setLogo(initial.logoUrl); }} /> Remover o logo atual
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Ícone da aba (favicon, PNG quadrado)
            <input type="file" name="favicon" accept="image/png,image/jpeg" className="text-sm file:mr-2 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-extrabold" />
            {initial.faviconUrl && <span className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" name="faviconRemove" /> Remover o ícone atual</span>}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome do remetente dos emails" name="emailSenderName" defaultValue={initial.emailSenderName} maxLength={60} placeholder={shown} />
          <Input label="Email de suporte (resposta dos emails)" name="supportEmail" type="email" defaultValue={initial.supportEmail} placeholder="contato@suaescola.com.br" />
        </div>

        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" name="hidePlatformBrand" checked={hide} onChange={(e) => setHide(e.target.checked)} className="mt-1" />
          <span>Esconder “com tecnologia {initial.platformName}” do rodapé</span>
        </label>

        {state?.error && <Alert>{state.error}</Alert>}
        {state?.ok && <p role="status" className="font-bold text-green-700">{state.ok}</p>}
        <Button disabled={pending}>{pending ? "Salvando..." : "Salvar marca"}</Button>
      </form>

      <aside aria-label="Pré-visualização" className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-extrabold uppercase tracking-wider text-muted">Pré-visualização</p>
        <div className="overflow-hidden rounded-3xl border-2 border-line bg-[#f7f5ff] shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b-2 border-line bg-white px-3 py-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) do arquivo escolhido
              <img src={logo} alt={shown} className="h-8 w-auto max-w-[9rem] object-contain" />
            ) : (
              <span className="flex items-center gap-1.5 font-display font-extrabold">
                <span aria-hidden className="grid grid-cols-2 gap-0.5">
                  <span className="size-2 rounded-sm" style={{ background: p }} /><span className="size-2 rounded-sm" style={{ background: s }} />
                  <span className="size-2 rounded-sm" style={{ background: s }} /><span className="size-2 rounded-sm" style={{ background: p }} />
                </span>
                {shown}
              </span>
            )}
            <span className="rounded-lg px-2 py-1 text-xs font-extrabold" style={{ background: `color-mix(in srgb, ${p} 14%, white)`, color: p }}>Minhas trilhas</span>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_0_rgb(15_23_42/0.08)]">
              <p className="font-display text-xl font-extrabold">Olá, Ana!</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1 text-sm font-extrabold" style={{ background: s, color: readableTextOn(s) }}>
                <Star aria-hidden className="h-4 w-4" /> 120 XP
              </span>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_0_rgb(15_23_42/0.08)]">
              <p className="text-xs font-extrabold uppercase text-muted">Mundo 1</p>
              <p className="font-extrabold">Vila do Palco</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10"><div className="h-full w-3/5 rounded-full" style={{ background: p }} /></div>
              <span className="mt-3 inline-block rounded-xl px-4 py-2 text-sm font-extrabold shadow-[0_3px_0_rgb(15_23_42/0.25)]" style={{ background: p, color: readableTextOn(p) }}>Continuar</span>
            </div>
          </div>
          {!hide && <p className="pb-3 text-center text-[11px] text-black/40">com tecnologia {initial.platformName}</p>}
        </div>
      </aside>
    </div>
  );
}
