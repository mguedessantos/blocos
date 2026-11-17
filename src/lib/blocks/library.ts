// Biblioteca de personagens, cenários e sons ORIGINAIS da plataforma (desenhados em código,
// sem arte de terceiros). Este arquivo é só dados: serve ao servidor (verificação) e ao navegador.
// O desenho de cada fantasia fica em src/components/editor/art.ts.

import ASSETS from "../sb3/assets.json";

export type CharacterId =
  | "bloquinho" | "moeda" | "estrela" | "glitch" | "nave" | "meteoro" | "bola" | "bandeira" | "parede" | "botao" | "coracao" | "fruta" | "raio" | "raquete" | "muro" | "gomo" | "cabeca";

export type Character = {
  id: CharacterId;
  name: string;
  /** Nomes das fantasias, na ordem. */
  costumes: string[];
  /** Raio aproximado (px, tamanho 100%) usado em colisões. */
  radius: number;
  /** Colisão por caixa (px, tamanho 100%) em vez de círculo: para atores retos, como a raquete. */
  box?: { w: number; h: number };
};

/** Personagens com as fantasias desenhadas em código (art.ts). As fantasias de verdade vêm de assets.json. */
export const DRAWN_CHARACTERS: Record<CharacterId, Character> = {
  bloquinho: { id: "bloquinho", name: "Bloquinho", costumes: ["parado", "andando"], radius: 45 }, // desenho SVG de 100×100 (scripts/arte/bloquinho)
  moeda: { id: "moeda", name: "Moeda", costumes: ["frente", "lado"], radius: 14 },
  estrela: { id: "estrela", name: "Estrela", costumes: ["amarela", "brilhante"], radius: 16 },
  glitch: { id: "glitch", name: "Glitch", costumes: ["bravo", "piscando"], radius: 26 },
  nave: { id: "nave", name: "Nave", costumes: ["normal", "turbo"], radius: 20 },
  meteoro: { id: "meteoro", name: "Meteoro", costumes: ["pedra", "fogo"], radius: 16 },
  bola: { id: "bola", name: "Bola", costumes: ["azul", "vermelha"], radius: 14 },
  bandeira: { id: "bandeira", name: "Bandeira", costumes: ["verde", "dourada"], radius: 18 },
  parede: { id: "parede", name: "Parede", costumes: ["tijolo", "pedra"], radius: 26 },
  botao: { id: "botao", name: "Botão", costumes: ["jogar", "de novo"], radius: 30 },
  coracao: { id: "coracao", name: "Coração", costumes: ["cheio", "vazio"], radius: 14 },
  fruta: { id: "fruta", name: "Fruta", costumes: ["maçã", "banana"], radius: 14 },
  raio: { id: "raio", name: "Raio", costumes: ["vermelho", "roxo"], radius: 8 },
  raquete: { id: "raquete", name: "Raquete", costumes: ["azul", "laranja"], radius: 48, box: { w: 96, h: 14 } },
  cabeca: { id: "cabeca", name: "Cabeça", costumes: ["verde", "amarela"], radius: 7, box: { w: 14, h: 14 } }, // cabeça da cobrinha (do tamanho de um gomo)
  gomo: { id: "gomo", name: "Gomo", costumes: ["verde", "amarelo"], radius: 7, box: { w: 14, h: 14 } }, // pedaço do corpo da cobrinha (14 px com o contorno: 6 px de folga entre gomos vizinhos)
  muro: { id: "muro", name: "Muro", costumes: ["pedra", "tijolo"], radius: 48, box: { w: 96, h: 14 } }, // pedaço de parede do labirinto
};

// As fantasias (quantas e com que nome) seguem a arte exportada: scripts/arte/<ator>/1-nome.png, 2-nome.png...
export const CHARACTERS = Object.fromEntries(
  Object.entries(DRAWN_CHARACTERS).map(([id, ch]) => {
    const art = (ASSETS.characters as Record<string, { name: string }[]>)[id];
    return [id, { ...ch, costumes: art?.length ? art.map((c) => c.name) : ch.costumes }];
  }),
) as Record<CharacterId, Character>;

export const BACKDROPS = {
  branco: "Branco",
  grade: "Grade x e y",
  ceu: "Céu",
  floresta: "Floresta",
  espaco: "Espaço",
  cidade: "Cidade",
  castelo: "Castelo",
  inicio: "Tela de início",
  fim: "Tela de fim",
  concluido: "Concluído",
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

export const isCharacter = (v: unknown): v is CharacterId => typeof v === "string" && v in CHARACTERS;
export const isBackdrop = (v: unknown): v is BackdropId => typeof v === "string" && v in BACKDROPS;
