// Banco de lições do editor do navegador. Os mundos (content/trilhas) escolhem lições daqui
// e acrescentam o guia do professor e o desafio extra.
import type { LessonContent, TeacherGuide } from "../trilhas/types";
import { condicionais } from "./condicionais";
import { primeirosPassos } from "./primeiros-passos";
import { repeticao } from "./repeticao";
import { variaveis } from "./variaveis";

const POOL = new Map(
  [primeirosPassos, repeticao, condicionais, variaveis].flatMap((t) => t.modules.flatMap((m) => m.lessons)).map((l) => [l.slug, l]),
);

export function editor(slug: string, guide: TeacherGuide, extra?: string, extraChecks?: LessonContent["extraChecks"]): LessonContent {
  const l = POOL.get(slug);
  if (!l) throw new Error(`Lição do editor não encontrada: ${slug}`);
  return { ...l, mode: "EDITOR", guide, extra, extraChecks };
}
