import type { ExpressionValue } from "ol/expr/expression";

import type { ElevationEncoding } from "../types";

export function getRgbElevationExpression(
  encoding: ElevationEncoding
): ExpressionValue {
  const r = ["band", 1];
  const g = ["band", 2];
  const b = ["band", 3];

  if (encoding === "terrarium") {
    return [
      "+",
      ["*", 255 * 256, r],
      ["*", 255, g],
      ["*", 255 / 256, b],
      -32768,
    ];
  }

  // mapbox terrain-rgb: -10000 + (R * 256 * 256 + G * 256 + B) * 0.1
  return [
    "+",
    ["*", 255 * 256 * 256 * 0.1, r],
    ["*", 255 * 256 * 0.1, g],
    ["*", 255 * 0.1, b],
    -10000,
  ];
}

export function decodeElevationFromPixelData(
  data: Uint8ClampedArray | Uint8Array | Float32Array | DataView,
  encoding: ElevationEncoding,
  minElevation: number,
  maxElevation: number
): number | null {
  const values = toNumericValues(data);
  if (values.length < 3) {
    return null;
  }
  if (values.length > 3 && values[3] === 0) {
    return null;
  }

  const elevation = decodeRgbElevation(
    values[0],
    values[1],
    values[2],
    encoding
  );
  if (!Number.isFinite(elevation)) {
    return null;
  }
  if (elevation <= minElevation || elevation >= maxElevation) {
    return null;
  }
  return elevation;
}

function decodeRgbElevation(
  r: number,
  g: number,
  b: number,
  encoding: ElevationEncoding
): number {
  if (encoding === "terrarium") {
    return r * 256 + g + b / 256 - 32768;
  }
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

function toNumericValues(
  data: Uint8ClampedArray | Uint8Array | Float32Array | DataView
): number[] {
  if (data instanceof DataView) {
    const values: number[] = [];
    for (let i = 0; i < data.byteLength; i++) {
      values.push(data.getUint8(i));
    }
    return values;
  }
  return Array.from(data);
}
