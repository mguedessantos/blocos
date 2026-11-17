// Listas de blocos e ajudantes compartilhados por várias lições.
import { flag, project } from "../../../src/lib/blocks/build";

export const GRID = project({ sprites: [{ name: "Bloquinho", code: [[flag()]] }], backdrops: ["grade"] });
export const JUMP = ["event_whenflagclicked", "motion_gotoxy"];
export const MOVE = ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "motion_turnleft"];
