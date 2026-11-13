import { FALLBACK_WATER_COLOR } from "../constants";

export type Rgba = [number, number, number, number];

export function colorChannels(
  hex: string,
  prefix: "water" | "deep"
): Record<string, number> {
  const [r, g, b] = hexToRgba(hex);
  return {
    [`${prefix}R`]: r,
    [`${prefix}G`]: g,
    [`${prefix}B`]: b,
  };
}

export function hexToRgba(hex: string): Rgba {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return FALLBACK_WATER_COLOR;
  }
  const n = parseInt(normalized, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
}

export function darken(color: Rgba, factor: number): Rgba {
  return [color[0] * factor, color[1] * factor, color[2] * factor, color[3]];
}

export function rgbaToHex(color: Rgba): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color[0])}${channel(color[1])}${channel(color[2])}`;
}

export function normalizeHex(hex: string): string | null {
  const raw = hex.trim().replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  return /^[0-9a-fA-F]{6}$/.test(normalized) ? normalized : null;
}
