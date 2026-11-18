import { Gamepad2, GraduationCap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo, PoweredBy } from "@/components/brand-logo";
import { Island } from "@/components/island";
import { getBrand } from "@/lib/branding";
import { getCurrentUser } from "@/lib/dal/auth";
import { ROLE_HOME } from "@/lib/roles";
import { getTenant } from "@/lib/tenant";

// Visitante no domínio da plataforma: o proxy já entrega a página inicial estática (public/inicio).
// Aqui chegam o usuário logado (vai para o painel) e o domínio de uma escola (escolha de entrada).
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const [tenant, brand] = await Promise.all([getTenant(), getBrand()]);

  // Subdomínio sem escola ativa, ou cookie de sessão que já não vale: a página inicial pública.
  if (!tenant) redirect("/inicio/index.html");

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
