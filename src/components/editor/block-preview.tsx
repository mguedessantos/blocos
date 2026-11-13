import { Fragment } from "react";
import { CATEGORIES, type BlockDef, type Category, type DynamicMenu } from "@/lib/blocks/catalog";

// Miniatura de um bloco no visual do editor (Scratch/TurboWarp), para o painel "Como funciona cada bloco".

/** Borda (tom mais escuro) de cada categoria, como no editor. */
const BORDER: Record<Category, string> = {
  eventos: "#CC9900", movimento: "#3373CC", aparencia: "#774DCB", som: "#BD42BD", controle: "#CF8B17",
  sensores: "#2E8EB8", operadores: "#389438", variaveis: "#DB6E00", caneta: "#0B8E69",
};
/** O que o menu mostra antes de a criança escolher. */
const MENU_DEFAULT: Record<DynamicMenu, string> = {
  keys: "espaço", sprites: "Ator", touching: "ponteiro do mouse", distance: "ponteiro do mouse", towards: "ponteiro do mouse",
  goto: "posição aleatória", clone: "eu mesmo", costumes: "fantasia", backdrops: "cenário", sounds: "Pop",
};

export function BlockPreview({ def }: { def: BlockDef }) {
  const fill = CATEGORIES[def.category].colour;
  const border = BORDER[def.category];
  const [head, ...rest] = def.text.split("|");

  const arg = (n: number) => {
    const a = def.args?.[n - 1];
    if (!a) return null;
    if (a.type === "input_value") {
      if (a.check === "Boolean") {
        return <span className="inline-block h-5 w-8 align-middle" style={{ background: border, clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }} />;
      }
      return <span className="inline-flex min-w-7 justify-center rounded-full bg-white px-2 text-[#575e75]">{String(def.defaults?.[a.name] ?? "") || " "}</span>;
    }
    if (a.type === "input_statement") return null;
    const label = a.type === "field_variable" ? a.variable : a.type === "field_input" ? "mensagem1" : Array.isArray(a.menu) ? a.menu[0][0] : MENU_DEFAULT[a.menu];
    return <span className="inline-flex items-center gap-1 rounded-full px-2" style={{ background: border }}>{label} <span aria-hidden className="text-[0.6rem]">▼</span></span>;
  };
  const line = (text: string) =>
    text.split(/(%\d)/).map((part, i) => {
      const m = /^%(\d)$/.exec(part);
      if (m) return <Fragment key={i}>{arg(Number(m[1]))}</Fragment>;
      // a bandeira verde do editor no lugar do emoji
      return part.split("🏁").map((t, j) => (
        <Fragment key={`${i}-${j}`}>
          {j > 0 && <svg aria-label="bandeira verde" viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 1v14" stroke="#45993d" strokeWidth="1.6" /><path d="M3.8 2.2c3-1.6 5 1.4 8.6 0v6.4c-3.6 1.4-5.6-1.6-8.6 0z" fill="#4cbf56" stroke="#45993d" /></svg>}
          {t.trim() && <span>{t.trim()}</span>}
        </Fragment>
      ));
    });

  const base = "inline-flex w-fit flex-wrap items-center gap-1.5 border px-2.5 py-1.5 text-[13px] font-medium leading-5 text-white [font-family:Helvetica,Arial,sans-serif]";
  const style = { background: fill, borderColor: border };

  if (def.shape === "reporter") return <span className={`${base} rounded-full`} style={style}>{line(head)}</span>;
  if (def.shape === "boolean") {
    return <span className={`${base} px-4`} style={{ ...style, clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)" }}>{line(head)}</span>;
  }
  if (def.shape === "c") {
    // cabeçalho, braço com a "boca" vazia e o pé do bloco (com "senão", se houver)
    const labels = rest.filter((t) => !/^%\d$/.test(t.trim()));
    return (
      <span className="inline-flex w-fit flex-col" aria-hidden>
        <span className={`${base} rounded-t-md rounded-br-md`} style={style}>{line(head)}</span>
        <span className="flex"><span className="w-4 border-x" style={style} /><span className="h-5 w-16" /></span>
        {labels.map((t, i) => (
          <Fragment key={i}>
            <span className={`${base} rounded-r-md`} style={style}>{line(t)}</span>
            <span className="flex"><span className="w-4 border-x" style={style} /><span className="h-5 w-16" /></span>
          </Fragment>
        ))}
        <span className="h-4 w-24 rounded-b-md border" style={style} />
      </span>
    );
  }
  const radius = def.shape === "hat" ? "rounded-b-md rounded-t-[1.4rem] pt-3" : def.shape === "cap" ? "rounded-t-md rounded-b-sm" : "rounded-md";
  return <span className={`${base} ${radius}`} style={style}>{line(head)}</span>;
}
