import Link from "next/link";
import type { getClassProgress } from "@/lib/dal/classes";

type Data = Awaited<ReturnType<typeof getClassProgress>>;

const CELL = ["bg-black/[0.04] text-muted", "bg-amber-200 text-amber-950", "bg-lime-300 text-lime-950", "bg-green-500 text-white"];

/** Mapa de calor: cada linha é um aluno, cada coluna uma lição da trilha. */
export function ProgressGrid({ classId, data }: { classId: string; data: Data }) {
  if (!data.track) return <p className="text-sm text-muted">Libere um curso para a turma para acompanhar o progresso aqui.</p>;
  const stuck = data.students.filter((s) => s.stuck);
  return (
    <div className="space-y-4">
      <nav aria-label="Trilhas" className="flex flex-wrap gap-2">
        {data.tracks.map((t, i) => (
          <Link
            key={t.id}
            href={`/professor/turmas/${classId}?trilha=${t.id}#progresso`}
            scroll={false}
            aria-current={t.id === data.track!.id ? "true" : undefined}
            className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold ${t.id === data.track!.id ? "border-brand bg-brand-soft text-brand-shadow" : "border-line bg-white hover:border-brand"}`}
          >
            {i + 1}. {t.title}
          </Link>
        ))}
      </nav>

      {stuck.length > 0 && (
        <p role="status" className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
          Precisam de ajuda (3+ tentativas sem concluir): {stuck.map((s) => s.name).join(", ")}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-sm">
          <caption className="sr-only">Estrelas de cada aluno em cada lição da trilha {data.track.title}</caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 text-left">Aluno</th>
              {data.lessons.map((l, i) => (
                <th key={l.id} scope="col" title={l.title} className="w-9 text-center text-xs font-bold text-muted">
                  {l.optional ? "★" : i + 1}
                  <span className="sr-only"> {l.title}{l.optional ? " (extra)" : ""}</span>
                </th>
              ))}
              <th className="px-2 text-right">Feitas</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => (
              <tr key={s.id}>
                <th scope="row" className="sticky left-0 z-10 bg-white px-2 text-left font-semibold">
                  <Link href={`/professor/alunos/${s.id}`} className="hover:underline">{s.name}</Link>
                  {s.stuck && <span className="ml-1 text-amber-600" title="Precisa de ajuda">⚠</span>}
                </th>
                {s.cells.map((c, i) => {
                  const lesson = data.lessons[i];
                  const level = c.done ? Math.max(1, c.stars) : 0;
                  const label = c.done ? `${c.stars} estrela(s)` : c.attempts ? `${c.attempts} tentativa(s), não concluída` : "não iniciada";
                  return (
                    <td
                      key={c.lessonId}
                      title={`${lesson.title}: ${label}`}
                      className={`h-9 w-9 rounded-lg text-center text-xs font-extrabold ${CELL[level]} ${lesson.optional ? "opacity-70" : ""} ${!c.done && c.attempts >= 3 ? "ring-2 ring-amber-500" : ""}`}
                    >
                      {c.done ? c.stars : c.attempts ? "·" : ""}
                      <span className="sr-only">{label}</span>
                    </td>
                  );
                })}
                <td className="px-2 text-right font-bold tabular-nums">{s.done}/{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
        <span><span className="inline-block h-3 w-3 rounded bg-green-500 align-middle" /> 3 estrelas</span>
        <span><span className="inline-block h-3 w-3 rounded bg-lime-300 align-middle" /> 2</span>
        <span><span className="inline-block h-3 w-3 rounded bg-amber-200 align-middle" /> 1</span>
        <span>· tentou e ainda não concluiu</span>
        <span>★ missão extra (PictoBlox)</span>
      </p>
    </div>
  );
}
