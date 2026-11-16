import { Award, BookOpen, Compass, Dumbbell, Footprints, Map, Medal, Rocket, Star, Target, Trophy } from "lucide-react";

const ICONS = { Award, BookOpen, Compass, Dumbbell, Footprints, Map, Medal, Rocket, Star, Target, Trophy };

/** Ícone da medalha (o nome vem de `BADGES` em lib/gamification.ts, gravado no banco). */
export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Award;
  return <Icon aria-hidden className={className} />;
}
