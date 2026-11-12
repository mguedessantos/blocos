// Catálogo de blocos no estilo Scratch. Os opcodes são os MESMOS do Scratch (motion_movesteps...),
// assim uma mesma especificação de verificação serve para o editor e para arquivos .sb3.
// Este arquivo é só dados: pode ser importado no servidor (sem Blockly).

export type Category = "eventos" | "movimento" | "aparencia" | "controle" | "sensores" | "operadores" | "variaveis" | "caneta";

export const CATEGORIES: Record<Category, { name: string; colour: string }> = {
  eventos: { name: "Eventos", colour: "#FFBF00" },
  movimento: { name: "Movimento", colour: "#4C97FF" },
  aparencia: { name: "Aparência", colour: "#9966FF" },
  controle: { name: "Controle", colour: "#FFAB19" },
  sensores: { name: "Sensores", colour: "#5CB1D6" },
  operadores: { name: "Operadores", colour: "#59C059" },
  variaveis: { name: "Variáveis", colour: "#FF8C1A" },
  caneta: { name: "Caneta", colour: "#0FBD8C" },
};

type Arg =
  | { type: "input_value"; name: string; check?: string }
  | { type: "input_statement"; name: string }
  | { type: "field_variable"; name: string; variable: string };

export type BlockDef = {
  opcode: string;
  category: Category;
  /** Texto do bloco; %1, %2... são as entradas, na ordem de `args`. "|" quebra em linhas (para C-blocks). */
  text: string;
  args?: Arg[];
  shape: "hat" | "stack" | "c" | "reporter" | "boolean";
  /** Valores padrão das entradas numéricas/texto (viram "sombras" editáveis). */
  defaults?: Record<string, number | string>;
  /** Explicação para crianças, usada no painel "Como funciona este bloco". */
  help: string;
};

const num = (name: string): Arg => ({ type: "input_value", name });
const bool = (name: string): Arg => ({ type: "input_value", name, check: "Boolean" });
const stack = (name: string): Arg => ({ type: "input_statement", name });
const variable: Arg = { type: "field_variable", name: "VARIABLE", variable: "pontos" };

export const BLOCKS: BlockDef[] = [
  // Eventos
  { opcode: "event_whenflagclicked", category: "eventos", shape: "hat", text: "quando 🏁 for clicado",
    help: "Começa o programa quando você clica na bandeira verde. Todo programa precisa de um bloco de início!" },

  // Movimento
  { opcode: "motion_movesteps", category: "movimento", shape: "stack", text: "mover %1 passos", args: [num("STEPS")], defaults: { STEPS: 10 },
    help: "Anda para a frente, na direção em que o personagem está olhando. Números negativos andam para trás." },
  { opcode: "motion_turnright", category: "movimento", shape: "stack", text: "girar ↻ %1 graus", args: [num("DEGREES")], defaults: { DEGREES: 15 },
    help: "Gira para a direita (sentido do relógio). 90 graus é uma virada de esquina; 360 é uma volta inteira." },
  { opcode: "motion_turnleft", category: "movimento", shape: "stack", text: "girar ↺ %1 graus", args: [num("DEGREES")], defaults: { DEGREES: 15 },
    help: "Gira para a esquerda (contra o relógio)." },
  { opcode: "motion_gotoxy", category: "movimento", shape: "stack", text: "ir para x: %1 y: %2", args: [num("X"), num("Y")], defaults: { X: 0, Y: 0 },
    help: "Pula direto para um ponto do palco. x vai de -240 (esquerda) a 240 (direita); y vai de -180 (baixo) a 180 (cima)." },
  { opcode: "motion_changexby", category: "movimento", shape: "stack", text: "adicionar %1 a x", args: [num("DX")], defaults: { DX: 10 },
    help: "Anda para os lados: números positivos vão para a direita, negativos para a esquerda." },
  { opcode: "motion_changeyby", category: "movimento", shape: "stack", text: "adicionar %1 a y", args: [num("DY")], defaults: { DY: 10 },
    help: "Anda para cima (positivo) ou para baixo (negativo)." },
  { opcode: "motion_setx", category: "movimento", shape: "stack", text: "mudar x para %1", args: [num("X")], defaults: { X: 0 },
    help: "Coloca o personagem numa posição exata na horizontal." },
  { opcode: "motion_sety", category: "movimento", shape: "stack", text: "mudar y para %1", args: [num("Y")], defaults: { Y: 0 },
    help: "Coloca o personagem numa posição exata na vertical." },
  { opcode: "motion_pointindirection", category: "movimento", shape: "stack", text: "apontar para a direção %1", args: [num("DIRECTION")], defaults: { DIRECTION: 90 },
    help: "Vira para uma direção: 90 = direita, -90 = esquerda, 0 = cima, 180 = baixo." },
  { opcode: "motion_ifonedgebounce", category: "movimento", shape: "stack", text: "se tocar na borda, volte",
    help: "Se o personagem encostar na borda do palco, ele vira e volta, como uma bola quicando." },
  { opcode: "motion_xposition", category: "movimento", shape: "reporter", text: "posição x",
    help: "Diz onde o personagem está na horizontal." },
  { opcode: "motion_yposition", category: "movimento", shape: "reporter", text: "posição y",
    help: "Diz onde o personagem está na vertical." },

  // Aparência
  { opcode: "looks_sayforsecs", category: "aparencia", shape: "stack", text: "diga %1 por %2 segundos", args: [num("MESSAGE"), num("SECS")], defaults: { MESSAGE: "Olá!", SECS: 2 },
    help: "Mostra um balão de fala por alguns segundos e depois continua o programa." },
  { opcode: "looks_say", category: "aparencia", shape: "stack", text: "diga %1", args: [num("MESSAGE")], defaults: { MESSAGE: "Olá!" },
    help: "Mostra um balão de fala que fica na tela." },
  { opcode: "looks_show", category: "aparencia", shape: "stack", text: "mostre", help: "Faz o personagem aparecer." },
  { opcode: "looks_hide", category: "aparencia", shape: "stack", text: "esconda", help: "Faz o personagem sumir (ele continua lá, só não aparece)." },
  { opcode: "looks_changesizeby", category: "aparencia", shape: "stack", text: "mudar tamanho em %1", args: [num("CHANGE")], defaults: { CHANGE: 10 },
    help: "Deixa o personagem maior (positivo) ou menor (negativo)." },
  { opcode: "looks_setsizeto", category: "aparencia", shape: "stack", text: "mudar tamanho para %1 %", args: [num("SIZE")], defaults: { SIZE: 100 },
    help: "Define o tamanho exato. 100% é o tamanho normal." },

  // Controle
  { opcode: "control_wait", category: "controle", shape: "stack", text: "espere %1 segundos", args: [num("DURATION")], defaults: { DURATION: 1 },
    help: "Pausa o programa por um tempinho." },
  { opcode: "control_repeat", category: "controle", shape: "c", text: "repita %1 vezes|%2", args: [num("TIMES"), stack("SUBSTACK")], defaults: { TIMES: 10 },
    help: "Repete os blocos de dentro várias vezes. Em vez de colocar o mesmo bloco 4 vezes, use repita 4!" },
  { opcode: "control_forever", category: "controle", shape: "c", text: "sempre|%1", args: [stack("SUBSTACK")],
    help: "Repete os blocos de dentro para sempre (até você parar o programa)." },
  { opcode: "control_repeat_until", category: "controle", shape: "c", text: "repita até que %1|%2", args: [bool("CONDITION"), stack("SUBSTACK")],
    help: "Repete os blocos de dentro até a condição ficar verdadeira. Aí o programa segue em frente." },
  { opcode: "control_if", category: "controle", shape: "c", text: "se %1 então|%2", args: [bool("CONDITION"), stack("SUBSTACK")],
    help: "Só executa os blocos de dentro se a condição for verdadeira." },
  { opcode: "control_if_else", category: "controle", shape: "c", text: "se %1 então|%2|senão|%3", args: [bool("CONDITION"), stack("SUBSTACK"), stack("SUBSTACK2")],
    help: "Se a condição for verdadeira, faz a primeira parte; se não, faz a parte do “senão”." },

  // Sensores
  { opcode: "sensing_touchingobject", category: "sensores", shape: "boolean", text: "tocando na borda?",
    help: "Verdadeiro quando o personagem encosta na borda do palco." },

  // Operadores
  { opcode: "operator_add", category: "operadores", shape: "reporter", text: "%1 + %2", args: [num("NUM1"), num("NUM2")], defaults: { NUM1: "", NUM2: "" }, help: "Soma dois números." },
  { opcode: "operator_subtract", category: "operadores", shape: "reporter", text: "%1 - %2", args: [num("NUM1"), num("NUM2")], defaults: { NUM1: "", NUM2: "" }, help: "Subtrai o segundo número do primeiro." },
  { opcode: "operator_multiply", category: "operadores", shape: "reporter", text: "%1 × %2", args: [num("NUM1"), num("NUM2")], defaults: { NUM1: "", NUM2: "" }, help: "Multiplica dois números." },
  { opcode: "operator_divide", category: "operadores", shape: "reporter", text: "%1 ÷ %2", args: [num("NUM1"), num("NUM2")], defaults: { NUM1: "", NUM2: "" }, help: "Divide o primeiro número pelo segundo." },
  { opcode: "operator_random", category: "operadores", shape: "reporter", text: "número aleatório entre %1 e %2", args: [num("FROM"), num("TO")], defaults: { FROM: 1, TO: 10 },
    help: "Sorteia um número, como um dado." },
  { opcode: "operator_gt", category: "operadores", shape: "boolean", text: "%1 > %2", args: [num("OPERAND1"), num("OPERAND2")], defaults: { OPERAND1: "", OPERAND2: 50 }, help: "Verdadeiro se o primeiro for maior que o segundo." },
  { opcode: "operator_lt", category: "operadores", shape: "boolean", text: "%1 < %2", args: [num("OPERAND1"), num("OPERAND2")], defaults: { OPERAND1: "", OPERAND2: 50 }, help: "Verdadeiro se o primeiro for menor que o segundo." },
  { opcode: "operator_equals", category: "operadores", shape: "boolean", text: "%1 = %2", args: [num("OPERAND1"), num("OPERAND2")], defaults: { OPERAND1: "", OPERAND2: 50 }, help: "Verdadeiro se os dois forem iguais." },
  { opcode: "operator_and", category: "operadores", shape: "boolean", text: "%1 e %2", args: [bool("OPERAND1"), bool("OPERAND2")], help: "Verdadeiro só se as DUAS condições forem verdadeiras." },
  { opcode: "operator_or", category: "operadores", shape: "boolean", text: "%1 ou %2", args: [bool("OPERAND1"), bool("OPERAND2")], help: "Verdadeiro se PELO MENOS UMA das condições for verdadeira." },
  { opcode: "operator_not", category: "operadores", shape: "boolean", text: "não %1", args: [bool("OPERAND")], help: "Inverte a condição: o que era verdadeiro vira falso." },
  { opcode: "operator_mod", category: "operadores", shape: "reporter", text: "resto de %1 ÷ %2", args: [num("NUM1"), num("NUM2")], defaults: { NUM1: "", NUM2: 2 },
    help: "O que sobra numa divisão. Resto de um número ÷ 2 é 0 para pares e 1 para ímpares!" },
  { opcode: "operator_round", category: "operadores", shape: "reporter", text: "arredondar %1", args: [num("NUM")], defaults: { NUM: "" }, help: "Arredonda para o número inteiro mais próximo." },
  { opcode: "operator_join", category: "operadores", shape: "reporter", text: "junte %1 com %2", args: [num("STRING1"), num("STRING2")], defaults: { STRING1: "maçã ", STRING2: "banana" },
    help: "Junta dois textos num só." },

  // Variáveis
  { opcode: "data_variable", category: "variaveis", shape: "reporter", text: "%1", args: [variable], help: "Mostra o valor guardado na variável." },
  { opcode: "data_setvariableto", category: "variaveis", shape: "stack", text: "mude %1 para %2", args: [variable, num("VALUE")], defaults: { VALUE: 0 },
    help: "Guarda um valor numa variável — como escrever num papelzinho com nome." },
  { opcode: "data_changevariableby", category: "variaveis", shape: "stack", text: "adicione %2 a %1", args: [variable, num("VALUE")], defaults: { VALUE: 1 },
    help: "Soma um número ao valor da variável (ótimo para contar pontos!)." },

  // Caneta (extensão)
  { opcode: "pen_penDown", category: "caneta", shape: "stack", text: "✏️ abaixar a caneta", help: "A partir de agora, o personagem desenha por onde anda." },
  { opcode: "pen_penUp", category: "caneta", shape: "stack", text: "✏️ levantar a caneta", help: "Para de desenhar." },
  { opcode: "pen_clear", category: "caneta", shape: "stack", text: "✏️ apagar tudo", help: "Apaga todos os desenhos do palco." },
];

export const BLOCKS_BY_OPCODE = new Map(BLOCKS.map((b) => [b.opcode, b]));

/** Nome amigável do bloco para mensagens (“mover 10 passos” → “mover _ passos”). */
export function blockLabel(opcode: string) {
  const def = BLOCKS_BY_OPCODE.get(opcode);
  if (!def) return opcode;
  return def.text.split("|")[0].replace(/%\d/g, "_").trim();
}
