// Utilidades de cor para o white-label: valida hex e garante contraste legível (WCAG).
export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Cor do texto (branco ou quase-preto) com melhor contraste sobre `bg`. */
export function readableTextOn(bg: string) {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#1f1d2b") ? "#ffffff" : "#1f1d2b";
}

/** Uma cor de marca é aceita se o texto sobre ela atingir AA para texto grande (3:1). */
export function isAcceptableBrandColor(hex: string) {
  return isHexColor(hex) && contrastRatio(hex, readableTextOn(hex)) >= 3;
}
