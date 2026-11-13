import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/plataforma",
  ORG_ADMIN: "/escola",
  TEACHER: "/professor",
  STUDENT: "/aluno",
  JUDGE: "/jurado",
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Administrador da plataforma",
  ORG_ADMIN: "Coordenação",
  TEACHER: "Professor(a)",
  STUDENT: "Aluno(a)",
  JUDGE: "Jurado(a)",
};

/** Áreas protegidas e quem pode acessá-las. */
export const AREA_ROLES: Record<string, Role[]> = {
  "/plataforma": ["SUPER_ADMIN"],
  "/escola": ["ORG_ADMIN", "SUPER_ADMIN"],
  "/professor": ["TEACHER", "ORG_ADMIN"],
  "/aluno": ["STUDENT"],
  "/jurado": ["JUDGE", "TEACHER", "ORG_ADMIN", "SUPER_ADMIN"],
  "/manual": ["SUPER_ADMIN", "ORG_ADMIN", "TEACHER", "JUDGE"],
  "/jams": ["SUPER_ADMIN", "ORG_ADMIN", "TEACHER", "STUDENT", "JUDGE"],
};

export function areaFor(pathname: string) {
  return Object.keys(AREA_ROLES).find((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? null;
}
