const zPattern = /\{z\}/g;
const xPattern = /\{x\}/g;
const yPattern = /\{y\}/g;
const dashYPattern = /\{-y\}/g;

/**
 * Replaces `{z}`, `{x}`, `{y}` and `{-y}` in an XYZ URL template.
 * `{-y}` (TMS-style, counted from the bottom) requires `maxY` — the
 * highest `{y}` at the given level.
 */
export function xyzUrl(
  template: string,
  z: number,
  x: number,
  y: number,
  maxY?: number
): string {
  return template
    .replace(zPattern, String(z))
    .replace(xPattern, String(x))
    .replace(yPattern, String(y))
    .replace(dashYPattern, () => {
      if (maxY === undefined) {
        throw new Error(
          "FloodSimulator: the elevationUrl template uses {-y}, which requires a tile grid extent"
        );
      }
      return String(maxY - y);
    });
}
