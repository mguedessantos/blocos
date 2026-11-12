"use client";

import * as Blockly from "blockly/core";
import "blockly/blocks"; // math_number e text (usados como “sombras” editáveis)
import * as ptBr from "blockly/msg/pt-br";
import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { BLOCKS, CATEGORIES, type BlockDef, type Category, type DynamicMenu } from "@/lib/blocks/catalog";
import { KEYS, SOUNDS } from "@/lib/blocks/library";
import type { BlocklyState } from "@/lib/blocks/program";

/** O que os menus dinâmicos mostram (atualizado pelo editor a cada troca de ator). */
export type EditorContext = {
  sprites: string[];
  self: string;
  costumes: string[];
  backdrops: [label: string, value: string][];
  isStage: boolean;
};

let context: EditorContext = { sprites: [], self: "", costumes: [], backdrops: [["Branco", "branco"]], isStage: false };
let registered = false;

function menuOptions(menu: DynamicMenu): [string, string][] {
  const others = context.sprites.filter((s) => s !== context.self).map((s) => [s, s] as [string, string]);
  switch (menu) {
    case "keys": return KEYS;
    case "sounds": return Object.entries(SOUNDS).map(([v, l]) => [l, v]);
    case "sprites": return others.length ? others : [["(nenhum)", ""]];
    case "touching": return [["borda", "_edge_"], ["ponteiro do mouse", "_mouse_"], ...others];
    case "distance": return [["ponteiro do mouse", "_mouse_"], ...others];
    case "towards": return [["ponteiro do mouse", "_mouse_"], ...others];
    case "goto": return [["posição aleatória", "_random_"], ["ponteiro do mouse", "_mouse_"], ...others];
    case "clone": return [["este ator", "_myself_"], ...others];
    case "costumes": return context.costumes.length ? context.costumes.map((c) => [c, c]) : [["(fantasia)", ""]];
    case "backdrops": return context.backdrops.length ? context.backdrops : [["Branco", "branco"]];
  }
}

/** Menu que lê as opções do projeto na hora em que abre (atores, fantasias, cenários...). */
class DynamicDropdown extends Blockly.FieldDropdown {
  constructor(menu: DynamicMenu | [string, string][]) {
    const gen = function (this: Blockly.FieldDropdown): [string, string][] {
      const opts = Array.isArray(menu) ? menu : menuOptions(menu);
      const current = this?.getValue?.();
      // mantém o valor salvo mesmo que ele não exista mais (ex.: ator renomeado)
      return current && !opts.some(([, v]) => v === current) ? [...opts, [String(current), String(current)]] : opts;
    };
    super(gen as unknown as Blockly.MenuGenerator);
  }
  static fromJson(options: Record<string, unknown>) {
    return new DynamicDropdown(options.menu as DynamicMenu | [string, string][]);
  }
  // aceita qualquer valor (o gerador acima o inclui nas opções)
  protected override doClassValidation_(v?: string) {
    return typeof v === "string" ? v : null;
  }
}

function toBlocklyJson(def: BlockDef) {
  const json: Record<string, unknown> = { type: def.opcode, colour: CATEGORIES[def.category].colour, tooltip: def.help, inputsInline: true };
  const args = def.args ?? [];
  def.text.split("|").forEach((part, line) => {
    const used: unknown[] = [];
    json[`message${line}`] = part.replace(/%(\d)/g, (_, i) => {
      const a = args[Number(i) - 1];
      used.push(a.type === "field_dropdown" ? { type: "field_blocos_menu", name: a.name, menu: a.menu } : a);
      return `%${used.length}`;
    });
    if (used.length) json[`args${line}`] = used;
  });
  if (def.shape === "hat") json.nextStatement = null;
  if (def.shape === "stack" || def.shape === "c") {
    json.previousStatement = null;
    if (def.opcode !== "control_forever") json.nextStatement = null;
  }
  if (def.shape === "cap") json.previousStatement = null;
  if (def.shape === "reporter") json.output = null;
  if (def.shape === "boolean") json.output = "Boolean";
  return json;
}

function registerBlocks() {
  if (registered) return;
  Blockly.setLocale(ptBr as unknown as Record<string, string>);
  Blockly.fieldRegistry.register("field_blocos_menu", DynamicDropdown);
  Blockly.defineBlocksWithJsonArray(BLOCKS.map(toBlocklyJson));
  registered = true;
}

// blocos que não fazem sentido no palco (ele não anda nem tem fantasias)
const SPRITE_ONLY = new Set<Category>(["movimento", "caneta"]);
const SPRITE_ONLY_OPS = new Set([
  "looks_say", "looks_sayforsecs", "looks_show", "looks_hide", "looks_nextcostume", "looks_switchcostumeto", "looks_changesizeby", "looks_setsizeto",
  "event_whenthisspriteclicked", "control_start_as_clone", "control_delete_this_clone", "sensing_touchingobject", "sensing_distanceto",
]);

function toolboxFor(allowed: string[], isStage: boolean) {
  const allowAll = allowed.length === 0;
  const byCat = new Map<Category, BlockDef[]>();
  for (const b of BLOCKS) {
    if (!allowAll && !allowed.includes(b.opcode)) continue;
    if (isStage && (SPRITE_ONLY.has(b.category) || SPRITE_ONLY_OPS.has(b.opcode))) continue;
    byCat.set(b.category, [...(byCat.get(b.category) ?? []), b]);
  }
  return {
    kind: "categoryToolbox",
    contents: [...byCat].map(([cat, blocks]) => ({
      kind: "category",
      name: CATEGORIES[cat].name,
      colour: CATEGORIES[cat].colour,
      contents: [
        ...(cat === "variaveis" ? [{ kind: "button", text: "Criar uma variável", callbackKey: "CRIAR_VARIAVEL" }] : []),
        ...blocks.map((b) => ({
          kind: "block",
          type: b.opcode,
          inputs: Object.fromEntries(
            Object.entries(b.defaults ?? {}).map(([name, v]) => [
              name,
              { shadow: typeof v === "number" ? { type: "math_number", fields: { NUM: v } } : { type: "text", fields: { TEXT: v } } },
            ]),
          ),
        })),
      ],
    })),
  };
}

export type BlockEditorHandle = {
  getState: () => BlocklyState;
  /** Troca o conteúdo da área (ao mudar de ator). */
  load: (state: BlocklyState | null, ctx: EditorContext) => void;
};

type Props = {
  handle: RefObject<BlockEditorHandle | null>;
  allowedBlocks: string[];
  initialState: BlocklyState | null;
  initialContext: EditorContext;
  onChange?: (state: BlocklyState) => void;
};

export default function BlockEditor({ handle, allowedBlocks, initialState, initialContext, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const ws = useRef<Blockly.WorkspaceSvg | null>(null);
  const onChangeRef = useRef(onChange);
  const loading = useRef(false);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const loadInto = (workspace: Blockly.WorkspaceSvg, state: BlocklyState | null) => {
    loading.current = true;
    try {
      workspace.clear();
      if (state) Blockly.serialization.workspaces.load(state, workspace);
    } catch {
      workspace.clear(); // estado salvo incompatível: começa do zero
    } finally {
      loading.current = false;
    }
  };

  useImperativeHandle(handle, () => ({
    getState: () => (ws.current ? (Blockly.serialization.workspaces.save(ws.current) as BlocklyState) : {}),
    load: (state, ctx) => {
      if (!ws.current) return;
      const toolboxChanged = ctx.isStage !== context.isStage;
      context = ctx;
      if (toolboxChanged) ws.current.updateToolbox(toolboxFor(allowedBlocks, ctx.isStage));
      loadInto(ws.current, state);
    },
  }));

  useEffect(() => {
    if (!host.current) return;
    registerBlocks();
    context = initialContext;
    const workspace = Blockly.inject(host.current, {
      toolbox: toolboxFor(allowedBlocks, initialContext.isStage),
      renderer: "zelos",
      trashcan: true,
      // 1.1: blocos e textos grandes o bastante para as crianças lerem (antes 0.8)
      zoom: { controls: true, wheel: true, startScale: 1.1, minScale: 0.6, maxScale: 2 },
      move: { scrollbars: true, drag: true, wheel: false },
      grid: { spacing: 24, length: 2, colour: "#e5e7eb", snap: true },
      sounds: false,
    });
    ws.current = workspace;
    workspace.registerButtonCallback("CRIAR_VARIAVEL", (b) => Blockly.Variables.createVariableButtonHandler(b.getTargetWorkspace()));
    loadInto(workspace, initialState);
    const listener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent || loading.current) return;
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

  return <div ref={host} className="absolute inset-0" aria-label="Área de blocos" />;
}
