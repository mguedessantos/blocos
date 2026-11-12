// Geração de credenciais amigáveis para crianças (sem caracteres ambíguos) e leitura de listas de alunos.
import { randomInt } from "node:crypto";

const CODE_WORDS = ["ROBO", "GATO", "SAPO", "LUA", "SOL", "PIXEL", "FOCA", "PANDA", "TATU", "BOLA", "RAIO", "NAVE", "LOBO", "PEIXE", "ONDA", "TREM"];
const PASSWORD_WORDS = ["gato", "sapo", "lua", "sol", "foca", "panda", "tatu", "bola", "nave", "lobo", "peixe", "onda", "trem", "pipa", "uva", "kiwi", "abelha", "coruja", "zebra", "tigre"];

const pick = <T,>(list: readonly T[]) => list[randomInt(list.length)];

/** Ex.: ROBO42, PANDA07. Unicidade é garantida por quem chama (tentativas). */
export function generateClassCode() {
  return `${pick(CODE_WORDS)}${String(randomInt(100)).padStart(2, "0")}`;
}

/** Ex.: coruja482 — fácil de digitar por uma criança. */
export function generateKidPassword() {
  return `${pick(PASSWORD_WORDS)}${String(randomInt(1000)).padStart(3, "0")}`;
}

function baseUsername(name: string) {
  const first = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)[0];
  return (first || "aluno").slice(0, 16);
}

/**
 * Usuário a partir do primeiro nome, único na organização: ana, ana2, ana3...
 * `taken` é atualizado para permitir gerar vários de uma vez.
 */
export function generateUsername(name: string, taken: Set<string>) {
  const base = baseUsername(name);
  let candidate = base;
  for (let n = 2; taken.has(candidate); n++) candidate = `${base}${n}`;
  taken.add(candidate);
  return candidate;
}

export const MAX_STUDENTS_PER_IMPORT = 200;

export type ParsedNames = { names: string[]; errors: string[] };

/**
 * Aceita um nome por linha ou um CSV (separado por vírgula ou ponto e vírgula) com coluna "nome".
 * LGPD: guardamos só o primeiro nome / apelido que a escola informar.
 */
export function parseStudentList(text: string): ParsedNames {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  if (lines.length === 0) return { names: [], errors: ["A lista está vazia."] };

  let column = 0;
  let start = 0;
  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const idx = header.findIndex((h) => ["nome", "name", "aluno", "apelido"].includes(h));
  if (idx >= 0) {
    column = idx;
    start = 1;
  }

  const names: string[] = [];
  lines.slice(start).forEach((line, i) => {
    const cell = (line.includes(sep) ? line.split(sep)[column] : line) ?? "";
    const name = cell.trim().replace(/^"|"$/g, "").replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60) {
      errors.push(`Linha ${i + start + 1}: nome inválido "${name}".`);
      return;
    }
    names.push(name);
  });

  if (names.length > MAX_STUDENTS_PER_IMPORT) {
    errors.push(`Máximo de ${MAX_STUDENTS_PER_IMPORT} alunos por vez.`);
    return { names: [], errors };
  }
  return { names, errors };
}
