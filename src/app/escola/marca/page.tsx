import { Globe, Palette } from "lucide-react";
import Link from "next/link";
import { buttonClass, Card, PageHeader } from "@/components/ui";
import { billingEnabled } from "@/lib/billing/entitlements";
import { requireUser } from "@/lib/dal/auth";
import { getBrandingSettings } from "@/lib/dal/branding";
import { A_TARGET, CNAME_TARGET } from "@/lib/domain-rules";
import { vercelEnabled } from "@/lib/domains";
import { tenantUrl } from "@/lib/url";
import { BrandEditor } from "./brand-editor";
import { AddDomainForm, DomainActions } from "./domain-forms";

export const metadata = { title: "Marca da escola" };

const STATUS = {
  PENDENTE: { text: "Aguardando DNS", cls: "bg-amber-100 text-amber-900" },
  VERIFICADO: { text: "Ativo", cls: "bg-green-100 text-green-900" },
  ERRO: { text: "DNS mudou — verifique", cls: "bg-red-100 text-red-900" },
} as const;

export default async function MarcaPage() {
  const user = await requireUser(["ORG_ADMIN"]);
  const { org, entitled, branding: b, domains } = await getBrandingSettings(user);
  const platformName = process.env.PLATFORM_NAME ?? "Blocos";
  const custom = domains.filter((d) => d.type === "CUSTOM");

  return (
    <div className="space-y-6">
      <PageHeader icon={<Palette className="h-7 w-7" />} title="Marca da escola" subtitle="Logo, cores, nome e domínio próprio: o site, os emails e os certificados ficam com a cara da sua escola." />

      {!entitled ? (
        <Card className="space-y-3">
          <p className="text-lg font-extrabold">A marca própria faz parte do plano Escola+.</p>
          <p className="text-muted">Com ele, alunos e professores entram num site com o logo, as cores e o endereço da escola, e os certificados saem com a sua marca.</p>
          {billingEnabled() && <Link href="/escola/assinatura" className={buttonClass()}>Ver planos</Link>}
        </Card>
      ) : (
        <>
          <Card>
            <BrandEditor
              initial={{
                displayName: b?.displayName ?? "", primaryColor: b?.primaryColor ?? "#6d28d9", secondaryColor: b?.secondaryColor ?? "#f59e0b",
                emailSenderName: b?.emailSenderName ?? "", supportEmail: b?.supportEmail ?? "", hidePlatformBrand: b?.hidePlatformBrand ?? false,
                logoUrl: b?.logoUrl ?? null, faviconUrl: b?.faviconUrl ?? null, orgName: org.name, platformName,
              }}
            />
          </Card>

          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-extrabold"><Globe aria-hidden className="h-5 w-5 text-brand" /> Endereço do site</h2>
            <p className="text-sm">
              Endereço incluído: <a href={tenantUrl(org.slug)} className="font-bold text-brand underline">{tenantUrl(org.slug).replace(/^https?:\/\//, "")}</a>
            </p>

            <ul className="space-y-3">
              {custom.map((d) => {
                const st = STATUS[d.status];
                return (
                  <li key={d.id} className="space-y-3 rounded-2xl border-2 border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-lg font-extrabold">{d.hostname}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${st.cls}`}>{st.text}</span>
                    </div>
                    {d.status !== "VERIFICADO" && (
                      <div className="rounded-xl bg-black/[0.03] p-3 text-sm">
                        <p className="mb-2 font-bold">No painel de DNS do seu domínio, crie este registro:</p>
                        <table className="w-full text-left font-mono text-xs sm:text-sm">
                          <thead className="text-muted"><tr><th>Tipo</th><th>Nome</th><th>Valor</th></tr></thead>
                          <tbody>
                            <tr><td>CNAME</td><td>{d.hostname.split(".")[0]}</td><td>{CNAME_TARGET}</td></tr>
                          </tbody>
                        </table>
                        <p className="mt-2 text-xs text-muted">Se for o domínio principal (sem “codigo.” na frente), use um registro A apontando para {A_TARGET}. A mudança pode levar algumas horas para valer.{vercelEnabled() ? " O certificado de segurança (https) é emitido automaticamente." : ""}</p>
                      </div>
                    )}
                    <DomainActions id={d.id} />
                  </li>
                );
              })}
            </ul>
            {custom.length < 2 && <AddDomainForm />}
          </Card>
        </>
      )}
    </div>
  );
}
