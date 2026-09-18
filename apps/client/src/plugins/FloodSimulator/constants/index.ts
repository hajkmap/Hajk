import type { FloodSimulatorResolvedOptions } from "../types";

export const DEMO_TERRARIUM_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

export const LAYER_NAME = "pluginFloodSimulator";

/**
 * Above typical WMS/WMTS backgrounds, below Hajk system layers which start at
 * 5000 (`DrawModel`, `MapClickModel` highlight). 1000 keeps the flood overlay
 * on top of the map without covering draw / infoclick graphics.
 */
export const LAYER_Z_INDEX = 1000;

export const DEFAULT_TITLE = "Översvämning";
export const DEFAULT_DESCRIPTION = "Simulera en stigande vattennivå";

export type FloodSimulatorDefaultOptions = Omit<
  FloodSimulatorResolvedOptions,
  "terrainZoomLookup" | "elevationTileGrid" | "minMapZoom" | "maxResolution"
>;

export const DEFAULT_OPTIONS: FloodSimulatorDefaultOptions = {
  elevationUrl: "",
  elevationEncoding: "terrarium",
  crossOrigin: "anonymous",
  elevationProjection: "EPSG:3857",
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
  maxShadingDepth: 5,
  animationDurationMs: 8000,
  showElevationReadout: true,
  minElevation: -100,
  maxElevation: 100,
};

export const ANIMATION_DURATION_MIN_S = 1;
export const ANIMATION_DURATION_MAX_S = 30;

export const FALLBACK_WATER_COLOR: [number, number, number, number] = [
  134, 203, 249, 1,
];

export const UI_STRINGS = {
  levelLabel: "Vattennivå (m)",
  levelAriaLabel: "Vattennivå i meter",
  animate: "Animera",
  pause: "Pausa",
  animateTooltip: "Animera nivån från lägsta till högsta",
  pauseTooltip: "Pausa animeringen",
  reset: "Återställ",
  resetTooltip: "Återställ till startnivån",
  animationDurationLabel: "Animationstid (s)",
  durationAriaLabel: "Animationstid i sekunder",
  opacityLabel: "Opacitet",
  depthShadingLabel: "Visa vattendjup",
  waterColorLabel: "Vattenfärg",
  deepWaterColorLabel: "Djupvattenfärg",
  depthColorsLegend: "Djupklasser",
  depthClassRange: (from: string, to: string) => `${from}–${to} m`,
  depthClassFrom: (from: string) => `> ${from} m`,
  readoutElevationLabel: "Markhöjd",
  readoutDepthLabel: "Vattendjup",
  projectionAlert:
    "Höjdkällans projektion matchar inte kartans projektion. Översvämningslagret kan visas felaktigt.",
  noElevationUrl:
    "FloodSimulator: no elevation source configured. Set options.elevationUrl to a Terrain-RGB or Terrarium XYZ template. The overlay will not be created.",
  tileGridMissing:
    "FloodSimulator: could not build an elevation tile grid from the map origin/extent/resolutions. OpenLayers will use a default EPSG:3857 XYZ grid and terrainZoomByMapZoom will be ignored.",
  noMapResolutions: (maxZoom: number) =>
    `FloodSimulator: map view has no tile resolutions; using getMaxZoom() (${maxZoom}) to size the terrain zoom lookup. terrainZoomByMapZoom mapping may be wrong.`,
} as const;
