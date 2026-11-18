/** Níveis do curso (Track.level). */
export const LEVELS: Record<number, { name: string; text: string; skills: string[] }> = {
  1: {
    name: "Básico", text: "Primeiro contato: movimento, falas, repetição, atores, fantasias e sons.",
    skills: ["Sequência de comandos", "Movimento e coordenadas", "Repetição (laços)", "Atores, cenários, fantasias e sons"],
  },
  2: {
    name: "Intermediário", text: "Decisões, controles, sensores e variáveis: as peças de um jogo.",
    skills: ["Condições (se / senão)", "Controle por teclado e mouse", "Sensores e colisões", "Variáveis e pontuação"],
  },
  3: {
    name: "Avançado", text: "Clones, mensagens, telas, jogos completos e a preparação para a game jam.",
    skills: ["Clones", "Mensagens entre atores", "Telas de início e de fim", "Criação de jogos completos"],
  },
};

/** Habilidades do certificado de participação em Game Jam. */
export const JAM_SKILLS = ["Criação de um jogo em equipe", "Uso do tema proposto", "Documentação do projeto", "Apresentação em vídeo"];

export const LEVEL_NAMES: Record<number, string> = Object.fromEntries(Object.entries(LEVELS).map(([k, v]) => [k, v.name]));
