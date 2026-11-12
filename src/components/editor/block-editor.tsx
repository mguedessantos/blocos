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

// ───────────── Categorias do menu de blocos: círculo colorido + ícone + nome embaixo ─────────────
// Ícones originais desenhados em código (traço de 2px, viewBox 24).
const CATEGORY_ICONS: Record<string, string> = {
  Eventos: "M5 21V4 M5 4h11l-2 4 2 4H5",
  Movimento: "M12 3v18 M3 12h18 M12 3l-3 3 M12 3l3 3 M12 21l-3-3 M12 21l3-3 M3 12l3-3 M3 12l3 3 M21 12l-3-3 M21 12l-3 3",
  Aparência: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
  Som: "M9 18V5l11-2v13 M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M20 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0",
  Controle: "M17 2l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3",
  Sensores: "M5 19a10 10 0 0 1 0-14 M19 5a10 10 0 0 1 0 14 M8 16a6 6 0 0 1 0-8 M16 8a6 6 0 0 1 0 8 M12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2",
  Operadores: "M7 4v6 M4 7h6 M14 7h6 M4 17h6 M14 14l6 6 M20 14l-6 6",
  Variáveis: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  Caneta: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
};

let categoryRegistered = false;
function registerRoundCategory() {
  if (categoryRegistered) return;
  categoryRegistered = true;
  class CategoriaRedonda extends Blockly.ToolboxCategory {
    protected override createIconDom_(): Element {
      const span = document.createElement("span");
      span.className = "blocos-cat-icone";
      span.setAttribute("aria-hidden", "true");
      const d = CATEGORY_ICONS[this.name_] ?? "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16";
      span.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
      return span;
    }
    protected override addColourBorder_(colour: string): void {
      this.rowDiv_?.style.setProperty("--cat", colour);
    }
    override setSelected(isSelected: boolean): void {
      super.setSelected(isSelected);
      if (this.rowDiv_) this.rowDiv_.style.backgroundColor = ""; // o destaque é o anel no círculo (CSS)
    }
  }
  Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, CategoriaRedonda, true);
}

function registerBlocks() {
  registerRoundCategory();
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
  /** Modo escuro da área de blocos (os blocos mantêm as cores de sempre). */
  dark?: boolean;
};

// Temas: só muda o "entorno" (fundo, paleta, barras). As cores dos blocos nunca mudam.
let themes: { claro: Blockly.Theme; noite: Blockly.Theme } | null = null;
function getThemes() {
  if (themes) return themes;
  themes = {
    claro: Blockly.Theme.defineTheme("blocos-claro", {
      name: "blocos-claro",
      base: Blockly.Themes.Classic,
      componentStyles: { workspaceBackgroundColour: "#ffffff", flyoutBackgroundColour: "#ebe7fb", flyoutOpacity: 1, scrollbarColour: "#c9c1ee", insertionMarkerColour: "#7a55f5" },
    }),
    noite: Blockly.Theme.defineTheme("blocos-noite", {
      name: "blocos-noite",
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: "#120f35",
        flyoutBackgroundColour: "#1f1a4d",
        flyoutForegroundColour: "#f4f1ff",
        flyoutOpacity: 1,
        scrollbarColour: "#4a4290",
        insertionMarkerColour: "#ffd84d",
        insertionMarkerOpacity: 0.5,
        cursorColour: "#ffd84d",
      },
    }),
  };
  return themes;
}

export default function BlockEditor({ handle, allowedBlocks, initialState, initialContext, onChange, dark = false }: Props) {
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
    ws.current?.setTheme(dark ? getThemes().noite : getThemes().claro);
  }, [dark]);

  useEffect(() => {
    if (!host.current) return;
    registerBlocks();
    context = initialContext;
    const workspace = Blockly.inject(host.current, {
      toolbox: toolboxFor(allowedBlocks, initialContext.isStage),
      renderer: "zelos",
      theme: dark ? getThemes().noite : getThemes().claro,
      trashcan: true,
      // 1.1: blocos e textos grandes o bastante para as crianças lerem (antes 0.8)
      zoom: { controls: true, wheel: true, startScale: 1.1, minScale: 0.6, maxScale: 2 },
      move: { scrollbars: true, drag: true, wheel: false },
      grid: { spacing: 24, length: 2, colour: "#e5e7eb", snap: true },
      sounds: false,
    });
    ws.current = workspace;
    // Como na referência: a paleta de blocos já começa aberta na primeira categoria.
    (workspace.getToolbox() as Blockly.Toolbox | null)?.selectItemByPosition(0);
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
