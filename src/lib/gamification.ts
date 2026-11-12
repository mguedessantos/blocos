// Níveis e medalhas dos alunos. Regras puras (sem banco) para poder testar.

export const LEVELS = [
  { xp: 0, title: "Aprendiz de Blocos" },
  { xp: 50, title: "Construtor(a)" },
  { xp: 150, title: "Inventor(a)" },
  { xp: 300, title: "Programador(a)" },
  { xp: 500, title: "Criador(a) de Jogos" },
  { xp: 800, title: "Mestre dos Blocos" },
  { xp: 1200, title: "Lenda do Torneio" },
] as const;

/** Nível atual (1…N), título e quanto falta para o próximo. */
export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    title: cur.title,
    next: next ? { xp: next.xp, title: next.title } : null,
    // 0–100 dentro do nível atual
    pct: next ? Math.round((100 * (xp - cur.xp)) / (next.xp - cur.xp)) : 100,
  };
}

/** Números do aluno usados para decidir as medalhas. */
export type StudentStats = {
  completed: number; // lições concluídas (obrigatórias + extras)
  perfect: number; // lições com 3 estrelas
  exercisesFirstTry: number; // exercícios/desafios concluídos com 3 estrelas na 1ª tentativa
  persistent: number; // concluídas depois de 3+ tentativas
  pictoblox: number; // missões extras (.sb3) concluídas
  tracksFinished: number; // trilhas com todas as lições obrigatórias feitas
  levelsFinished: number[]; // níveis (1 básico, 2 intermediário, 3 avançado) com todas as trilhas feitas
};

export type BadgeDef = { id: string; name: string; description: string; icon: string; earned: (s: StudentStats) => boolean };

export const BADGES: BadgeDef[] = [
  { id: "primeiro-passo", name: "Primeiro passo", description: "Concluiu a primeira lição.", icon: "🚀", earned: (s) => s.completed >= 1 },
  { id: "dez-licoes", name: "Dez de dez", description: "Concluiu 10 lições.", icon: "🔟", earned: (s) => s.completed >= 10 },
  { id: "cinquenta-licoes", name: "Maratonista", description: "Concluiu 50 lições.", icon: "🏃", earned: (s) => s.completed >= 50 },
  { id: "perfeito", name: "Perfeição", description: "Ganhou 3 estrelas em 10 lições.", icon: "⭐", earned: (s) => s.perfect >= 10 },
  { id: "de-primeira", name: "De primeira!", description: "Resolveu 5 exercícios com 3 estrelas na primeira tentativa.", icon: "🎯", earned: (s) => s.exercisesFirstTry >= 5 },
  { id: "persistente", name: "Não desisto", description: "Concluiu uma lição depois de tentar 3 vezes ou mais.", icon: "💪", earned: (s) => s.persistent >= 1 },
  { id: "explorador-pictoblox", name: "Explorador(a) do PictoBlox", description: "Concluiu uma missão extra no PictoBlox.", icon: "🧭", earned: (s) => s.pictoblox >= 1 },
  { id: "primeiro-mundo", name: "Mundo completo", description: "Terminou uma trilha inteira.", icon: "🗺️", earned: (s) => s.tracksFinished >= 1 },
  { id: "nivel-basico", name: "Básico dominado", description: "Terminou todas as trilhas do nível Básico.", icon: "🥉", earned: (s) => s.levelsFinished.includes(1) },
  { id: "nivel-intermediario", name: "Intermediário dominado", description: "Terminou todas as trilhas do nível Intermediário.", icon: "🥈", earned: (s) => s.levelsFinished.includes(2) },
  { id: "pronto-para-jam", name: "Pronto(a) para a Jam", description: "Terminou todas as trilhas do nível Avançado.", icon: "🏆", earned: (s) => s.levelsFinished.includes(3) },
];

export function earnedBadges(s: StudentStats) {
  return BADGES.filter((b) => b.earned(s)).map((b) => b.id);
}

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

type ProgressRow = { status: string; stars: number; attempts: number; lesson: { type: string; mode: string; optional: boolean; trackId: string } };
type TrackInfo = { id: string; level: number; required: number };

/** Calcula as estatísticas a partir das linhas de progresso e das trilhas visíveis. */
export function statsFrom(rows: ProgressRow[], tracks: TrackInfo[]): StudentStats {
  const done = rows.filter((r) => r.status === "CONCLUIDO");
  const reqDone = new Map<string, number>();
  for (const r of done) if (!r.lesson.optional) reqDone.set(r.lesson.trackId, (reqDone.get(r.lesson.trackId) ?? 0) + 1);
  const finished = new Set(tracks.filter((t) => t.required > 0 && (reqDone.get(t.id) ?? 0) >= t.required).map((t) => t.id));
  const levels = [...new Set(tracks.map((t) => t.level))];
  return {
    completed: done.length,
    perfect: done.filter((r) => r.stars >= 3).length,
    exercisesFirstTry: done.filter((r) => (r.lesson.type === "EXERCICIO" || r.lesson.type === "DESAFIO") && r.stars >= 3 && r.attempts === 1).length,
    persistent: done.filter((r) => r.attempts >= 3).length,
    pictoblox: done.filter((r) => r.lesson.optional && r.lesson.mode === "SB3").length,
    tracksFinished: finished.size,
    levelsFinished: levels.filter((lv) => tracks.filter((t) => t.level === lv).every((t) => finished.has(t.id))),
  };
}
