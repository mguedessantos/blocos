import { primeirosPassos } from "./01-primeiros-passos";
import { repeticao } from "./02-repeticao";
import { condicionais } from "./03-condicionais";
import { variaveis } from "./04-variaveis";
import type { TrackContent } from "./types";

export const OFFICIAL_TRACKS: TrackContent[] = [primeirosPassos, repeticao, condicionais, variaveis];
export { FLAG_STARTER } from "./types";
export type { LessonContent, TrackContent } from "./types";
