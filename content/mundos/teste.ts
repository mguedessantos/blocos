// Ajudantes das soluções de referência (só os testes usam).
import { b, flag, gotoXY, iff, lt, n, r, random, touching, ypos, type GameSpec } from "../../src/lib/blocks/build";

export const one = (...body: ReturnType<typeof b>[]): GameSpec => ({ variables: ["pontos"], sprites: [{ name: "Bloquinho", code: [[flag(), ...body]] }] });
export const touchingHero = () => touching("Bloquinho");
export const coinBottom = (...extra: ReturnType<typeof b>[]) => iff(lt(r(ypos()), n(-170)), ...extra, gotoXY(random(-200, 200), 170));
