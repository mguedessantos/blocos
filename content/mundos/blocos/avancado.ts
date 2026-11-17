// Listas de blocos e ajudantes compartilhados por várias lições.
import { changeX, changeY, flag, forever, gotoXY, iff, keyPressed, lt, n, r, random, ypos } from "../../../src/lib/blocks/build";

export const FLAG = "event_whenflagclicked";
export const KEY = "event_whenkeypressed";
export const IFS = ["control_if", "control_if_else"];
export const BROADCAST = ["event_broadcast", "event_broadcastandwait"];
export const RECEIVE = "event_whenbroadcastreceived";
export const CONTROLS = ["sensing_keypressed", KEY];
export const TODOS: string[] = [];
export const heroControls = () => [flag(), forever(iff(keyPressed("right arrow"), changeX(6)), iff(keyPressed("left arrow"), changeX(-6)))];

export const coinFall = () => [
  flag(), gotoXY(0, 170),
  forever(changeY(-5), iff(lt(r(ypos()), n(-170)), gotoXY(random(-200, 200), 170))),
];

export const heroControls4 = () => [flag(), forever(
  iff(keyPressed("right arrow"), changeX(5)), iff(keyPressed("left arrow"), changeX(-5)),
  iff(keyPressed("up arrow"), changeY(5)), iff(keyPressed("down arrow"), changeY(-5)),
)];
