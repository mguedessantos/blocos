"use client";

import * as Blockly from "blockly/core";
import "blockly/blocks"; // math_number e text (usados como “sombras” editáveis)
import * as ptBr from "blockly/msg/pt-br";
import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { BLOCKS, CATEGORIES, type BlockDef, type Category } from "@/lib/blocks/catalog";
import type { BlocklyState } from "@/lib/blocks/program";

let registered = false;

function toBlocklyJson(def: BlockDef) {
  const json: Record<string, unknown> = { type: def.opcode, colour: CATEGORIES[def.category].colour, tooltip: def.help, inputsInline: true };
  const args = def.args ?? [];
  def.text.split("|").forEach((part, line) => {
    const used: unknown[] = [];
    json[`message${line}`] = part.replace(/%(\d)/g, (_, i) => {
      used.push(args[Number(i) - 1]);
      return `%${used.length}`;
    });
    if (used.length) json[`args${line}`] = used;
  });
  if (def.shape === "hat") json.nextStatement = null;
  if (def.shape === "stack" || def.shape === "c") {
    json.previousStatement = null;
    if (def.opcode !== "control_forever") json.nextStatement = null;
  }
  if (def.shape === "reporter") json.output = null;
  if (def.shape === "boolean") json.output = "Boolean";
  return json;
}

function registerBlocks() {
  if (registered) return;
  Blockly.setLocale(ptBr as unknown as Record<string, string>);
  Blockly.defineBlocksWithJsonArray(BLOCKS.map(toBlocklyJson));
  registered = true;
}

function toolboxFor(allowed: string[]) {
  const allowAll = allowed.length === 0;
  const byCat = new Map<Category, BlockDef[]>();
  for (const b of BLOCKS) {
    if (!allowAll && !allowed.includes(b.opcode)) continue;
    byCat.set(b.category, [...(byCat.get(b.category) ?? []), b]);
  }
  return {
    kind: "categoryToolbox",
    contents: [...byCat].map(([cat, blocks]) => ({
      kind: "category",
      name: CATEGORIES[cat].name,
      colour: CATEGORIES[cat].colour,
      contents: blocks.map((b) => ({
        kind: "block",
        type: b.opcode,
        inputs: Object.fromEntries(
          Object.entries(b.defaults ?? {}).map(([name, v]) => [
            name,
            { shadow: typeof v === "number" ? { type: "math_number", fields: { NUM: v } } : { type: "text", fields: { TEXT: v } } },
          ]),
        ),
      })),
    })),
  };
}

export type BlockEditorHandle = { getState: () => BlocklyState; reset: () => void };

type Props = {
  handle: RefObject<BlockEditorHandle | null>;
  allowedBlocks: string[];
  initialState: BlocklyState | null;
  starterState: BlocklyState | null;
  onChange?: (state: BlocklyState) => void;
};

export default function BlockEditor({ handle, allowedBlocks, initialState, starterState, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const ws = useRef<Blockly.WorkspaceSvg | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(handle, () => ({
    getState: () => (ws.current ? (Blockly.serialization.workspaces.save(ws.current) as BlocklyState) : {}),
    reset: () => {
      if (!ws.current) return;
      ws.current.clear();
      if (starterState) Blockly.serialization.workspaces.load(starterState, ws.current);
    },
  }));

  useEffect(() => {
    if (!host.current) return;
    registerBlocks();
    const workspace = Blockly.inject(host.current, {
      toolbox: toolboxFor(allowedBlocks),
      renderer: "zelos",
      trashcan: true,
      zoom: { controls: true, wheel: true, startScale: 0.8 },
      move: { scrollbars: true, drag: true, wheel: false },
      grid: { spacing: 24, length: 2, colour: "#e5e7eb", snap: true },
      sounds: false,
    });
    ws.current = workspace;
    const start = initialState ?? starterState;
    try {
      if (start) Blockly.serialization.workspaces.load(start, workspace);
    } catch {
      workspace.clear(); // estado salvo incompatível: começa do zero
    }
    const listener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      onChangeRef.current?.(Blockly.serialization.workspaces.save(workspace) as BlocklyState);
    };
    workspace.addChangeListener(listener);
    const resize = new ResizeObserver(() => Blockly.svgResize(workspace));
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      workspace.dispose();
      ws.current = null;
    };
    // o editor é montado uma vez por lição
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="h-full min-h-[420px] w-full" aria-label="Área de blocos" />;
}
