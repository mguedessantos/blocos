// Currículo oficial: um arquivo por lição em content/mundos/<mundo>/licoes/<slug>.ts.
// A ordem dos mundos é a desta lista; a ordem das lições fica no index.ts de cada mundo.
import mundo01 from "./mundo-01-vila-do-palco";
import mundo02 from "./mundo-02-torre-das-repeticoes";
import mundo03 from "./mundo-03-personagens-com-vida";
import mundo04 from "./mundo-04-o-ataque-do-glitch";
import mundo05 from "./mundo-05-ponte-das-decisoes";
import mundo06 from "./mundo-06-cidade-dos-comandos";
import mundo07 from "./mundo-07-observatorio-dos-sensores";
import mundo08 from "./mundo-08-cofre-dos-pontos";
import mundo09 from "./mundo-09-fortaleza-do-glitch";
import mundo10 from "./mundo-10-forja-dos-jogos";
import mundo11 from "./mundo-11-o-grande-torneio";
import type { LessonTest, TrackContent } from "./tipos";

const MUNDOS = [mundo01, mundo02, mundo03, mundo04, mundo05, mundo06, mundo07, mundo08, mundo09, mundo10, mundo11];

/** Currículo oficial: 11 mundos em 3 níveis, preparando para a game jam. */
export const OFFICIAL_TRACKS: TrackContent[] = comBlocosAprendidos(MUNDOS.map((m) => m.track));

/** Soluções de referência e erros comuns por slug. Só os testes usam (o seed nunca grava; o aluno nunca recebe). */
export const TESTES: Record<string, LessonTest> = Object.assign({}, ...MUNDOS.map((m) => m.testes));

/** Todo bloco ensinado numa lição continua liberado nas seguintes (cada lição só lista os blocos novos). */
function comBlocosAprendidos(tracks: TrackContent[]): TrackContent[] {
  const seen = new Set<string>();
  return tracks.map((tr) => ({
    ...tr,
    modules: tr.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => {
        if (!l.allowedBlocks?.length) return l; // lista vazia = todos os blocos
        for (const op of l.allowedBlocks) seen.add(op);
        return { ...l, allowedBlocks: [...seen] };
      }),
    })),
  }));
}
export { FLAG_STARTER, guideMarkdown } from "./tipos";
export type { LessonContent, LessonTest, TeacherGuide, TrackContent } from "./tipos";
