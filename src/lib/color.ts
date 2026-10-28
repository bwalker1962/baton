// Color helpers so any brand color stays readable inside Baton.
function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/** Darkens a brand color until white text on it meets WCAG AA (4.5:1). */
export function readableAccent(hex: string): { color: string; adjusted: boolean } {
  let rgb = toRgb(hex);
  let color = hex;
  let steps = 0;
  while (contrastWithWhite(color) < 4.5 && steps < 40) {
    rgb = rgb.map((v) => v * 0.92) as [number, number, number];
    color = toHex(rgb);
    steps++;
  }
  return { color, adjusted: steps > 0 };
}
