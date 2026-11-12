import { BookOpen, Eye, Puzzle, Trophy, type LucideIcon } from "lucide-react";

export type LessonKind = "TEORIA" | "DEMO" | "EXERCICIO" | "DESAFIO";

export const LESSON_KIND: Record<LessonKind, { label: string; icon: LucideIcon; color: string }> = {
  TEORIA: { label: "Aprender", icon: BookOpen, color: "#4C97FF" },
  DEMO: { label: "Ver como funciona", icon: Eye, color: "#9966FF" },
  EXERCICIO: { label: "Exercício", icon: Puzzle, color: "#59C059" },
  DESAFIO: { label: "Desafio", icon: Trophy, color: "#FFAB19" },
};

/** Estrelas desenhadas (não emoji), com rótulo acessível. */
export function Stars({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-9 w-9" : "h-4 w-4";
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
            fill={i <= value ? "#FBBF24" : "#E5E7EB"}
            stroke={i <= value ? "#B45309" : "#CBD5E1"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}
