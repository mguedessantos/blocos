import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/dal/auth";
import { guidesFor, inlineParts, parseBlocks, type Block } from "@/lib/manual";
import { ManualSearch } from "./search";

export const metadata = { title: "Manual" };

export default async function GuidePage({ params }: PageProps<"/manual/[guia]">) {
  const user = await requireUser(["TEACHER", "ORG_ADMIN", "JUDGE", "SUPER_ADMIN"]);
  const { guia } = await params;
  const guides = guidesFor(user.role);
  const guide = guides.find((g) => g.slug === guia);
  if (!guide) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{guide.title}</h1>
          <p className="font-semibold text-muted">{guide.intro}</p>
        </div>
        <a href={`/manual/pdf?guia=${guide.slug}`} className={buttonClass("secondary", "md")}>
          <Download aria-hidden className="h-5 w-5" /> Baixar PDF
        </a>
      </header>

      {guides.length > 1 && (
        <nav aria-label="Guias" className="flex flex-wrap gap-2">
          {guides.map((g) => (
            <Link key={g.slug} href={`/manual/${g.slug}`} aria-current={g.slug === guide.slug ? "page" : undefined}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-extrabold ${g.slug === guide.slug ? "border-brand bg-brand text-brand-text" : "border-line hover:bg-black/5"}`}>
              {g.title}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="clay space-y-3 p-4 lg:sticky lg:top-24">
          <ManualSearch />
          <nav aria-label="Sumário">
            <ol className="space-y-1 text-sm font-bold">
              {guide.chapters.map((c, i) => (
                <li key={c.slug} data-capitulo={c.slug}>
                  <a href={`#${c.slug}`} className="block rounded-lg px-2 py-1 hover:bg-black/5">{i + 1}. {c.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="space-y-6">
          {guide.chapters.map((c, i) => (
            <section key={c.slug} id={c.slug} data-capitulo={c.slug} className="clay scroll-mt-24 space-y-4 p-6">
              <h2 className="text-2xl font-extrabold">{i + 1}. {c.title}</h2>
              {parseBlocks(c.body).map((b, j) => <BlockView key={j} b={b} chapter={c.slug} />)}
            </section>
          ))}
          <p id="sem-resultados" hidden className="clay p-6 text-center font-semibold text-muted">Nenhum capítulo encontrado.</p>
        </div>
      </div>
    </div>
  );
}

function Inline({ text }: { text: string }) {
  return inlineParts(text).map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <Fragment key={i}>{p.text}</Fragment>));
}

function BlockView({ b, chapter }: { b: Block; chapter: string }) {
  switch (b.t) {
    case "h2":
      return <h3 id={`${chapter}-${b.id}`} className="scroll-mt-24 pt-2 text-xl font-extrabold">{b.text}</h3>;
    case "h3":
      return <h4 id={`${chapter}-${b.id}`} className="scroll-mt-24 text-lg font-extrabold">{b.text}</h4>;
    case "p":
      return <p className="leading-relaxed"><Inline text={b.text} /></p>;
    case "ul":
    case "ol": {
      const L = b.t;
      return <L className={`space-y-1 pl-6 leading-relaxed ${L === "ol" ? "list-decimal" : "list-disc"}`}>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</L>;
    }
    case "img":
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- capturas estáticas em public/manual */}
          <img src={`/manual/${b.id}.png`} alt={b.alt} loading="lazy" className="w-full rounded-2xl border-2 border-line" />
          <figcaption className="text-center text-sm font-semibold text-muted">{b.alt}</figcaption>
        </figure>
      );
    case "callout":
      return (
        <div role="note" className={`rounded-2xl border-2 p-4 ${b.kind === "atencao" ? "border-cta bg-cta/10" : "border-go bg-go/10"}`}>
          <strong>{b.kind === "atencao" ? "Atenção: " : "Dica: "}</strong><Inline text={b.text} />
        </div>
      );
  }
}
