import { COORDENACAO } from "./coordenacao";
import { JURADO } from "./jurado";
import { PROFESSOR } from "./professor";
import type { ManualGuide } from "./types";

export type { ManualChapter, ManualGuide } from "./types";

export const GUIDES: ManualGuide[] = [
  { slug: "professor", title: "Guia do(a) professor(a)", intro: "Turmas, alunos, currículo, acompanhamento, certificados e game jams.", chapters: PROFESSOR },
  { slug: "coordenacao", title: "Guia da coordenação", intro: "Tudo do professor e mais: painel da escola, equipe, localização e marca.", chapters: COORDENACAO },
  { slug: "jurado", title: "Guia do(a) jurado(a)", intro: "Como avaliar as entregas das game jams às cegas.", chapters: JURADO },
];
