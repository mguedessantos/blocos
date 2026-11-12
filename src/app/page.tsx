import { billingEnabled } from "@/lib/billing/entitlements";
import { ArrowRight, CircleCheck, Gamepad2, GraduationCap, Palette, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { Island } from "@/components/island";
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
      <main className="tema-noite flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
        <BrandLogo brand={brand} size="lg" />
        <Island index={1} className="flutua h-32 w-auto" />
        <h1 className="text-3xl font-extrabold sm:text-4xl">Quem vai programar hoje?</h1>
        <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          <ChoiceCard href="/entrar" icon={Gamepad2} title="Sou aluno(a)" text="Entre com o código da turma" tone="cta" />
          <ChoiceCard href="/entrar?perfil=equipe" icon={GraduationCap} title="Sou professor(a)" text="Turmas, alunos e progresso" tone="star" />
        </div>
        <PoweredBy brand={brand} />
      </main>
    );
  }

  return (
    <div className="tema-noite flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-[var(--nav-bg)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <BrandLogo brand={brand} />
          <nav aria-label="Principal" className="flex items-center gap-2 text-sm font-extrabold">
            {billing && <Link href="/precos" className="hidden rounded-xl px-3 py-2 hover:bg-white/5 sm:block">Preços</Link>}
            <Link href="/entrar" className="rounded-xl px-3 py-2 hover:bg-white/5">Entrar</Link>
            <Link href="/cadastro" className={buttonClass("primary", "sm")}>{billing ? "Teste grátis" : "Criar conta"}</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: uma promessa, uma ação, um visual */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="space-y-7">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-star">Para escolas e professores</p>
            <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl">
              Dez mundos de blocos, do primeiro passo à <span className="text-star">game jam</span>.
            </h1>
            <p className="max-w-xl text-lg font-semibold text-muted">
              Seus alunos programam no navegador, recebem estrelas na hora e levam os projetos para o PictoBlox.
              Você acompanha a turma inteira num mapa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cadastro" className={buttonClass("primary", "md", "btn-cta px-7 text-lg")}>
                {billing ? "Testar grátis por 14 dias" : "Criar conta grátis"} <ArrowRight aria-hidden className="h-5 w-5" />
              </Link>
              <Link href="/entrar" className={buttonClass("secondary", "md", "px-7 text-lg")}>Sou aluno(a)</Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-muted">
              {[billing ? "Sem cartão para testar" : "Grátis para começar", "Alunos sem e-mail (LGPD)", "Projetos .sb3 do PictoBlox e Scratch"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><CircleCheck aria-hidden className="h-4 w-4 text-go" /> {t}</li>
              ))}
            </ul>
          </div>
          <HeroWorlds />
        </section>

        {/* Como funciona: três passos, cada um mostrado, não descrito */}
        <section aria-labelledby="como" className="mx-auto max-w-6xl px-6 py-16">
          <h2 id="como" className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Como a turma avança</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            <Step n={1} title="Escolhe um mundo" text="Cada mundo é uma ilha com lições curtas, do básico ao avançado.">
              <div className="flex items-end justify-center gap-1">
                <div className="relative"><span className="faixa absolute -left-2 top-0 z-10 !text-[0.65rem]">Concluído</span><Island index={1} className="h-24 w-auto" /></div>
                <Island index={2} className="h-28 w-auto" />
                <Island index={3} className="h-24 w-auto opacity-70" />
              </div>
            </Step>
            <Step n={2} title="Monta os blocos" text="Executa, vê o personagem no palco e clica em Verificar para ganhar estrelas.">
              <BlockStack small />
            </Step>
            <Step n={3} title="Cria um jogo e compete" text="Equipes da mesma faixa de ano escolar disputam game jams com julgamento às cegas.">
              <Podium />
            </Step>
          </ol>
        </section>

        {/* Números reais do curso */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["10", "mundos no curso"],
              ["3", "níveis: básico, intermediário e avançado"],
              ["2º ao 9º", "ano escolar nas game jams"],
              ["0", "instalações: tudo no navegador"],
            ].map(([v, l]) => (
              <div key={l} className="clay p-5">
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-4xl font-extrabold text-star">{v}</dd>
                <dd className="mt-1 text-sm font-bold text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Marca da escola */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="clay flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:p-10 sm:text-left">
            <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-star text-night"><Palette className="h-8 w-8" /></span>
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold">O site com a cara da sua escola</h2>
              <p className="font-semibold text-muted">No plano Escola+, alunos e professores entram com o logo, as cores e o endereço da escola. Os certificados também.</p>
            </div>
            <Link href="/cadastro" className={buttonClass("primary", "md", "btn-cta px-7 text-lg")}>Começar agora</Link>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap justify-center gap-6 border-t-2 border-line p-6 text-sm font-bold text-muted">
        <Link href="/termos" className="hover:text-foreground">Termos de Uso</Link>
        <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
        <Link href="/entrar" className="hover:text-foreground">Entrar como aluno</Link>
      </footer>
    </div>
  );
}

function ChoiceCard({ href, icon: Icon, title, text, tone }: { href: string; icon: LucideIcon; title: string; text: string; tone: "cta" | "star" }) {
  return (
    <Link href={href} className="clay clay-hover flex flex-col items-center gap-3 p-8">
      <span className={`grid h-20 w-20 place-items-center rounded-3xl text-night shadow-[0_5px_0_rgb(0_0_0/0.35)] ${tone === "cta" ? "bg-cta" : "bg-star"}`} aria-hidden>
        <Icon className="h-10 w-10" />
      </span>
      <span className="font-display text-2xl font-extrabold">{title}</span>
      <span className="font-semibold text-muted">{text}</span>
    </Link>
  );
}

function Step({ n, title, text, children }: { n: number; title: string; text: string; children: ReactNode }) {
  return (
    <li className="clay flex flex-col gap-4 p-6">
      <div className="grid h-56 place-items-center overflow-hidden rounded-2xl bg-black/25 p-3" aria-hidden>{children}</div>
      <div className="flex items-start gap-3">
        <span className="hexa shrink-0 bg-[#7a55f5] !h-11 !w-10 !text-lg text-white" aria-hidden>{n}</span>
        <div>
          <h3 className="text-xl font-extrabold">{title}</h3>
          <p className="mt-1 font-semibold text-muted">{text}</p>
        </div>
      </div>
    </li>
  );
}

/** Pilha de blocos no estilo do editor (cores das categorias). */
function BlockStack({ small = false }: { small?: boolean }) {
  const pad = small ? "px-3 py-1.5 text-sm" : "px-4 py-2.5";
  const b = `w-fit rounded-xl font-extrabold text-white shadow-[0_3px_0_rgb(0_0_0/0.3)] ${pad}`;
  return (
    <div className="space-y-1.5" aria-hidden>
      <div className={`${b} rounded-t-3xl`} style={{ background: "#FFBF00" }}>quando a bandeira for clicada</div>
      <div className="w-fit rounded-xl pb-1.5" style={{ background: "#FFAB19" }}>
        <div className={`font-extrabold text-white ${pad}`}>repita 4 vezes</div>
        <div className="ml-4 space-y-1.5 rounded-l-xl bg-[#ebe7fb] py-1.5 pl-1.5">
          <div className={b} style={{ background: "#4C97FF" }}>mover 100 passos</div>
          <div className={b} style={{ background: "#4C97FF" }}>girar 90 graus</div>
        </div>
      </div>
      <div className={b} style={{ background: "#9966FF" }}>diga Consegui!</div>
    </div>
  );
}

function Podium() {
  const places: [string, string, string][] = [["2", "h-14", "bg-[#b9b2e6]"], ["1", "h-20", "bg-star"], ["3", "h-10", "bg-cta"]];
  return (
    <div className="flex items-end gap-2" aria-hidden>
      {places.map(([n, h, c]) => (
        <div key={n} className="flex flex-col items-center gap-1">
          {n === "1" && <Trophy className="h-7 w-7 text-star" />}
          <div className={`grid w-14 justify-center rounded-t-xl pt-1 font-display text-xl font-extrabold text-night ${h} ${c}`}>{n}</div>
        </div>
      ))}
    </div>
  );
}

/** Visual do hero: arquipélago de mundos flutuando + o editor. */
function HeroWorlds() {
  return (
    <div className="relative mx-auto h-[26rem] w-full max-w-lg" aria-hidden>
      <div className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgb(122_85_245/0.35),transparent)]" />
      <Island index={5} className="flutua-2 absolute right-0 top-0 h-40 w-auto" />
      <Island index={10} className="flutua absolute left-2 top-10 h-36 w-auto" />
      <Island index={2} className="flutua-2 absolute bottom-24 right-10 h-32 w-auto" />
      <div className="clay absolute bottom-0 left-0 w-[19rem] p-4">
        <BlockStack small />
        <span className="absolute -right-4 -top-4 rounded-full bg-star px-3 py-1 font-display font-extrabold text-night shadow-[0_3px_0_rgb(0_0_0/0.35)]">★★★ +30 XP</span>
      </div>
    </div>
  );
}
