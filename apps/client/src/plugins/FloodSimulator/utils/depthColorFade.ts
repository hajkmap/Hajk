import type { DepthColorStop } from "../types";

/**
 * Color holds through most of each class, then blends over `fadeWidth` meters
 * at the boundary. Stops are strictly increasing so they can feed both the
 * WebGL interpolate and the CSS legend gradient.
 */
export function buildDepthFadeStops(
  stops: DepthColorStop[],
  fadeWidth: number
): { depth: number; color: string }[] {
  if (stops.length === 0) {
    return [];
  }

  const result: { depth: number; color: string }[] = [];
  const push = (depth: number, color: string) => {
    const previous = result[result.length - 1];
    if (previous && depth <= previous.depth) {
      return;
    }
    result.push({ depth, color });
  };

  push(0, stops[0].color);

  for (let i = 0; i < stops.length - 1; i++) {
    const boundary = stops[i].maxDepth;
    const previousBound = i === 0 ? 0 : stops[i - 1].maxDepth;
    const nextBound = stops[i + 1].maxDepth;
    const halfFade = Math.min(
      fadeWidth,
      (boundary - previousBound) / 2,
      (nextBound - boundary) / 2
    );
    push(boundary - halfFade, stops[i].color);
    push(boundary + halfFade, stops[i + 1].color);
  }

  const last = stops[stops.length - 1];
  push(last.maxDepth, last.color);
  return result;
}
