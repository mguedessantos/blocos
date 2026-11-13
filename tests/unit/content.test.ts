import { describe, expect, it } from "vitest";
import { OFFICIAL_TRACKS, type LessonContent } from "../../content/trilhas";
import {
  b, backdrop, broadcast, c, changeVar, changeX, changeY, createClone, deleteClone, distanceTo, effect, eq, flag, forever, getVar, goTo, gotoXY,
  gt, hide, iff, ifElse, join, keyPressed, left, lt, move, n, nextCostume, playUntilDone, pointTowards, project, r, random, repeat,
  resetTimer, right, roundOf, say, sayFor, setVar, show, sound, stopAll, t, timer, touching, wait, whenClicked, whenClone, whenKey,
  whenReceive, xpos, ypos, type GameSpec,
} from "@/lib/blocks/build";
import { BLOCKS_BY_OPCODE } from "@/lib/blocks/catalog";
import { compileProject, normalizeProject } from "@/lib/blocks/project";
import { checkModel, checkProject, checksSchema, needsRuntime } from "@/lib/checker";
import { modelFromProjectJson } from "@/lib/sb3/project";
import { projectToSb3Json, sb3JsonToProject } from "@/lib/sb3/convert";
import { projectJson, type Node, type ProjectSpec } from "./sb3-builder";

// ───────────── Soluções de referência das lições do SITE ─────────────
const one = (...body: ReturnType<typeof b>[]): GameSpec => ({ variables: ["pontos"], sprites: [{ name: "Bloquinho", code: [[flag(), ...body]] }] });
const heroControls = () => [flag(), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))];
const heroControls4 = () => [flag(), forever(
  iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)),
  iff(keyPressed("up arrow"), changeY(5)), iff(keyPressed("down arrow"), changeY(-5)),
)];
const touchingHero = () => touching("Bloquinho");
const coinBottom = (...extra: ReturnType<typeof b>[]) => iff(lt(r(ypos()), n(-170)), ...extra, gotoXY(random(-200, 200), 170));

const SOLUTIONS: Record<string, GameSpec> = {
  // Mundo 1
  "primeiros-passos": one(move(100)),
  "virando-a-esquina": one(move(100), left(90), move(100)),
  "pule-para-cima": one(gotoXY(0, 180)),
  "pule-para-baixo": one(gotoXY(0, -180)),
  "pule-para-a-esquerda": one(gotoXY(-240, 0)),
  "pule-para-a-direita": one(gotoXY(240, 0)),
  "pule-para-o-canto": one(gotoXY(150, 100), gotoXY(240, 180)),
  "passeio-com-pausa": one(move(50), wait(1), move(50)),
  "diga-ola": one(sayFor("Olá, eu sou o Bloquinho!", 2), move(50), sayFor("Tchau!", 2)),
  apresentacao: one(sayFor("Oi, eu sou o Bloquinho!"), move(60), wait(1), sayFor("Tchau!")),
  // Mundo 2
  "quadrado-magico": one(repeat(4, move(100), wait(0.5), left(90)), move(50)),
  "dez-passinhos": one(repeat(10, move(10))),
  triangulo: one(repeat(3, move(100), wait(0.5), left(120)), move(50)),
  escada: one(repeat(4, move(30), left(90), move(30), right(90), wait(0.3))),
  "para-sempre": one(b("motion_pointindirection", { DIRECTION: n(45) }), forever(move(5), b("motion_ifonedgebounce"))),
  // Mundo 3
  "um-amigo-no-palco": { sprites: [
    { name: "Bloquinho", x: -100, code: [[flag(), sayFor("Oi, tudo bem?", 2)]] },
    { name: "Estrela", character: "estrela", x: 100, code: [[flag(), wait(2), sayFor("Tudo ótimo!", 2)]] },
  ] },
  "animacao-de-caminhada": { sprites: [{ name: "Bloquinho", x: -180, code: [[flag(), repeat(10, move(10), nextCostume(), wait(0.2))]] }] },
  "troque-o-cenario": { backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag(), sayFor("Vamos passear!", 2), backdrop("floresta")]] }] },
  "sons-no-palco": { sprites: [{ name: "Bloquinho", code: [[flag(), sound("pulo"), move(50), playUntilDone("vitoria")]] }] },
  "show-de-talentos": { backdrops: ["branco", "cidade"], sprites: [
    { name: "Bloquinho", code: [[flag(), backdrop("cidade"), repeat(4, nextCostume(), right(90), wait(0.2)), sound("vitoria"), sayFor("Obrigado!")]] },
    { name: "Estrela", character: "estrela", x: 120 },
  ] },
  // Mundo 4
  "bate-e-volta": one(repeat(30, move(10), iff(b("sensing_touchingobject"), right(180)))),
  "direita-ou-esquerda": one(b("motion_setx", { X: n(150) }), ifElse(gt(r(xpos()), n(0)), [say(t("Direita!"))], [say(t("Esquerda!"))])),
  "volta-ao-mundo": one(repeat(20, changeX(15), iff(gt(r(xpos()), n(150)), b("motion_setx", { X: n(-150) })))),
  "e-ou-nao": one(gotoXY(80, 60), iff(b("operator_and", { OPERAND1: r(gt(r(xpos()), n(0))), OPERAND2: r(gt(r(ypos()), n(0))) }), say(t("Canto de cima!")))),
  "ate-a-borda": one(c("control_repeat_until", { CONDITION: r(b("sensing_touchingobject")) }, [move(5)]), say(t("Cheguei!"))),
  "robo-aspirador": one(forever(move(10), iff(b("sensing_touchingobject"), right(135), move(10)))),
  // Mundo 5
  "setas-do-teclado": { sprites: [{ name: "Bloquinho", code: [[whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)]] }] },
  "voo-em-4-direcoes": { sprites: [{ name: "Bloquinho", code: [
    [whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(-10)], [whenKey("up arrow"), changeY(10)], [whenKey("down arrow"), changeY(-10)],
  ] }] },
  "clique-em-mim": { sprites: [{ name: "Bloquinho", code: [[whenClicked(), sayFor("Ai, que cócegas!", 1)]] }] },
  "controle-suave": { sprites: [{ name: "Bloquinho", x: -150, code: [[flag(), forever(iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)))]] }] },
  "pegue-a-estrela": { sprites: [
    { name: "Bloquinho", x: -150, code: [[flag(), forever(iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)), iff(touching("Estrela"), say(t("Peguei!")), sound("moeda")))]] },
    { name: "Estrela", character: "estrela", x: 150 },
  ] },
  // Mundo 6
  bati: { sprites: [
    { name: "Bloquinho", x: -150, code: [[flag(), forever(move(5), iff(touching("Parede"), say(t("Bati!")), stopAll()))]] },
    { name: "Parede", character: "parede", x: 120 },
  ] },
  radar: { sprites: [
    { name: "Bloquinho", x: -50 },
    { name: "Glitch", character: "glitch", x: 50, code: [[flag(), forever(ifElse(lt(r(distanceTo("Bloquinho")), n(120)), [say(t("Te vi!"))], [say(t(""))]))]] },
  ] },
  "siga-o-mouse": { sprites: [{ name: "Bloquinho", x: 150, y: 100, code: [[flag(), forever(pointTowards("_mouse_"), move(3))]] }] },
  cronometro: { sprites: [{ name: "Bloquinho", code: [[flag(), resetTimer(), wait(2), say(r(roundOf(timer())))]] }] },
  "fuja-do-glitch": { backdrops: ["castelo"], sprites: [
    { name: "Bloquinho", x: -150, code: [heroControls4()] },
    { name: "Glitch", character: "glitch", x: 150, code: [[flag(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), say(t("Peguei você!")), stopAll()))]] },
  ] },
  // Mundo 7
  placar: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(3, changeVar("pontos", n(10)))]] }] },
  "contando-passos": { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(5, move(20), changeVar("pontos", n(1))), say(r(getVar("pontos")))]] }] },
  calculadora: one(say(r(b("operator_multiply", { NUM1: n(7), NUM2: n(8) })))),
  "juntando-palavras": one(say(r(join(t("Olá, "), t("mundo!"))))),
  espiral: { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(10)), repeat(5, b("motion_movesteps", { STEPS: r(getVar("pontos")) }), right(90), changeVar("pontos", n(10)), wait(0.3))]] }] },
  "tabuada-do-3": { variables: ["pontos"], sprites: [{ code: [[flag(), setVar("pontos", n(0)), repeat(10, changeVar("pontos", n(3)), b("looks_sayforsecs", { MESSAGE: r(getVar("pontos")), SECS: n(0.5) }))]] }] },
  "placar-do-jogo": { variables: ["pontos"], sprites: [
    { name: "Bloquinho", x: -150, code: [[flag(), forever(changeX(4), b("motion_ifonedgebounce"))]] },
    { name: "Moeda", character: "moeda", x: 40, code: [[flag(), setVar("pontos", n(0)), forever(iff(touchingHero(), changeVar("pontos", n(1)), sound("moeda"), goTo("_random_")))]] },
  ] },
  // Mundo 8
  invisibilidade: { backdrops: ["castelo"], sprites: [{ name: "Bloquinho", code: [[flag(), repeat(5, hide(), wait(0.3), show(), wait(0.3))]] }] },
  teleporte: { sprites: [{ name: "Bloquinho", code: [[whenClicked(), goTo("_random_"), sound("pop")]] }] },
  mensagens: { sprites: [
    { name: "Botão", character: "botao", y: -110, code: [[whenClicked(), broadcast("começar")]] },
    { name: "Bloquinho", y: 40, code: [[whenReceive("começar"), sayFor("Vamos!", 2)]] },
  ] },
  "exercito-de-clones": { backdrops: ["espaco"], sprites: [{ name: "Meteoro", character: "meteoro", y: 170, code: [
    [flag(), hide(), repeat(5, createClone(), wait(0.5))],
    [whenClone(), show(), gotoXY(random(-200, 200), 170), repeat(35, changeY(-10)), deleteClone()],
  ] }] },
  "telas-do-jogo": { backdrops: ["inicio", "floresta", "fim"], sprites: [
    { name: "Botão", character: "botao", y: -60, code: [[flag(), backdrop("inicio"), show()], [whenClicked(), backdrop("floresta"), broadcast("começar"), hide()]] },
    { name: "Bloquinho", x: -150, y: -120, code: [[whenReceive("começar"), say(t("O jogo começou!"))]] },
  ] },
  "chuva-de-meteoros": { backdrops: ["espaco"], variables: ["desvios"], sprites: [
    { name: "Bloquinho", y: -140, code: [[flag(), setVar("desvios", n(0)), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))], [whenReceive("fim"), say(t("Fim de jogo!")), stopAll()]] },
    { name: "Meteoro", character: "meteoro", y: 170, visible: false, code: [
      [flag(), forever(createClone(), wait(1))],
      [whenClone(), gotoXY(random(-200, 200), 170), show(), repeat(35, changeY(-10), iff(touchingHero(), broadcast("fim"))), changeVar("desvios", n(1)), deleteClone()],
    ] },
  ] },
  // Mundo 9
  "moedas-1-cenario": { backdrops: ["branco", "floresta"], sprites: [{ name: "Bloquinho", code: [[flag(), backdrop("floresta")]] }, { name: "Moeda", character: "moeda", y: 150 }] },
  "moedas-2-heroi": { backdrops: ["floresta"], sprites: [{ name: "Bloquinho", y: -140, code: [heroControls()] }, { name: "Moeda", character: "moeda", y: 170 }] },
  "moedas-3-queda": { backdrops: ["floresta"], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(changeY(-5), coinBottom())]] },
  ] },
  "moedas-4-pontos": { backdrops: ["floresta"], variables: ["pontos"], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
      changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), sound("moeda"), gotoXY(random(-200, 200), 170)), coinBottom(),
    )]] },
  ] },
  "moedas-5-vidas": { backdrops: ["floresta"], variables: ["pontos", "vidas"], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls(), [flag(), setVar("vidas", n(3)), forever(iff(eq(r(getVar("vidas")), n(0)), say(t("Fim de jogo!")), stopAll()))]] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("pontos", n(0)), gotoXY(0, 170), forever(
      changeY(-5), iff(touchingHero(), changeVar("pontos", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(changeVar("vidas", n(-1))),
    )]] },
  ] },
  "fuga-1-arena": { backdrops: ["branco", "castelo"], sprites: [{ name: "Bloquinho", x: -150, code: [heroControls4()] }, { name: "Glitch", character: "glitch", x: 150 }] },
  "fuga-2-perseguicao": { backdrops: ["castelo"], sprites: [
    { name: "Bloquinho", x: -150, code: [heroControls4()] },
    { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(2))]] },
  ] },
  "fuga-3-perigo": { backdrops: ["castelo"], sprites: [
    { name: "Bloquinho", x: -150, code: [heroControls4(), [whenReceive("pegou"), sayFor("Ai!", 1), gotoXY(-150, 0)]] },
    { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
  "fuga-4-fim": { backdrops: ["castelo", "fim"], sprites: [
    { name: "Bloquinho", x: -150, code: [heroControls4(), [flag(), resetTimer(), backdrop("castelo")], [whenReceive("pegou"), backdrop("fim"), say(r(join(t("Você sobreviveu "), r(roundOf(timer()))))), stopAll()]] },
    { name: "Glitch", character: "glitch", x: 150, y: 100, code: [[flag(), forever(pointTowards("Bloquinho"), move(3), iff(touchingHero(), broadcast("pegou")))]] },
  ] },
  // Mundo 10
  "sons-e-efeitos": { backdrops: ["floresta"], variables: ["pontos"], stage: [[flag(), forever(playUntilDone("vitoria"))]], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(
      changeY(-5), iff(touchingHero(), sound("moeda"), effect("color", 25), gotoXY(random(-200, 200), 170)), coinBottom(sound("derrota")),
    )]] },
  ] },
  "dificuldade-crescente": { backdrops: ["floresta"], variables: ["velocidade"], sprites: [
    { name: "Bloquinho", y: -140, code: [heroControls()] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), setVar("velocidade", n(3)), gotoXY(0, 170), forever(
      b("motion_changeyby", { DY: r(b("operator_subtract", { NUM1: n(0), NUM2: r(getVar("velocidade")) })) }),
      iff(touchingHero(), changeVar("velocidade", n(1)), gotoXY(random(-200, 200), 170)), coinBottom(),
    )]] },
  ] },
  "projeto-final": { backdrops: ["inicio", "floresta", "fim"], variables: ["pontos"], sprites: [
    { name: "Bloquinho", y: -140, code: [[flag(), backdrop("floresta"), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))], [whenReceive("pegou"), sound("moeda"), changeVar("pontos", n(1))]] },
    { name: "Moeda", character: "moeda", y: 170, code: [[flag(), gotoXY(0, 170), forever(changeY(-5), iff(touchingHero(), broadcast("pegou"), gotoXY(random(-200, 200), 170)), coinBottom())]] },
    { name: "Glitch", character: "glitch", x: 150, code: [[flag(), hide(), createClone()], [whenClone(), show()]] },
  ] },
};

// Erros comuns que NÃO podem passar.
const WRONG: [string, GameSpec][] = [
  ["quadrado-magico", one(move(100), left(90), move(100), left(90), move(100), left(90), move(100), left(90))],
  ["triangulo", one(repeat(3, move(100), left(90)))],
  ["para-sempre", one(forever(move(5)))],
  ["bate-e-volta", one(repeat(30, move(10)))],
  ["direita-ou-esquerda", one(say(t("Direita!")))],
  ["robo-aspirador", one(forever(move(10)))],
  ["contando-passos", one(repeat(5, move(20)), say(t("5")))],
  ["calculadora", one(say(t("56")))],
  ["setas-do-teclado", { sprites: [{ name: "Bloquinho", code: [[whenKey("right arrow"), changeX(10)], [whenKey("left arrow"), changeX(10)]] }] }],
  ["controle-suave", { sprites: [{ name: "Bloquinho", x: -150, code: [[whenKey("right arrow"), changeX(5)], [whenKey("left arrow"), changeX(-5)]] }] }],
  ["mensagens", { sprites: [
    { name: "Botão", character: "botao", y: -110, code: [[whenClicked(), broadcast("começar")]] },
    { name: "Bloquinho", y: 40, code: [[whenReceive("comecar"), sayFor("Vamos!", 2)]] },
  ] }],
  ["bati", { sprites: [
    { name: "Bloquinho", x: -150, code: [[flag(), forever(move(5), iff(touching("_edge_"), say(t("Bati!")), stopAll()))]] },
    { name: "Parede", character: "parede", x: 120 },
  ] }],
];

// ───────────── Soluções de referência das missões no PictoBlox (.sb3) ─────────────
const F = "event_whenflagclicked";
const sforever = (...sub: Node[]): Node => ({ op: "control_forever", sub });
const siff = (cond: Node, ...sub: Node[]): Node => ({ op: "control_if", inputs: { CONDITION: cond }, sub });
const sKey = (k: string): Node => ({ op: "sensing_keypressed", fields: { KEY_OPTION: [k, null] } });
const sTouching: Node = { op: "sensing_touchingobject" };
const sSay = (text: string): Node => ({ op: "looks_sayforsecs", inputs: { MESSAGE: text, SECS: 2 } });

const SB3_SOLUTIONS: Record<string, ProjectSpec> = {
  "primeiro-projeto": { sprites: [{ scripts: [[F, "motion_movesteps", sSay("Olá, mundo!")]] }] },
  patrulha: { sprites: [{ scripts: [[F, "motion_setrotationstyle", sforever("motion_movesteps", "motion_ifonedgebounce")]] }] },
  "disfarce-e-canto": { sprites: [{ costumes: 2, sounds: 1, scripts: [[F, "looks_nextcostume", "sound_playuntildone"]] }] },
  "a-porta-que-decide": { sprites: [{ scripts: [[F, sforever(siff(sTouching, sSay("Abriu!")))]] }, {}] },
  "comandos-no-pictoblox": { sprites: [{ scripts: [[F, sforever(siff(sKey("right arrow"), "motion_changexby"), siff(sKey("left arrow"), "motion_changexby"))]] }] },
  "cor-perigosa": { sprites: [{ scripts: [[F, sforever(siff({ op: "sensing_touchingcolor" }, sSay("Ai!"), "motion_gotoxy"))]] }] },
  "placar-no-jogo": { sprites: [{ variables: ["pontos"], scripts: [[F, "data_setvariableto", sforever(siff(sTouching, "data_changevariableby", "motion_gotoxy"))]] }, {}] },
  "clones-no-pictoblox": { sprites: [{ scripts: [[F, "looks_hide", "control_create_clone_of"], ["control_start_as_clone", "looks_show", "control_delete_this_clone"]] }] },
  "caca-moedas-no-pictoblox": { sprites: [
    { variables: ["pontos", "vidas"], scripts: [[F, sforever(siff(sKey("right arrow"), "motion_changexby"), siff({ op: "operator_equals" }, "control_stop"))]] },
    { scripts: [[F, sforever("motion_changeyby")]] },
  ] },
  "projeto-final-pictoblox": {
    backdrops: 3,
    sprites: [
      { sounds: 1, variables: ["pontos"], scripts: [[F, "event_broadcast", sforever(siff(sKey("right arrow"), "motion_changexby"))], ["event_whenbroadcastreceived", "sound_play"]] },
      { scripts: [[F, sforever(siff(sTouching, "data_changevariableby"))]] },
      {},
    ],
  },
};

const lessons = OFFICIAL_TRACKS.flatMap((tr) => tr.modules.flatMap((m) => m.lessons));
const bySlug = new Map(lessons.map((l) => [l.slug, l]));
const isExercise = (l: LessonContent) => l.type === "EXERCICIO" || l.type === "DESAFIO";
const run = (spec: GameSpec | object, l: LessonContent) => checkProject(compileProject(normalizeProject("sprites" in spec && !("v" in spec) ? project(spec as GameSpec) : spec)), checksSchema.parse(l.checks));

describe("currículo oficial", () => {
  it("tem 10 mundos em 3 níveis, em ordem, com história, terminando no projeto final da jam", () => {
    expect(OFFICIAL_TRACKS.map((tr) => tr.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(OFFICIAL_TRACKS.map((tr) => tr.level))).toEqual(new Set([1, 2, 3]));
    for (const tr of OFFICIAL_TRACKS) expect(tr.story, tr.slug).toBeTruthy();
    const required = OFFICIAL_TRACKS.at(-1)!.modules.flatMap((m) => m.lessons).filter((l) => !l.optional);
    expect(required.at(-1)!.slug).toBe("projeto-final");
  });

  it("o site vem primeiro: nenhuma lição obrigatória depende do PictoBlox", () => {
    for (const l of lessons) {
      if (l.mode === "SB3") expect(l.optional, `${l.slug} é do PictoBlox e não pode ser obrigatória`).toBe(true);
    }
    // e cada mundo oferece a transferência opcional para o PictoBlox
    for (const tr of OFFICIAL_TRACKS) {
      expect(tr.modules.flatMap((m) => m.lessons).some((l) => l.mode === "SB3" && l.optional), tr.slug).toBe(true);
    }
  });

  it("não menciona robótica nem inteligência artificial", () => {
    const text = JSON.stringify(OFFICIAL_TRACKS).toLowerCase();
    for (const word of ["inteligência artificial", "aprendizado de máquina", "robótica", "detecção de rosto", "extensões"]) expect(text).not.toContain(word);
  });

  it.each(lessons.map((l) => [l.slug, l] as const))("%s: guia do professor, blocos válidos e solução com 3 estrelas", (_, l) => {
    expect(l.guide, `${l.slug} sem guia do professor`).toBeDefined();
    for (const op of l.allowedBlocks ?? []) expect(BLOCKS_BY_OPCODE.has(op), op).toBe(true);
    if (!isExercise(l)) return;
    const checks = checksSchema.parse(l.checks);

    if (l.mode === "SB3") {
      for (const chk of checks.checks) expect(needsRuntime(chk), `${l.slug}: ${chk.type} precisa do editor`).toBe(false);
      const solution = SB3_SOLUTIONS[l.slug];
      expect(solution, `falta solução .sb3 de referência para ${l.slug}`).toBeDefined();
      const res = checkModel(modelFromProjectJson(projectJson(solution)), checks);
      expect(res.items.filter((i) => !i.ok)).toEqual([]);
      expect(res.stars).toBe(3);
      expect(checkModel(modelFromProjectJson(projectJson({})), checks).passed, `${l.slug} aceita projeto vazio`).toBe(false);
      return;
    }

    const solution = SOLUTIONS[l.slug];
    expect(solution, `falta solução de referência para ${l.slug}`).toBeDefined();
    // a solução só usa blocos liberados na lição
    if (l.allowedBlocks?.length) {
      const used = Object.keys(compileProject(project(solution)).opcodeCounts);
      for (const op of used) if (!op.startsWith("event_whenflag")) expect(l.allowedBlocks, `${l.slug} usa ${op}`).toContain(op);
    }
    const res = run(solution, l);
    expect(res.items.filter((i) => !i.ok)).toEqual([]);
    expect(res.stars).toBe(3);
    // o projeto inicial, sem mudanças, não pode passar
    const starter = l.starter ?? (l.startWithFlag ? { blocks: { blocks: [{ type: "event_whenflagclicked" }] } } : {});
    expect(run(starter, l).passed, `${l.slug}: o projeto inicial já passa sem fazer nada`).toBe(false);

    // ida e volta pelo editor de blocos (.sb3): a solução continua valendo 3 estrelas e o início continua não passando
    const viaSb3 = (spec: GameSpec | object) =>
      sb3JsonToProject(JSON.parse(JSON.stringify(projectToSb3Json(normalizeProject("sprites" in spec && !("v" in spec) ? project(spec as GameSpec) : spec)).json)));
    const back = checkProject(compileProject(viaSb3(solution)), checks);
    expect(back.items.filter((i) => !i.ok), `${l.slug} (via .sb3)`).toEqual([]);
    expect(back.stars).toBe(3);
    expect(checkProject(compileProject(viaSb3(starter)), checks).passed, `${l.slug} (via .sb3): o início já passa`).toBe(false);
  });

  it.each(WRONG.map(([slug, prog], i) => [`${slug} #${i}`, slug, prog] as const))("rejeita solução errada: %s", (_, slug, prog) => {
    expect(run(prog, bySlug.get(slug)!).passed).toBe(false);
  });

  it("slugs únicos", () => {
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
    expect(new Set(OFFICIAL_TRACKS.map((tr) => tr.slug)).size).toBe(OFFICIAL_TRACKS.length);
  });
});

import { OFFICIAL_COURSES } from "../../content/cursos";

describe("cursos oficiais", () => {
  it("o primeiro curso reúne os 10 mundos; o de Arduino está “em breve” e vazio", () => {
    const [intro, arduino] = OFFICIAL_COURSES;
    expect(intro.title).toBe("PictoBlox e Introdução à Programação de Blocos");
    expect(intro.tracks).toHaveLength(10);
    expect(intro.comingSoon).toBeFalsy();
    expect(arduino.title).toBe("Arduino e PictoBlox");
    expect(arduino.comingSoon).toBe(true);
    expect(arduino.tracks).toHaveLength(0);
  });

  it("cada trilha oficial pertence a exatamente um curso", () => {
    const slugs = OFFICIAL_COURSES.flatMap((c) => c.tracks.map((t) => t.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.sort()).toEqual(OFFICIAL_TRACKS.map((t) => t.slug).sort());
  });
});

describe("quem anda não termina onde começou (senão parece que não se mexeu)", async () => {
  const { World } = await import("@/lib/blocks/interpreter");
  for (const [slug, spec] of Object.entries(SOLUTIONS)) {
    it(slug, () => {
      const l = bySlug.get(slug)!;
      const w = new World(compileProject(normalizeProject(project(spec))));
      const start = structuredClone(w.state.targets.filter((t) => !t.isClone));
      w.runToEnd(checksSchema.parse(l.checks).maxSeconds ?? 30, checksSchema.parse(l.checks).inputs ?? []);
      for (const t of w.state.targets.filter((t) => !t.isClone)) {
        const s0 = start.find((s) => s.name === t.name);
        if (!s0 || t.steps === 0) continue;
        expect(Math.hypot(t.x - s0.x, t.y - s0.y), `${t.name} andou e voltou para o mesmo lugar`).toBeGreaterThan(5);
      }
    });
  }
});

// ───────────── Desafio extra com verificação (XP bônus) ─────────────
const EXTRA_SOLUTIONS: Record<string, GameSpec> = {
  "primeiros-passos": one(move(200), move(40)),
  "virando-a-esquina": one(move(100), left(90), move(100), left(90), move(100), left(90), move(100)),
  "pule-para-cima": one(gotoXY(0, 90)),
  "pule-para-baixo": one(gotoXY(0, -90)),
  "pule-para-o-canto": one(gotoXY(240, 180), gotoXY(-240, 180), gotoXY(-240, -180), gotoXY(240, -180)),
  "diga-ola": one(say("1"), say("2"), say("3"), say("4"), say("5")),
  apresentacao: one(gotoXY(0, 0), gotoXY(50, 50), gotoXY(-50, 50)),
};

describe("desafio extra verificado", () => {
  const withExtra = lessons.filter((l) => l.extraChecks);
  it("toda lição com extra verificado tem solução de referência", () => {
    expect(withExtra.map((l) => l.slug).sort()).toEqual(Object.keys(EXTRA_SOLUTIONS).sort());
  });
  for (const l of withExtra) {
    it(l.slug, () => {
      const extra = checksSchema.parse(l.extraChecks);
      const runExtra = (spec: object) => checkProject(compileProject(normalizeProject("sprites" in spec && !("v" in spec) ? project(spec as GameSpec) : spec)), extra);
      expect(runExtra(EXTRA_SOLUTIONS[l.slug]).passed).toBe(true);
      expect(runExtra(l.starter ?? (l.startWithFlag ? { sprites: [{ name: "Bloquinho", code: [[flag()]] }] } : {})).passed).toBe(false);
    });
  }
});
