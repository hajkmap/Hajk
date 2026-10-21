import type { FloodSimulatorResolvedOptions } from "../types";
import i18n from "src/i18n";

export const DEMO_TERRARIUM_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

export const LAYER_NAME = "pluginFloodSimulator";

/**
 * Above typical WMS/WMTS backgrounds, below Hajk system layers which start at
 * 5000 (`DrawModel`, `MapClickModel` highlight). 1000 keeps the flood overlay
 * on top of the map without covering draw / infoclick graphics.
 */
export const LAYER_Z_INDEX = 1000;

export type FloodSimulatorDefaultOptions = Omit<
  FloodSimulatorResolvedOptions,
  | "terrainZoomLookup"
  | "elevationTileGrid"
  | "hideAtMinZoom"
  | "minMapZoom"
  | "maxResolution"
>;

export const DEFAULT_OPTIONS: FloodSimulatorDefaultOptions = {
  elevationUrl: "",
  elevationEncoding: "terrarium",
  crossOrigin: "anonymous",
  tileSize: 256,
  minZoom: 0,
  maxZoom: 15,
  maxResolutionSlack: 1,
  attributions: "",
  minLevel: 0,
  maxLevel: 10,
  levelStep: 0.01,
  defaultLevel: 1,
  waterColor: "#86cbf9",
  deepWaterColor: "#283d4b",
  depthColors: [],
  layerOpacity: 0.6,
  enableDepthShading: false,
  interpolate: true,
  smoothDepthColors: true,
  maxShadingDepth: 5,
  animationDurationMs: 8000,
  showElevationReadout: true,
  minElevation: -100,
  maxElevation: 100,
};

export const ANIMATION_DURATION_MIN_S = 1;
export const ANIMATION_DURATION_MAX_S = 30;

/** Highest animation-duration max a user can pick in more settings. */
export const ANIMATION_DURATION_MAX_LIMIT = 120;

/** Highest water-level slider max a user can pick in more settings. */
export const WATER_LEVEL_MAX_LIMIT = 100;

/** Fade radius of each contour, in meters of depth. */
export const ISOBATH_WIDTH_M = 0.06;

/** RGB multiplier at the contour center (0–1). */
export const ISOBATH_SHADE = 0.45;

/** Blend width (m) at each class boundary when smooth depth colors are on. */
export const SMOOTH_DEPTH_FADE_M = 0.06;

/**
 * Blend width (m) at the shoreline when smooth depth colors are on. A bit
 * wider than class fades so the land/water edge softens without a hard rim.
 */
export const SHORELINE_FADE_M = 0.15;

export const FALLBACK_WATER_COLOR: [number, number, number, number] = [
  134, 203, 249, 1,
];

// Translated when read (i18n.t() in getters), see AGENTS.md.
export const UI_STRINGS = {
  get levelLabel() {
    return i18n.t("floodSimulator.levelLabel");
  },
  get levelAriaLabel() {
    return i18n.t("floodSimulator.levelAriaLabel");
  },
  get animate() {
    return i18n.t("floodSimulator.animate");
  },
  get pause() {
    return i18n.t("floodSimulator.pause");
  },
  get animateTooltip() {
    return i18n.t("floodSimulator.animateTooltip");
  },
  get pauseTooltip() {
    return i18n.t("floodSimulator.pauseTooltip");
  },
  get reset() {
    return i18n.t("floodSimulator.reset");
  },
  get resetTooltip() {
    return i18n.t("floodSimulator.resetTooltip");
  },
  get animationDurationLabel() {
    return i18n.t("floodSimulator.animationDurationLabel");
  },
  get durationAriaLabel() {
    return i18n.t("floodSimulator.durationAriaLabel");
  },
  get moreSettings() {
    return i18n.t("floodSimulator.moreSettings");
  },
  get moreSettingsTitle() {
    return i18n.t("floodSimulator.moreSettingsTitle");
  },
  get maxLevelLabel() {
    return i18n.t("floodSimulator.maxLevelLabel");
  },
  get maxLevelAriaLabel() {
    return i18n.t("floodSimulator.maxLevelAriaLabel");
  },
  get maxAnimationDurationLabel() {
    return i18n.t("floodSimulator.maxAnimationDurationLabel");
  },
  get maxAnimationDurationAriaLabel() {
    return i18n.t("floodSimulator.maxAnimationDurationAriaLabel");
  },
  get close() {
    return i18n.t("common.close");
  },
  get opacityLabel() {
    return i18n.t("floodSimulator.opacityLabel");
  },
  get opacityAriaLabel() {
    return i18n.t("floodSimulator.opacityAriaLabel");
  },
  get interpolateLabel() {
    return i18n.t("floodSimulator.interpolateLabel");
  },
  get depthShadingLabel() {
    return i18n.t("floodSimulator.depthShadingLabel");
  },
  get waterColorLabel() {
    return i18n.t("floodSimulator.waterColorLabel");
  },
  get deepWaterColorLabel() {
    return i18n.t("floodSimulator.deepWaterColorLabel");
  },
  get maxShadingDepthLabel() {
    return i18n.t("floodSimulator.maxShadingDepthLabel");
  },
  get maxShadingDepthAriaLabel() {
    return i18n.t("floodSimulator.maxShadingDepthAriaLabel");
  },
  get depthColorsLegend() {
    return i18n.t("floodSimulator.depthColorsLegend");
  },
  get depthColorModeLabel() {
    return i18n.t("floodSimulator.depthColorModeLabel");
  },
  get depthColorModeClasses() {
    return i18n.t("floodSimulator.depthColorModeClasses");
  },
  get depthColorModeRamp() {
    return i18n.t("floodSimulator.depthColorModeRamp");
  },
  get smoothDepthColorsLabel() {
    return i18n.t("floodSimulator.smoothDepthColorsLabel");
  },
  get isobathsLabel() {
    return i18n.t("floodSimulator.isobathsLabel");
  },
  get readoutElevationLabel() {
    return i18n.t("floodSimulator.readoutElevationLabel");
  },
  get readoutDepthLabel() {
    return i18n.t("floodSimulator.readoutDepthLabel");
  },
  get zoomInToSeeSimulation() {
    return i18n.t("floodSimulator.zoomInToSeeSimulation");
  },
  get projectionAlert() {
    return i18n.t("floodSimulator.projectionAlert");
  },
  depthClassRange: (from: string, to: string) =>
    i18n.t("floodSimulator.depthClassRange", { from, to }),
  depthClassFrom: (from: string) =>
    i18n.t("floodSimulator.depthClassFrom", { from }),
  readoutAriaLabel: (elevation: string, depth: string) =>
    i18n.t("floodSimulator.readoutAriaLabel", { elevation, depth }),
  // Console messages for developers, not translated.
  noElevationUrl:
    "FloodSimulator: no elevation source configured. Set options.elevationUrl to a Terrain-RGB or Terrarium XYZ template. The overlay will not be created.",
  tileGridMissing:
    "FloodSimulator: could not build an elevation tile grid from the map origin/extent/resolutions. OpenLayers will use a default EPSG:3857 XYZ grid and terrainZoomByMapZoom will be ignored.",
  noMapResolutions: (maxZoom: number) =>
    `FloodSimulator: map view has no tile resolutions; using getMaxZoom() (${maxZoom}) to size the terrain zoom lookup. terrainZoomByMapZoom mapping may be wrong.`,
} as const;
