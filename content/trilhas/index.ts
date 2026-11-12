import { mundo10, mundo8, mundo9 } from "./avancado";
import { mundo1, mundo2, mundo3 } from "./basico";
import { mundo4, mundo5, mundo6, mundo7 } from "./intermediario";
import type { TrackContent } from "./types";

/** Currículo oficial: 10 mundos em 3 níveis, preparando para a game jam. */
export const OFFICIAL_TRACKS: TrackContent[] = [mundo1, mundo2, mundo3, mundo4, mundo5, mundo6, mundo7, mundo8, mundo9, mundo10];
export { FLAG_STARTER, guideMarkdown } from "./types";
export type { LessonContent, TeacherGuide, TrackContent } from "./types";
