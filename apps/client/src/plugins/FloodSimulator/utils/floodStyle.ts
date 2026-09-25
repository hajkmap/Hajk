import type { ExpressionValue } from "ol/expr/expression";
import type { Style } from "ol/layer/WebGLTile";

import {
  ISOBATH_SHADE,
  ISOBATH_WIDTH_M,
  SHORELINE_FADE_M,
  SMOOTH_DEPTH_FADE_M,
} from "../constants";
import type { DepthColorStop, FloodSimulatorResolvedOptions } from "../types";
import { colorChannels, hexToRgba } from "./color";
import { buildDepthFadeStops } from "./depthColorFade";
import { getRgbElevationExpression } from "./elevation";

export interface FloodStyleState {
  level: number;
  depthShading: boolean;
  useDepthColors: boolean;
  smoothDepthColors: boolean;
  isobaths: boolean;
}

/**
 * All depth colorings are compiled into the style. `useDepthColors` and
 * `smoothDepthColors` pick between them at draw time, so swapping does not
 * rebuild the shader.
 */
export function createFloodLayerStyle(
  options: FloodSimulatorResolvedOptions,
  state: FloodStyleState
): Style {
  const elev = getRgbElevationExpression(options.elevationEncoding);
  const waterColor = styleColor("water");
  const deepColor = styleColor("deep");
  const depth: ExpressionValue = ["-", ["var", "level"], elev];
  const shaded: ExpressionValue = [
    "case",
    ["==", ["var", "depthShading"], 1],
    createShadedFloodColor(depth, options, waterColor, deepColor),
    waterColor,
  ];
  const floodedColor = applyShorelineFade(
    applyIsobaths(shaded, depth, options.depthColors),
    depth
  );

  const flooded: ExpressionValue[] = [
    "all",
    [">", elev, ["var", "minElevation"]],
    ["<", elev, ["var", "maxElevation"]],
    ["<=", elev, ["var", "level"]],
    [">", ["band", 4], 0],
  ];

  return {
    variables: {
      level: state.level,
      minElevation: options.minElevation,
      maxElevation: options.maxElevation,
      depthShading: state.depthShading ? 1 : 0,
      useDepthColors: state.useDepthColors ? 1 : 0,
      smoothDepthColors: state.smoothDepthColors ? 1 : 0,
      isobaths: state.isobaths ? 1 : 0,
      maxShadingDepth: options.maxShadingDepth,
      ...colorChannels(options.waterColor, "water"),
      ...colorChannels(options.deepWaterColor, "deep"),
    },
    color: ["case", flooded, floodedColor, [0, 0, 0, 0]] as ExpressionValue,
  };
}

function createShadedFloodColor(
  depth: ExpressionValue,
  options: FloodSimulatorResolvedOptions,
  waterColor: ExpressionValue,
  deepColor: ExpressionValue
): ExpressionValue {
  const ramp = createDepthRampColor(depth, waterColor, deepColor);
  if (options.depthColors.length === 0) {
    return ramp;
  }
  return [
    "case",
    ["==", ["var", "useDepthColors"], 1],
    [
      "case",
      ["==", ["var", "smoothDepthColors"], 1],
      createDepthStopRampColor(depth, options.depthColors),
      createDepthClassColor(depth, options.depthColors),
    ],
    ramp,
  ] as ExpressionValue;
}

function createDepthRampColor(
  depth: ExpressionValue,
  waterColor: ExpressionValue,
  deepColor: ExpressionValue
): ExpressionValue {
  return [
    "interpolate",
    ["linear"],
    depth,
    0,
    waterColor,
    ["var", "maxShadingDepth"],
    deepColor,
  ] as ExpressionValue;
}

/** Hold each class color, then blend over a short band at the boundary. */
function createDepthStopRampColor(
  depth: ExpressionValue,
  stops: DepthColorStop[]
): ExpressionValue {
  const expr: ExpressionValue[] = ["interpolate", ["linear"], depth];
  for (const stop of buildDepthFadeStops(stops, SMOOTH_DEPTH_FADE_M)) {
    expr.push(stop.depth, hexToRgba(stop.color));
  }
  return expr as ExpressionValue;
}

function createDepthClassColor(
  depth: ExpressionValue,
  stops: DepthColorStop[]
): ExpressionValue {
  if (stops.length === 1) {
    return hexToRgba(stops[0].color);
  }

  const expr: ExpressionValue[] = ["case"];
  for (let i = 0; i < stops.length - 1; i++) {
    expr.push(
      ["<=", depth, stops[i].maxDepth] as ExpressionValue,
      hexToRgba(stops[i].color)
    );
  }
  expr.push(hexToRgba(stops[stops.length - 1].color));
  return expr as ExpressionValue;
}

/**
 * Darken pixels whose depth is near a `depthColors` stop. Compiled into the
 * style; `isobaths`, `depthShading`, and `useDepthColors` pick it at draw time. With
 * `smoothDepthColors`, shade is strongest at the contour and fades out over
 * `ISOBATH_WIDTH_M`; otherwise it is a hard stripe of that half-width.
 */
function applyIsobaths(
  color: ExpressionValue,
  depth: ExpressionValue,
  stops: DepthColorStop[]
): ExpressionValue {
  if (stops.length === 0) {
    return color;
  }
  const hardShade = Math.round(ISOBATH_SHADE * 255);
  const hard: ExpressionValue = [
    "case",
    nearDepthColorStops(depth, stops),
    ["*", color, ["color", hardShade, hardShade, hardShade, 1]],
    color,
  ];
  const softShade = isobathShade(depth, stops);
  const soft: ExpressionValue = [
    "*",
    color,
    [
      "color",
      ["*", 255, softShade],
      ["*", 255, softShade],
      ["*", 255, softShade],
      1,
    ],
  ];
  return [
    "case",
    [
      "all",
      ["==", ["var", "isobaths"], 1],
      ["==", ["var", "depthShading"], 1],
      ["==", ["var", "useDepthColors"], 1],
    ],
    ["case", ["==", ["var", "smoothDepthColors"], 1], soft, hard],
    color,
  ] as ExpressionValue;
}

/**
 * Fade the overlay in over a short depth band at the shoreline. Compiled into
 * the style; `smoothDepthColors` picks it at draw time.
 */
function applyShorelineFade(
  color: ExpressionValue,
  depth: ExpressionValue
): ExpressionValue {
  const fadeAlpha: ExpressionValue = [
    "interpolate",
    ["linear"],
    depth,
    0,
    0,
    SHORELINE_FADE_M,
    1,
  ];
  return [
    "case",
    ["==", ["var", "smoothDepthColors"], 1],
    ["*", color, ["color", 255, 255, 255, fadeAlpha]],
    color,
  ] as ExpressionValue;
}

function isobathShade(
  depth: ExpressionValue,
  stops: DepthColorStop[]
): ExpressionValue {
  const shadeAt = (maxDepth: number): ExpressionValue =>
    [
      "interpolate",
      ["linear"],
      ["abs", ["-", depth, maxDepth]],
      0,
      ISOBATH_SHADE,
      ISOBATH_WIDTH_M,
      1,
    ] as ExpressionValue;
  if (stops.length === 1) {
    return shadeAt(stops[0].maxDepth);
  }
  return [
    "*",
    ...stops.map((stop) => shadeAt(stop.maxDepth)),
  ] as ExpressionValue;
}

function nearDepthColorStops(
  depth: ExpressionValue,
  stops: DepthColorStop[]
): ExpressionValue {
  const nearStop = (maxDepth: number): ExpressionValue =>
    ["<", ["abs", ["-", depth, maxDepth]], ISOBATH_WIDTH_M] as ExpressionValue;
  if (stops.length === 1) {
    return nearStop(stops[0].maxDepth);
  }
  return [
    "any",
    ...stops.map((stop) => nearStop(stop.maxDepth)),
  ] as ExpressionValue;
}

function styleColor(prefix: "water" | "deep"): ExpressionValue {
  return [
    "color",
    ["var", `${prefix}R`],
    ["var", `${prefix}G`],
    ["var", `${prefix}B`],
  ];
}
