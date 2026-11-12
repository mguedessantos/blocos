import type { ReactNode } from "react";

// Ilhas isométricas originais (SVG em código), uma por mundo do curso.
// Tudo é montado com "blocos" isométricos : é o que as crianças programam.

type Pt = [number, number];
const CX = 100, TOP = 40, HW = 80, HH = 40; // losango do topo da ilha

/** Ponto do topo da ilha: u,v de 0 a 1 (u = para a direita/baixo, v = para a esquerda/baixo). */
const iso = (u: number, v: number): Pt => [CX + (u - v) * HW, TOP + (u + v) * HH];
const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Caixa isométrica com base em (u,v), tamanho (w,d) e altura h (px). */
function Box({ u, v, w, d, h, c }: { u: number; v: number; w: number; d: number; h: number; c: string }) {
  const a = iso(u, v), b = iso(u + w, v), cc = iso(u + w, v + d), e = iso(u, v + d);
  const up = (p: Pt): Pt => [p[0], p[1] - h];
  return (
    <g>
      <polygon points={pts([e, cc, up(cc), up(e)])} fill={shade(c, 0.72)} />
      <polygon points={pts([cc, b, up(b), up(cc)])} fill={shade(c, 0.88)} />
      <polygon points={pts([up(a), up(b), up(cc), up(e)])} fill={c} />
    </g>
  );
}

function Tree({ u, v, c = "#3ddc84" }: { u: number; v: number; c?: string }) {
  const [x, y] = iso(u, v);
  return (
    <g>
      <rect x={x - 1.5} y={y - 9} width={3} height={9} fill="#7a4a2a" />
      <circle cx={x} cy={y - 14} r={7} fill={c} />
      <circle cx={x - 2} cy={y - 16} r={3} fill={shade(c, 1.25)} />
    </g>
  );
}

type Theme = { grass: string; earth: string; draw: () => ReactNode };

const THEMES: Theme[] = [
  // 1 · Vila do Palco: casinhas e um palco com cortina
  { grass: "#55d97a", earth: "#8a5a3b", draw: () => (<>
    <Box u={0.18} v={0.18} w={0.22} d={0.2} h={18} c="#ff8a5c" />
    <Box u={0.55} v={0.15} w={0.3} d={0.22} h={14} c="#ffd84d" />
    <rect x={iso(0.6, 0.18)[0] - 6} y={iso(0.6, 0.18)[1] - 22} width={22} height={8} rx={2} fill="#d6286f" />
    <Box u={0.25} v={0.6} w={0.18} d={0.18} h={16} c="#7ab8ff" />
    <Tree u={0.75} v={0.62} /><Tree u={0.82} v={0.4} />
  </>) },
  // 2 · Torre das Repetições: torre alta de blocos empilhados
  { grass: "#4fc2ff", earth: "#5b4a8a", draw: () => (<>
    {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(0 ${-i * 15})`}><Box u={0.38} v={0.38} w={0.24} d={0.24} h={15} c={i % 2 ? "#8b6cff" : "#b39cff"} /></g>)}
    <Tree u={0.15} v={0.7} c="#3ddc84" /><Tree u={0.8} v={0.2} c="#3ddc84" />
  </>) },
  // 3 · Personagens com Vida: praça com estátuas/personagens coloridos
  { grass: "#ff9ec7", earth: "#7a3f6e", draw: () => (<>
    {[[0.25, 0.3, "#ffd84d"], [0.6, 0.25, "#4fc2ff"], [0.45, 0.6, "#2bd39e"], [0.75, 0.6, "#ff6b6b"]].map(([u, v, c], i) => {
      const [x, y] = iso(u as number, v as number);
      return <g key={i}><ellipse cx={x} cy={y} rx={9} ry={4} fill="rgb(0 0 0 / 0.18)" /><rect x={x - 7} y={y - 22} width={14} height={18} rx={6} fill={c as string} /><circle cx={x - 3} cy={y - 15} r={2} fill="#0d0b2a" /><circle cx={x + 3} cy={y - 15} r={2} fill="#0d0b2a" /></g>;
    })}
  </>) },
  // 4 · Ponte das Decisões: rio que divide a ilha e uma ponte
  { grass: "#7be0a0", earth: "#6e5a3a", draw: () => (<>
    <polygon points={pts([iso(0.42, 0), iso(0.58, 0), iso(0.58, 1), iso(0.42, 1)])} fill="#3ab3ff" />
    <Box u={0.36} v={0.42} w={0.28} d={0.14} h={6} c="#c98a4b" />
    <Box u={0.12} v={0.15} w={0.2} d={0.2} h={14} c="#ffd84d" />
    <Box u={0.7} v={0.62} w={0.2} d={0.18} h={14} c="#ff8a5c" />
    <Tree u={0.18} v={0.72} /><Tree u={0.8} v={0.2} />
  </>) },
  // 5 · Cidade dos Comandos: prédios de alturas diferentes
  { grass: "#9aa7c7", earth: "#3a3f66", draw: () => (<>
    <Box u={0.12} v={0.12} w={0.2} d={0.2} h={34} c="#4fc2ff" />
    <Box u={0.42} v={0.1} w={0.2} d={0.22} h={50} c="#8b6cff" />
    <Box u={0.7} v={0.15} w={0.18} d={0.2} h={26} c="#ff5c8a" />
    <Box u={0.2} v={0.52} w={0.22} d={0.2} h={22} c="#ffd84d" />
    <Box u={0.58} v={0.55} w={0.24} d={0.22} h={38} c="#2bd39e" />
  </>) },
  // 6 · Observatório dos Sensores: cúpula com telescópio
  { grass: "#5fd4c4", earth: "#40507a", draw: () => {
    const [x, y] = iso(0.5, 0.45);
    return (<>
      <Box u={0.32} v={0.3} w={0.36} d={0.32} h={22} c="#d9dcf5" />
      <path d={`M ${x - 26} ${y - 30} A 26 22 0 0 1 ${x + 26} ${y - 30} Z`} fill="#b9b2e6" />
      <rect x={x + 6} y={y - 60} width={8} height={26} rx={3} transform={`rotate(35 ${x + 10} ${y - 34})`} fill="#7a55f5" />
      <Tree u={0.15} v={0.75} /><Tree u={0.82} v={0.25} />
    </>);
  } },
  // 7 · Cofre dos Pontos: cofre com moedas
  { grass: "#ffd84d", earth: "#8a6a2a", draw: () => {
    const [x, y] = iso(0.5, 0.45);
    return (<>
      <Box u={0.3} v={0.3} w={0.4} d={0.34} h={32} c="#8b6cff" />
      <circle cx={x + 18} cy={y - 18} r={8} fill="#ffd84d" stroke="#0d0b2a" strokeWidth={2} />
      {[[0.2, 0.75], [0.3, 0.8], [0.78, 0.7]].map(([u, v], i) => { const [cx, cy] = iso(u, v); return <ellipse key={i} cx={cx} cy={cy - 3} rx={6} ry={3.5} fill="#ffe680" stroke="#c99a1a" />; })}
    </>);
  } },
  // 8 · Fortaleza do Glitch: muralha com torres e "pixels" quebrados
  { grass: "#b06cff", earth: "#40266e", draw: () => (<>
    <Box u={0.15} v={0.15} w={0.14} d={0.14} h={34} c="#7f8aa8" />
    <Box u={0.71} v={0.15} w={0.14} d={0.14} h={34} c="#7f8aa8" />
    <Box u={0.29} v={0.17} w={0.42} d={0.1} h={22} c="#a3acc6" />
    <Box u={0.4} v={0.45} w={0.2} d={0.2} h={40} c="#5c6688" />
    {[[0.22, 0.65, "#ff5c8a"], [0.3, 0.72, "#2bd39e"], [0.72, 0.62, "#4fc2ff"]].map(([u, v, c], i) => <Box key={i} u={u as number} v={v as number} w={0.07} d={0.07} h={7} c={c as string} />)}
  </>) },
  // 9 · Forja dos Jogos: oficina com chaminé e fogo
  { grass: "#ff9a5c", earth: "#6e3a24", draw: () => {
    const [x, y] = iso(0.62, 0.32);
    return (<>
      <Box u={0.28} v={0.25} w={0.4} d={0.32} h={26} c="#c98a6b" />
      <Box u={0.56} v={0.26} w={0.1} d={0.1} h={52} c="#6e4a3a" />
      <path d={`M ${x - 4} ${y - 58} q 6 -14 2 -24 q 10 10 8 22 z`} fill="#ffd84d" />
      <path d={`M ${x - 2} ${y - 58} q 4 -8 1 -14 q 6 6 5 13 z`} fill="#ff5c8a" />
      <Box u={0.2} v={0.66} w={0.14} d={0.12} h={10} c="#4fc2ff" />
    </>);
  } },
  // 10 · O Grande Torneio: arena com bandeiras
  { grass: "#ff5c8a", earth: "#5a2448", draw: () => {
    const [x, y] = iso(0.5, 0.5);
    return (<>
      <ellipse cx={x} cy={y} rx={52} ry={26} fill="#ffd84d" />
      <ellipse cx={x} cy={y} rx={40} ry={19} fill="#ff9ec7" />
      <ellipse cx={x} cy={y - 10} rx={52} ry={26} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 5" />
      {[-40, 0, 40].map((dx, i) => <g key={i}><rect x={x + dx - 1} y={y - 52} width={2.5} height={30} fill="#f4f1ff" /><polygon points={`${x + dx + 1.5},${y - 52} ${x + dx + 16},${y - 46} ${x + dx + 1.5},${y - 40}`} fill={["#4fc2ff", "#ffd84d", "#2bd39e"][i]} /></g>)}
    </>);
  } },
];

/** Ilha do mundo `index` (1 a 10; outros números repetem os temas). */
export function Island({ index, className = "", title }: { index: number; className?: string; title?: string }) {
  const t = THEMES[(Math.max(1, index) - 1) % THEMES.length];
  const A = iso(0, 0), B = iso(1, 0), C = iso(1, 1), D = iso(0, 1);
  const depth = 26;
  const dn = (p: Pt, k = depth): Pt => [p[0], p[1] + k];
  return (
    <svg viewBox="0 -30 200 230" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {/* brilho embaixo (ilha flutuando no céu) */}
      <ellipse cx={100} cy={188} rx={70} ry={10} fill="#8b6cff" opacity={0.35} />
      {/* rocha */}
      <polygon points={pts([dn(D), dn(C), dn(B), [150, 150], [118, 178], [100, 196], [80, 176], [48, 148]])} fill={shade(t.earth, 0.55)} />
      <polygon points={pts([dn(C), dn(B), [150, 150], [118, 178], [100, 196]])} fill={shade(t.earth, 0.7)} />
      <polygon points={pts([D, C, dn(C), dn(D)])} fill={shade(t.earth, 0.8)} />
      <polygon points={pts([C, B, dn(B), dn(C)])} fill={t.earth} />
      {/* grama com borda */}
      <polygon points={pts([A, B, C, D])} fill={t.grass} />
      <polygon points={pts([D, C, [C[0], C[1] + 5], [D[0], D[1] + 5]])} fill={shade(t.grass, 0.8)} />
      <polygon points={pts([C, B, [B[0], B[1] + 5], [C[0], C[1] + 5]])} fill={shade(t.grass, 0.9)} />
      {t.draw()}
    </svg>
  );
}
