import { OFFICIAL_TRACKS, type TrackContent } from "./trilhas";

export type CourseContent = {
  slug: string;
  title: string;
  description: string;
  order: number;
  /** Aparece como “em breve” e ainda não pode ser liberado para turmas. */
  comingSoon?: boolean;
  tracks: TrackContent[];
};

/** Cursos oficiais. O professor libera o CURSO inteiro para a turma (não trilha por trilha). */
export const OFFICIAL_COURSES: CourseContent[] = [
  {
    slug: "pictoblox-introducao-programacao-blocos",
    title: "PictoBlox e Introdução à Programação de Blocos",
    description: "Do primeiro bloco até a game jam: 10 mundos com lições no site e missões extras no PictoBlox.",
    order: 1,
    tracks: OFFICIAL_TRACKS,
  },
  {
    slug: "arduino-e-pictoblox",
    title: "Arduino e PictoBlox",
    description: "Em breve.",
    order: 2,
    comingSoon: true,
    tracks: [],
  },
];
