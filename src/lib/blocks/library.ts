// Biblioteca de personagens, cenários e sons ORIGINAIS da plataforma (desenhados em código,
// sem arte de terceiros). Este arquivo é só dados: serve ao servidor (verificação) e ao navegador.
// O desenho de cada fantasia fica em src/components/editor/art.ts.

export type CharacterId =
  | "bloquinho" | "moeda" | "estrela" | "glitch" | "nave" | "meteoro" | "bola" | "bandeira" | "parede" | "botao" | "coracao" | "fruta";

export type Character = {
  id: CharacterId;
  name: string;
  /** Nomes das fantasias, na ordem. */
  costumes: string[];
  /** Raio aproximado (px, tamanho 100%) usado em colisões. */
  radius: number;
};

export const CHARACTERS: Record<CharacterId, Character> = {
  bloquinho: { id: "bloquinho", name: "Bloquinho", costumes: ["parado", "andando"], radius: 22 },
  moeda: { id: "moeda", name: "Moeda", costumes: ["frente", "lado"], radius: 14 },
  estrela: { id: "estrela", name: "Estrela", costumes: ["amarela", "brilhante"], radius: 16 },
  glitch: { id: "glitch", name: "Glitch", costumes: ["bravo", "piscando"], radius: 22 },
  nave: { id: "nave", name: "Nave", costumes: ["normal", "turbo"], radius: 20 },
  meteoro: { id: "meteoro", name: "Meteoro", costumes: ["pedra", "fogo"], radius: 16 },
  bola: { id: "bola", name: "Bola", costumes: ["azul", "vermelha"], radius: 14 },
  bandeira: { id: "bandeira", name: "Bandeira", costumes: ["verde", "dourada"], radius: 18 },
  parede: { id: "parede", name: "Parede", costumes: ["tijolo", "pedra"], radius: 26 },
  botao: { id: "botao", name: "Botão", costumes: ["jogar", "de novo"], radius: 30 },
  coracao: { id: "coracao", name: "Coração", costumes: ["cheio", "vazio"], radius: 14 },
  fruta: { id: "fruta", name: "Fruta", costumes: ["maçã", "banana"], radius: 14 },
};

export const BACKDROPS = {
  branco: "Branco",
  ceu: "Céu",
  floresta: "Floresta",
  espaco: "Espaço",
  cidade: "Cidade",
  castelo: "Castelo",
  inicio: "Tela de início",
  fim: "Tela de fim",
} as const;
export type BackdropId = keyof typeof BACKDROPS;

/** Sons sintetizados no navegador (Web Audio), sem arquivos de áudio. */
export const SOUNDS = {
  pop: "Pop",
  moeda: "Moeda",
  pulo: "Pulo",
  explosao: "Explosão",
  vitoria: "Vitória",
  derrota: "Derrota",
} as const;
export type SoundId = keyof typeof SOUNDS;

export const KEYS: [label: string, value: string][] = [
  ["espaço", "space"],
  ["seta para cima", "up arrow"],
  ["seta para baixo", "down arrow"],
  ["seta para a direita", "right arrow"],
  ["seta para a esquerda", "left arrow"],
  ["qualquer tecla", "any"],
  ...("abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, c] as [string, string])),
];

export const isCharacter = (v: unknown): v is CharacterId => typeof v === "string" && v in CHARACTERS;
export const isBackdrop = (v: unknown): v is BackdropId => typeof v === "string" && v in BACKDROPS;
