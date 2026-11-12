import { ArrowDown, ArrowUp, Download, LayoutDashboard, Plus, Settings, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Stat } from "@/components/app-shell";
import { PhaseBadge } from "@/components/jams";
import { listJams } from "@/lib/dal/jams";
import { buttonClass, Card, PageHeader } from "@/components/ui";
import { UF_LIST, UFS } from "@/lib/br";
import { requireUser } from "@/lib/dal/auth";
import { getPlatformDashboard, listPlans } from "@/lib/dal/platform";
import { NewSchoolForm } from "./forms";
import { filtersToQuery, parsePlatformFilters, type PlatformFilters, type SchoolSort } from "@/lib/platform-filters";

export const metadata = { title: "Plataforma" };

const LEVEL = ["", "Básico", "Intermediário", "Avançado"];
const num = new Intl.NumberFormat("pt-BR");
const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });
const field = "min-h-12 rounded-2xl border-2 border-line bg-white px-4 text-base font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function PlataformaPage(props: PageProps<"/plataforma">) {
  const user = await requireUser(["SUPER_ADMIN"]);
  const f = parsePlatformFilters(await props.searchParams);
  const [d, jams, plans] = await Promise.all([getPlatformDashboard(user, f), listJams(user), listPlans()]);
  const filtered = Boolean(f.uf || f.cidade || f.q || f.tipo);

  return (
    <div className="space-y-8">
      <PageHeader icon={<LayoutDashboard className="h-7 w-7" />} title="Painel da plataforma" subtitle="Todas as escolas e professores, com filtros por estado, cidade e escola." />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Criar escola ou professor(a)</h2>
        </div>
        <p className="text-sm text-muted">As escolas também podem se cadastrar sozinhas em /cadastro. Aqui você cria a conta já ativa e recebe a senha temporária para enviar.</p>
        <NewSchoolForm plans={plans} />
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Trophy aria-hidden className="h-5 w-5 text-brand" /> Game Jams</h2>
          <div className="flex gap-2">
            <Link href="/jams" className={buttonClass("secondary", "sm")}>Ver todas</Link>
            <Link href="/jams/nova" className={buttonClass("primary", "sm")}><Plus aria-hidden className="h-4 w-4" /> Criar game jam</Link>
          </div>
        </div>
        <ul className="divide-y divide-line">
          {jams.slice(0, 5).map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="flex flex-wrap items-center gap-2">
                <PhaseBadge phase={j.phase} />
                <Link href={`/jams/${j.slug}`} className="font-extrabold hover:underline">{j.title}</Link>
                <span className="text-sm text-muted">{j._count.teams} equipes · {j._count.entries} entregas</span>
              </span>
              <Link href={`/jams/gerenciar/${j.id}`} className={buttonClass("secondary", "sm")}><Settings aria-hidden className="h-4 w-4" /> Gerenciar</Link>
            </li>
          ))}
          {jams.length === 0 && <li className="py-2 text-sm text-muted">Nenhuma game jam criada ainda.</li>}
        </ul>
      </Card>

      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_9rem_1fr_13rem_auto]" role="search" aria-label="Filtrar escolas">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Escola
            <input name="q" defaultValue={f.q} placeholder="Nome ou endereço" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Estado
            <select name="uf" defaultValue={f.uf ?? ""} className={field}>
              <option value="">Todos</option>
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf} · {UFS[uf]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Cidade
            <input name="cidade" defaultValue={f.cidade} list="cidades" placeholder="Todas" className={field} />
            <datalist id="cidades">{d.cities.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Tipo
            <select name="tipo" defaultValue={f.tipo ?? ""} className={field}>
              <option value="">Escolas e professores</option>
              <option value="ESCOLA">Só escolas</option>
              <option value="PROFESSOR_INDEPENDENTE">Só professores</option>
            </select>
          </label>
          <input type="hidden" name="ordem" value={f.ordem} />
          <input type="hidden" name="dir" value={f.dir} />
          <div className="flex items-end gap-2">
            <button className="btn">Filtrar</button>
            {filtered && <Link href="/plataforma" className={buttonClass("secondary")}>Limpar</Link>}
          </div>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={filtered ? "Escolas (filtro)" : "Escolas"} value={num.format(d.totals.schools)} />
        <Stat label="Professores" value={num.format(d.totals.teachers)} />
        <Stat label="Alunos" value={num.format(d.totals.students)} />
        <Stat label="Turmas" value={num.format(d.totals.classes)} />
        <Stat label="Lições concluídas" value={num.format(d.totals.completed)} />
        <Stat label="Tentativas" value={num.format(d.totals.attempts)} />
      </div>

      {d.byState.length > 0 && (
        <section aria-labelledby="por-estado" className="space-y-2">
          <h2 id="por-estado" className="text-xl font-extrabold">Escolas por estado</h2>
          <div className="flex flex-wrap gap-2">
            {d.byState.map(([uf, n]) => (
              <Link
                key={uf}
                href={`/plataforma${filtersToQuery(f, { uf: uf as PlatformFilters["uf"], cidade: undefined })}`}
                aria-current={f.uf === uf ? "true" : undefined}
                className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold ${f.uf === uf ? "border-brand bg-brand-soft text-brand-shadow" : "border-line bg-white hover:border-brand"}`}
                title={UFS[uf as keyof typeof UFS]}
              >
                {uf} <span className="text-muted">{n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-xl font-extrabold">Escolas e professores</h2>
          <div className="flex gap-2">
            <a href={`/plataforma/exportar${filtersToQuery(f)}`} className={buttonClass("secondary", "sm")}><Download aria-hidden className="h-4 w-4" /> Exportar CSV</a>
            <Link href="/plataforma/lixeira" className={buttonClass("secondary", "sm")}><Trash2 aria-hidden className="h-4 w-4" /> Lixeira ({d.trash})</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-black/[0.03] text-muted">
              <tr>
                <Th f={f} k="nome">Nome</Th>
                <Th f={f} k="cidade">Cidade</Th>
                <Th f={f} k="estado">UF</Th>
                <th className="px-3 py-2">Plano</th>
                <Th f={f} k="professores" numeric>Prof.</Th>
                <Th f={f} k="alunos" numeric>Alunos</Th>
                <Th f={f} k="turmas" numeric>Turmas</Th>
                <Th f={f} k="concluidas" numeric>Concluídas</Th>
                <Th f={f} k="tentativas" numeric>Tentativas</Th>
                <Th f={f} k="atividade">Última atividade</Th>
              </tr>
            </thead>
            <tbody>
              {d.schools.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link href={`/plataforma/escolas/${s.id}`} className="font-extrabold text-brand underline-offset-2 hover:underline">{s.name}</Link>
                    <span className="block text-xs text-muted">{s.type === "ESCOLA" ? "Escola" : "Professor(a)"} · {s.slug}</span>
                  </td>
                  <td className="px-3 py-2">{s.city || "—"}</td>
                  <td className="px-3 py-2 font-bold">{s.state || "—"}</td>
                  <td className="px-3 py-2">{s.plan ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.teachers}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.students}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.classes}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.completed}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.attempts}</td>
                  <td className="px-3 py-2">{s.lastActivity ? when.format(s.lastActivity) : "—"}</td>
                </tr>
              ))}
              {d.schools.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-muted">Nenhuma escola com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="p-5">
          <h2 className="text-xl font-extrabold">Progresso por trilha</h2>
          <p className="text-sm font-semibold text-muted">Alunos das escolas filtradas · só lições obrigatórias (as extras do PictoBlox ficam de fora).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-black/[0.03] text-muted">
              <tr><th className="px-3 py-2">Trilha</th><th className="px-3 py-2">Nível</th><th className="px-3 py-2 text-right">Lições</th><th className="px-3 py-2 text-right">Começaram</th><th className="px-3 py-2 text-right">Terminaram</th><th className="px-3 py-2 text-right">Concluídas</th></tr>
            </thead>
            <tbody>
              {d.tracks.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-3 py-2 font-bold">{t.title}<span className="block text-xs font-semibold text-muted">{t.course}</span></td>
                  <td className="px-3 py-2">{LEVEL[t.level] ?? t.level}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.lessons}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.started}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.finished}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.completed}</td>
                </tr>
              ))}
              {d.tracks.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Sem dados para esses filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Th({ f, k, numeric, children }: { f: PlatformFilters; k: SchoolSort; numeric?: boolean; children: ReactNode }) {
  const active = f.ordem === k;
  const nextDir = active ? (f.dir === "asc" ? "desc" : "asc") : numeric || k === "atividade" ? "desc" : "asc";
  const Icon = f.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`px-3 py-2 ${numeric ? "text-right" : ""}`} aria-sort={active ? (f.dir === "asc" ? "ascending" : "descending") : undefined}>
      <Link href={`/plataforma${filtersToQuery(f, { ordem: k, dir: nextDir })}`} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
        {children}
        {active && <Icon aria-hidden className="h-3.5 w-3.5" />}
      </Link>
    </th>
  );
}
