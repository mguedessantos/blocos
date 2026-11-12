import { describe, expect, it } from "vitest";
import { MAX_STUDENTS_PER_IMPORT, generateClassCode, generateKidPassword, generateUsername, parseStudentList } from "@/lib/credentials";

describe("credenciais", () => {
  it("código de turma: palavra + 2 dígitos", () => {
    for (let i = 0; i < 50; i++) expect(generateClassCode()).toMatch(/^[A-Z]{3,5}\d{2}$/);
  });
  it("senha infantil: palavra + 3 dígitos", () => {
    for (let i = 0; i < 50; i++) expect(generateKidPassword()).toMatch(/^[a-z]{3,6}\d{3}$/);
  });
  it("usuário único a partir do primeiro nome, sem acento", () => {
    const taken = new Set(["ana"]);
    expect(generateUsername("Ana Júlia", taken)).toBe("ana2");
    expect(generateUsername("ana", taken)).toBe("ana3");
    expect(generateUsername("João Pedro", taken)).toBe("joao");
    expect(generateUsername("  ", taken)).toBe("aluno");
  });
});

describe("parseStudentList", () => {
  it("um nome por linha", () => {
    expect(parseStudentList("Ana\n\n  Bruno  Silva \r\nClara")).toEqual({ names: ["Ana", "Bruno Silva", "Clara"], errors: [] });
  });
  it("CSV com cabeçalho, ; e BOM, ignorando outras colunas", () => {
    const csv = "\uFEFFturma;nome;idade\n5A;Ana;10\n5A;\"Bruno\";11";
    expect(parseStudentList(csv).names).toEqual(["Ana", "Bruno"]);
  });
  it("aponta nomes inválidos e lista vazia", () => {
    expect(parseStudentList("Ana\nB").errors[0]).toMatch(/Linha 2/);
    expect(parseStudentList("   ").errors).toEqual(["A lista está vazia."]);
  });
  it("limita o tamanho do lote", () => {
    const many = Array.from({ length: MAX_STUDENTS_PER_IMPORT + 1 }, (_, i) => `Aluno ${i}`).join("\n");
    expect(parseStudentList(many).names).toEqual([]);
  });
});
