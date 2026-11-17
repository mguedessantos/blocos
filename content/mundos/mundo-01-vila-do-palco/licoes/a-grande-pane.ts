import { ABERTURA } from "../../historia";
import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "a-grande-pane",
  title: "A Grande Pane",
  type: "TEORIA",
  xp: 5,
  content: ABERTURA,
  guide: {
    objetivo: "Apresentar a jornada, o Bloquinho e como as missões funcionam.",
    minutos: 10,
    passos: [
      "Leia a história em voz alta com a turma ou peça para alguém ler.",
      "Combine com a turma: no fim da jornada, vamos fazer uma game jam em equipes.",
    ],
    errosComuns: ["Alunos ansiosos para pular a leitura: combine que a história traz pistas para as missões."],
  },
};
