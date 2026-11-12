// Representação neutra de um programa de blocos. Vem do editor (estado JSON do Blockly) e,
// na fase 6, também de arquivos .sb3 — o interpretador e o verificador só conhecem este formato.

export type Expr =
  | { kind: "lit"; value: string | number }
  | { kind: "var"; name: string }
  | { kind: "op"; opcode: string; args: Record<string, Expr> };

export type Stmt = {
  opcode: string;
  args: Record<string, Expr>;
  variable?: string;
  substack?: Stmt[];
  substack2?: Stmt[];
};

export type Script = { hat: string; body: Stmt[] };

export type Program = {
  scripts: Script[];
  /** Quantas vezes cada opcode aparece (inclui blocos soltos e repórteres; não inclui sombras). */
  opcodeCounts: Record<string, number>;
  /** Total de blocos (sem contar sombras). */
  blockCount: number;
};

// ───────────── Estado serializado do Blockly (workspace.save) ─────────────

type BlocklyInput = { block?: BlocklyBlock; shadow?: BlocklyBlock };
export type BlocklyBlock = {
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, BlocklyInput>;
  next?: { block?: BlocklyBlock };
};
export type BlocklyState = {
  blocks?: { blocks?: BlocklyBlock[] };
  variables?: { id: string; name: string }[];
};

const SHADOW_TYPES = new Set(["math_number", "text"]);
const MAX_DEPTH = 200;
const MAX_BLOCKS = 2000;

export function programFromBlockly(state: BlocklyState): Program {
  // A entrada vem do navegador: tudo é conferido antes de usar.
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  const vars = Array.isArray(state?.variables) ? state.variables.filter(isObj) : [];
  const varNames = new Map(vars.map((v) => [String(v.id), String(v.name).slice(0, 50)]));
  const opcodeCounts: Record<string, number> = Object.create(null); // sem protótipo: nomes vêm do usuário
  let blockCount = 0;

  const count = (opcode: string) => {
    opcodeCounts[opcode] = (opcodeCounts[opcode] ?? 0) + 1;
    blockCount++;
  };

  const varName = (field: unknown) => {
    if (field && typeof field === "object" && "id" in field) return varNames.get(String(field.id)) ?? "?";
    return typeof field === "string" ? field : "?";
  };

  function expr(input: BlocklyInput | undefined, depth: number): Expr {
    const b = isObj(input) ? (input.block ?? input.shadow) : undefined;
    if (!isObj(b) || typeof b.type !== "string" || depth > MAX_DEPTH) return { kind: "lit", value: "" };
    if (SHADOW_TYPES.has(b.type)) {
      const raw = b.fields?.NUM ?? b.fields?.TEXT ?? "";
      return { kind: "lit", value: typeof raw === "number" ? raw : String(raw).slice(0, 200) };
    }
    count(b.type);
    if (b.type === "data_variable") return { kind: "var", name: varName(b.fields?.VARIABLE) };
    const args: Record<string, Expr> = {};
    for (const [name, inp] of Object.entries(isObj(b.inputs) ? b.inputs : {})) args[name] = expr(inp, depth + 1);
    return { kind: "op", opcode: b.type, args };
  }

  function chain(first: BlocklyBlock | undefined, depth: number): Stmt[] {
    const out: Stmt[] = [];
    let b = first;
    while (isObj(b) && typeof b.type === "string" && depth <= MAX_DEPTH && blockCount < MAX_BLOCKS) {
      count(b.type);
      const stmt: Stmt = { opcode: b.type, args: {} };
      for (const [name, inp] of Object.entries(isObj(b.inputs) ? b.inputs : {})) {
        if (name === "SUBSTACK") stmt.substack = chain(inp?.block, depth + 1);
        else if (name === "SUBSTACK2") stmt.substack2 = chain(inp?.block, depth + 1);
        else stmt.args[name] = expr(inp, depth + 1);
      }
      if (isObj(b.fields) && b.fields.VARIABLE !== undefined) stmt.variable = varName(b.fields.VARIABLE);
      out.push(stmt);
      b = isObj(b.next) ? b.next.block : undefined;
    }
    return out;
  }

  const scripts: Script[] = [];
  const tops = isObj(state?.blocks) && Array.isArray(state.blocks.blocks) ? state.blocks.blocks : [];
  for (const top of tops) {
    const [hat, ...body] = chain(top, 0);
    // Blocos soltos (sem bloco de evento no topo) contam no total, mas não executam.
    if (hat?.opcode.startsWith("event_when")) scripts.push({ hat: hat.opcode, body });
  }
  return { scripts, opcodeCounts, blockCount };
}
