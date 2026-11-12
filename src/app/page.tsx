import { billingEnabled } from "@/lib/billing/entitlements";
import { Bot, CircleCheck, Gamepad2, GraduationCap, Map as MapIcon, School, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { buttonClass } from "@/components/ui";
import { getBrand } from "@/lib/branding";
import { getCurrentUser } from "@/lib/dal/auth";
import { ROLE_HOME } from "@/lib/roles";
import { getTenant } from "@/lib/tenant";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const [tenant, brand] = await Promise.all([getTenant(), getBrand()]);
  const billing = billingEnabled();

  // Domínio de uma escola: só a escolha de entrada, com a marca dela.
  if (tenant) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
        <BrandLogo brand={brand} size="lg" />
        <h1 className="text-3xl font-extrabold sm:text-4xl">Quem vai programar hoje?</h1>
        <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          <ChoiceCard href="/entrar-aluno" icon={Gamepad2} title="Sou aluno(a)" text="Entre com o código da turma" color="var(--brand-primary)" />
          <ChoiceCard href="/entrar?perfil=equipe" icon={GraduationCap} title="Sou professor(a)" text="Turmas, alunos e progresso" color="#0F172A" />
        </div>
        <PoweredBy brand={brand} />
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <BrandLogo brand={brand} />
        <nav aria-label="Principal" className="flex items-center gap-2 text-sm font-extrabold">
          {billing && <Link href="/precos" className="hidden rounded-xl px-3 py-2 hover:bg-black/5 sm:block">Preços</Link>}
          <Link href="/entrar" className="rounded-xl px-3 py-2 hover:bg-black/5">Entrar</Link>
          <Link href="/cadastro" className={buttonClass("primary", "sm")}>{billing ? "Teste grátis" : "Criar conta"}</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-sm font-extrabold text-brand-shadow">
              <Sparkles aria-hidden className="h-4 w-4" /> Para escolas e professores
            </span>
            <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">
              Programação em blocos para crianças
            </h1>
            <p className="max-w-xl text-lg font-semibold text-muted">
              Trilhas de aprendizado, exercícios corrigidos automaticamente e game jams com jurados.
              Tudo em português, no navegador, sem instalar nada.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cadastro" className={buttonClass("primary", "md", "px-7 text-lg")}>{billing ? "Testar grátis por 14 dias" : "Criar conta grátis"}</Link>
              {billing && <Link href="/precos" className={buttonClass("secondary", "md", "px-7 text-lg")}>Ver preços</Link>}
            </div>
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-muted">
              {[billing ? "Sem cartão para testar" : "Grátis", "Alunos sem e-mail (LGPD)", "Compatível com Scratch"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CircleCheck aria-hidden className="h-4 w-4 text-green-600" /> {t}</span>
              ))}
            </p>
          </div>
          <HeroIllustration />
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            <Feature icon={MapIcon} color="#4C97FF" title="Trilhas passo a passo" text="Do primeiro bloco aos jogos completos: lições curtas, exemplos e desafios com estrelas e XP." />
            <Feature icon={Bot} color="#59C059" title="Correção automática" text="O aluno clica em Verificar e recebe dicas amigáveis na hora. O professor vê quem precisa de ajuda." />
            <Feature icon={Trophy} color="#FFAB19" title="Game jams com jurados" text="Competições por turma, escola ou entre escolas, com critérios, notas e feedback para os alunos." />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="clay flex flex-col items-center gap-5 bg-brand p-10 text-center text-brand-text sm:flex-row sm:text-left" style={{ background: "var(--brand-primary)" }}>
            <School aria-hidden className="h-14 w-14 shrink-0" />
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold">Sua escola com a sua marca</h2>
              <p className="font-semibold opacity-90">No plano Escola+, a plataforma usa o logo, as cores e o domínio da sua escola.</p>
            </div>
            <Link href="/cadastro" className="btn btn-secondary px-7 text-lg">Começar agora</Link>
          </div>
        </section>
      </main>

      <footer className="flex justify-center gap-6 p-6 text-sm font-bold text-muted">
        <Link href="/termos" className="hover:text-foreground">Termos de Uso</Link>
        <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
        <Link href="/entrar-aluno" className="hover:text-foreground">Entrar como aluno</Link>
      </footer>
    </div>
  );
}

function ChoiceCard({ href, icon: Icon, title, text, color }: { href: string; icon: LucideIcon; title: string; text: string; color: string }) {
  return (
    <Link href={href} className="clay clay-hover flex flex-col items-center gap-3 p-8">
      <span className="grid h-20 w-20 place-items-center rounded-3xl text-white shadow-[0_5px_0_rgb(15_23_42/0.2)]" style={{ background: color }} aria-hidden>
        <Icon className="h-10 w-10" />
      </span>
      <span className="font-display text-2xl font-extrabold">{title}</span>
      <span className="font-semibold text-muted">{text}</span>
    </Link>
  );
}

function Feature({ icon: Icon, color, title, text }: { icon: LucideIcon; color: string; title: string; text: string }) {
  return (
    <article className="clay p-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[0_4px_0_rgb(15_23_42/0.2)]" style={{ background: color }} aria-hidden>
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
      <p className="mt-1 font-semibold text-muted">{text}</p>
    </article>
  );
}

/** Ilustração em CSS: uma pilha de blocos no estilo do editor, ao lado do palco. */
function HeroIllustration() {
  const block = "w-fit rounded-xl px-4 py-2.5 font-extrabold text-white shadow-[0_3px_0_rgb(15_23_42/0.25)]";
  return (
    <div className="clay relative grid grid-cols-[1.1fr_1fr] gap-4 p-5" aria-hidden>
      <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4">
        <div className={`${block} rounded-t-3xl`} style={{ background: "#FFBF00" }}>quando 🏁 for clicado</div>
        <div className={`${block} ml-0`} style={{ background: "#0FBD8C" }}>abaixar a caneta</div>
        <div className="w-fit rounded-xl px-0 pb-1.5" style={{ background: "#FFAB19" }}>
          <div className="px-4 py-2.5 font-extrabold text-white">repita 4 vezes</div>
          <div className="ml-4 space-y-1.5 rounded-l-xl bg-slate-50 py-1.5 pl-1.5">
            <div className={block} style={{ background: "#4C97FF" }}>mover 100 passos</div>
            <div className={block} style={{ background: "#4C97FF" }}>girar ↻ 90 graus</div>
          </div>
        </div>
      </div>
      <div className="relative grid place-items-center rounded-2xl bg-white ring-2 ring-line">
        <div className="h-24 w-24 border-4 border-blue-600" />
        <div className="absolute grid h-12 w-12 place-items-center rounded-xl border-[3px] border-orange-900 bg-orange-400" style={{ top: "calc(50% - 72px)", left: "calc(50% + 24px)" }}>
          <div className="flex gap-1"><span className="h-3 w-3 rounded-full bg-white" /><span className="h-3 w-3 rounded-full bg-white" /></div>
        </div>
        <div className="absolute -bottom-4 right-4 flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 font-display font-extrabold shadow-[0_3px_0_rgb(15_23_42/0.2)]">
          ★★★ +30 XP
        </div>
      </div>
    </div>
  );
}
