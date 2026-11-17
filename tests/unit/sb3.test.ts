import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { readSb3, Sb3Error } from "@/lib/sb3/project";
import { sb3Bytes } from "./sb3-builder";

describe("leitor de .sb3", () => {
  it("abre um projeto válido", async () => {
    const json = (await readSb3(await sb3Bytes({ sprites: [{}] }))) as { targets: unknown[] };
    expect(json.targets.length).toBeGreaterThan(0);
  });

  it("recusa arquivos inválidos com mensagens amigáveis", async () => {
    await expect(readSb3(new TextEncoder().encode("não é zip"))).rejects.toThrow(Sb3Error);
    const zip = new JSZip();
    zip.file("outra.txt", "x");
    await expect(readSb3(await zip.generateAsync({ type: "uint8array" }))).rejects.toThrow(/project\.json/);
  });

  it("recusa zip-bomba no project.json", async () => {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify({ targets: [{ isStage: true, pad: "x".repeat(11 * 1024 * 1024) }] }));
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    expect(bytes.byteLength).toBeLessThan(1024 * 1024);
    await expect(readSb3(bytes)).rejects.toThrow(/grande demais/);
  });
});
