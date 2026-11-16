import { mundo10, mundo8, mundo9 } from "./avancado";
import { mundoGlitch } from "./ataque-do-glitch";
import { mundo1, mundo2, mundo3 } from "./basico";
import { mundo4, mundo5, mundo6, mundo7 } from "./intermediario";
import type { TrackContent } from "./types";

/** Currículo oficial: 11 mundos em 3 níveis, preparando para a game jam. */
export const OFFICIAL_TRACKS: TrackContent[] = comBlocosAprendidos([mundo1, mundo2, mundo3, mundoGlitch, mundo4, mundo5, mundo6, mundo7, mundo8, mundo9, mundo10]);

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
export { FLAG_STARTER, guideMarkdown } from "./types";
export type { LessonContent, TeacherGuide, TrackContent } from "./types";
