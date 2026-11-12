import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { checkModel } from "@/lib/checker";
import { modelFromProjectJson, modelFromSb3, Sb3Error } from "@/lib/sb3/project";
import { key, projectJson, sb3Bytes } from "./sb3-builder";

describe("leitor de .sb3", () => {
  it("conta atores, cenários, fantasias, sons, variáveis e teclas", async () => {
    const m = await modelFromSb3(
      await sb3Bytes({
        backdrops: 3,
        stageVariables: ["tempo"],
        sprites: [
          { costumes: 2, sounds: 1, variables: ["pontos"], scripts: [[key("right arrow"), { op: "motion_changexby", inputs: { DX: 10 } }], [key("left arrow"), "motion_changexby"]] },
          { costumes: 4 },
        ],
      }),
    );
    expect(m.sprites).toBe(2);
    expect(m.backdrops).toBe(3);
    expect(m.maxCostumes).toBe(4);
    expect(m.sounds).toBe(1);
    expect(m.variables).toBe(2);
    expect([...m.keys].sort()).toEqual(["left arrow", "right arrow"]);
    expect(m.opcodeCounts.event_whenkeypressed).toBe(2);
  });

  it("entende scripts, blocos dentro de laços e textos", () => {
    const m = modelFromProjectJson(
      projectJson({
        sprites: [{
          scripts: [[
            "event_whenflagclicked",
            { op: "control_forever", sub: [{ op: "control_if", inputs: { CONDITION: { op: "sensing_touchingobject" } }, sub: [{ op: "looks_say", inputs: { MESSAGE: "Olá, mundo!" } }] }] },
          ]],
        }],
      }),
    );
    expect(m.scripts).toHaveLength(1);
    expect(m.scripts[0].opcodes.has("looks_say")).toBe(true);
    expect(m.scripts[0].opcodes.has("sensing_touchingobject")).toBe(true);
    expect(m.containers.find((c) => c.opcode === "control_forever")?.inside.has("control_if")).toBe(true);
    expect(m.texts).toContainEqual({ opcode: "looks_say", input: "MESSAGE", value: "Olá, mundo!" });

    const r = checkModel(m, {
      checks: [
        { type: "inside", parent: ["control_forever"], child: ["control_if"], label: "Tem um “se” dentro do “sempre”" },
        { type: "inScript", hat: ["event_whenflagclicked"], opcodes: ["looks_say"], label: "Diz algo quando a bandeira é clicada" },
        { type: "textContains", opcodes: ["looks_say"], text: "mundo", label: "A frase tem “mundo”" },
        { type: "sprites", min: 2, bonus: true },
      ],
    });
    expect(r.passed).toBe(true);
    expect(r.stars).toBe(1); // bônus não cumprido
  });

  it("checagens de execução não passam em .sb3", () => {
    const r = checkModel(modelFromProjectJson(projectJson({})), { checks: [{ type: "said", text: "oi" }] });
    expect(r.passed).toBe(false);
  });

  it("recusa arquivos inválidos com mensagens amigáveis", async () => {
    await expect(modelFromSb3(new TextEncoder().encode("não é zip"))).rejects.toThrow(Sb3Error);
    const zip = new JSZip();
    zip.file("outra.txt", "x");
    await expect(modelFromSb3(await zip.generateAsync({ type: "uint8array" }))).rejects.toThrow(/project\.json/);
    expect(() => modelFromProjectJson({ targets: [] })).toThrow(Sb3Error);
    expect(() => modelFromProjectJson("lixo")).toThrow(Sb3Error);
  });

  it("não trava com blocos em ciclo nem com formatos estranhos", () => {
    const evil = {
      targets: [
        { isStage: true, costumes: [{}], blocks: {} },
        {
          isStage: false,
          blocks: {
            a: { opcode: "event_whenflagclicked", topLevel: true, next: "b" },
            b: { opcode: "control_forever", next: "a", inputs: { SUBSTACK: [2, "b"] } },
            c: [12, "var", "id", 0, 0],
            d: { opcode: 5, inputs: "x" },
          },
        },
      ],
    };
    expect(() => modelFromProjectJson(evil)).not.toThrow();
  });

  it("recusa zip-bomba no project.json", async () => {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify({ targets: [{ isStage: true, pad: "x".repeat(11 * 1024 * 1024) }] }));
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    expect(bytes.byteLength).toBeLessThan(1024 * 1024);
    await expect(modelFromSb3(bytes)).rejects.toThrow(/grande demais/);
  });
});
