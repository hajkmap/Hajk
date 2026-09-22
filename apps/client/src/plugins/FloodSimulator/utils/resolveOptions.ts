import type OlMap from "ol/Map";

import type { HajkApp } from "../../../types/hajk";
import { DEFAULT_OPTIONS, UI_STRINGS } from "../constants";
import {
  parseExtent,
  resolveLayerMaxResolution,
  resolveTerrainZoomLookup,
  zoomRangeFromLookup,
  type MapTileConfig,
} from "../elevationTileGrid";
import type {
  DepthColorStop,
  ElevationCrossOrigin,
  ElevationEncoding,
  ElevationTileGridOptions,
  FloodSimulatorModelSettings,
  FloodSimulatorResolvedOptions,
} from "../types";
import { darken, hexToRgba, normalizeHex, rgbaToHex } from "./color";

export function resolveFloodSimulatorOptions(
  settings: FloodSimulatorModelSettings
): FloodSimulatorResolvedOptions {
  const mapTiles = getMapTileConfig(settings.app, settings.map);
  const elevationTileGrid = resolveElevationTileGrid(
    settings.elevationTileGrid,
    mapTiles,
    asExtent(settings.elevationExtent, "elevationExtent")
  );

  const viewMaxZoom = settings.map.getView().getMaxZoom();
  const mapZoomCount = Math.max(
    1,
    elevationTileGrid.resolutions?.length ?? Math.floor(viewMaxZoom) + 1
  );
  if (!elevationTileGrid.resolutions?.length) {
    console.warn(UI_STRINGS.noMapResolutions(viewMaxZoom));
  }

  const configuredMinZoom = clampOption(
    settings.minZoom,
    DEFAULT_OPTIONS.minZoom,
    "minZoom",
    0
  );
  const configuredMaxZoom = clampOption(
    settings.maxZoom,
    DEFAULT_OPTIONS.maxZoom,
    "maxZoom",
    0
  );
  const minZoomBound = Math.min(configuredMinZoom, configuredMaxZoom);
  const maxZoomBound = Math.max(configuredMinZoom, configuredMaxZoom);
  if (configuredMinZoom > configuredMaxZoom) {
    console.warn(
      `FloodSimulator: minZoom (${configuredMinZoom}) > maxZoom (${configuredMaxZoom}); swapping.`
    );
  }

  const terrainZoomLookup = resolveTerrainZoomLookup({
    terrainZoomByMapZoom: settings.terrainZoomByMapZoom,
    minZoom: minZoomBound,
    maxZoom: maxZoomBound,
    mapZoomCount,
  });
  const { minZoom, maxZoom } = zoomRangeFromLookup(terrainZoomLookup);

  const waterColor = resolveColor(
    settings.waterColor,
    DEFAULT_OPTIONS.waterColor,
    "waterColor"
  );
  const deepWaterColor = resolveColor(
    settings.deepWaterColor,
    rgbaToHex(darken(hexToRgba(waterColor), 0.3)),
    "deepWaterColor"
  );

  let minLevel = clampOption(
    settings.minLevel,
    DEFAULT_OPTIONS.minLevel,
    "minLevel"
  );
  let maxLevel = clampOption(
    settings.maxLevel,
    DEFAULT_OPTIONS.maxLevel,
    "maxLevel"
  );
  if (minLevel > maxLevel) {
    console.warn(
      `FloodSimulator: minLevel (${minLevel}) > maxLevel (${maxLevel}); swapping.`
    );
    [minLevel, maxLevel] = [maxLevel, minLevel];
  }

  const levelStep = resolvePositive(
    settings.levelStep,
    DEFAULT_OPTIONS.levelStep,
    "levelStep"
  );
  const defaultLevel = clampOption(
    settings.defaultLevel,
    DEFAULT_OPTIONS.defaultLevel,
    "defaultLevel",
    minLevel,
    maxLevel
  );

  let minElevation = clampOption(
    settings.minElevation,
    DEFAULT_OPTIONS.minElevation,
    "minElevation"
  );
  let maxElevation = clampOption(
    settings.maxElevation,
    DEFAULT_OPTIONS.maxElevation,
    "maxElevation"
  );
  if (minElevation > maxElevation) {
    console.warn(
      `FloodSimulator: minElevation (${minElevation}) > maxElevation (${maxElevation}); swapping.`
    );
    [minElevation, maxElevation] = [maxElevation, minElevation];
  }

  const maxResolutionSlack = resolvePositive(
    settings.maxResolutionSlack,
    DEFAULT_OPTIONS.maxResolutionSlack,
    "maxResolutionSlack"
  );
  const minMapZoom = asFiniteNumber(settings.minMapZoom);
  const maxResolution = resolveLayerMaxResolution({
    maxResolution: asFiniteNumber(settings.maxResolution),
    minMapZoom,
    maxResolutionSlack,
    resolutions: elevationTileGrid.resolutions,
  });
  const hideAtMinZoom = clampOptionalMin(
    settings.hideAtMinZoom,
    0,
    "hideAtMinZoom"
  );

  return {
    elevationUrl:
      typeof settings.elevationUrl === "string"
        ? settings.elevationUrl.trim()
        : DEFAULT_OPTIONS.elevationUrl,
    elevationEncoding: resolveEncoding(settings.elevationEncoding),
    crossOrigin: resolveCrossOrigin(settings.crossOrigin),
    tileSize: clampOption(
      settings.tileSize,
      DEFAULT_OPTIONS.tileSize,
      "tileSize",
      1
    ),
    minZoom,
    maxZoom,
    terrainZoomLookup,
    elevationTileGrid,
    hideAtMinZoom,
    minMapZoom,
    maxResolution,
    maxResolutionSlack,
    attributions: settings.attributions ?? DEFAULT_OPTIONS.attributions,
    minLevel,
    maxLevel,
    levelStep,
    defaultLevel,
    waterColor,
    deepWaterColor,
    depthColors: resolveDepthColors(settings.depthColors),
    layerOpacity: resolveLayerOpacity(settings.layerOpacity),
    enableDepthShading:
      settings.enableDepthShading ?? DEFAULT_OPTIONS.enableDepthShading,
    interpolate: settings.interpolate ?? DEFAULT_OPTIONS.interpolate,
    smoothDepthColors:
      settings.smoothDepthColors ?? DEFAULT_OPTIONS.smoothDepthColors,
    maxShadingDepth: resolvePositive(
      settings.maxShadingDepth,
      DEFAULT_OPTIONS.maxShadingDepth,
      "maxShadingDepth"
    ),
    animationDurationMs: resolvePositive(
      settings.animationDurationMs,
      DEFAULT_OPTIONS.animationDurationMs,
      "animationDurationMs"
    ),
    showElevationReadout:
      settings.showElevationReadout ?? DEFAULT_OPTIONS.showElevationReadout,
    minElevation,
    maxElevation,
  };
}

function getMapTileConfig(app: HajkApp, map: OlMap): MapTileConfig {
  const raw = (
    app.config as {
      mapConfig?: {
        map?: {
          origin?: number[];
          extent?: number[];
          resolutions?: number[];
          projection?: string;
        };
      };
    }
  ).mapConfig?.map;

  return {
    origin: raw?.origin,
    extent: raw?.extent,
    resolutions: map.getView().getResolutions() ?? raw?.resolutions,
    projection: map.getView().getProjection()?.getCode() ?? raw?.projection,
  };
}

function resolveElevationTileGrid(
  configured: ElevationTileGridOptions | undefined,
  mapTiles: MapTileConfig,
  clipExtent?: number[]
): ElevationTileGridOptions {
  return {
    origin: configured?.origin ?? mapTiles.origin,
    originExtent: configured?.originExtent ?? mapTiles.extent,
    extent:
      clipExtent ??
      asExtent(configured?.extent, "elevationTileGrid.extent") ??
      mapTiles.extent,
    resolutions: configured?.resolutions ?? mapTiles.resolutions,
  };
}

function asExtent(value: unknown, name: string): number[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const extent = parseExtent(value);
  if (!extent) {
    console.warn(
      `FloodSimulator: ${name} must be [minX, minY, maxX, maxY] with min < max; ignoring.`
    );
  }
  return extent;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function clampOptionalMin(
  value: unknown,
  min: number,
  name: string
): number | undefined {
  const numeric = asFiniteNumber(value);
  if (numeric === undefined) {
    return undefined;
  }
  if (numeric < min) {
    console.warn(`FloodSimulator: ${name} (${numeric}) was clamped to ${min}.`);
    return min;
  }
  return numeric;
}

function clampOption(
  value: unknown,
  fallback: number,
  name: string,
  min?: number,
  max?: number
): number {
  const numeric = asFiniteNumber(value);
  if (numeric === undefined) {
    if (value !== undefined && value !== null) {
      console.warn(
        `FloodSimulator: ${name} (${String(value)}) is not a number; using ${fallback}.`
      );
    }
    return fallback;
  }
  let next = numeric;
  if (min !== undefined && next < min) {
    next = min;
  }
  if (max !== undefined && next > max) {
    next = max;
  }
  if (next !== numeric) {
    console.warn(
      `FloodSimulator: ${name} (${numeric}) was clamped to ${next}.`
    );
  }
  return next;
}

function resolvePositive(
  value: unknown,
  fallback: number,
  name: string
): number {
  const numeric = asFiniteNumber(value);
  if (numeric === undefined) {
    if (value !== undefined && value !== null) {
      console.warn(
        `FloodSimulator: ${name} (${String(value)}) is not a number; using ${fallback}.`
      );
    }
    return fallback;
  }
  if (numeric <= 0) {
    console.warn(
      `FloodSimulator: ${name} (${numeric}) must be > 0; using ${fallback}.`
    );
    return fallback;
  }
  return numeric;
}

function resolveLayerOpacity(value: unknown): number {
  const numeric = asFiniteNumber(value);
  if (numeric === undefined) {
    if (value !== undefined && value !== null) {
      console.warn(
        `FloodSimulator: layerOpacity (${String(value)}) is not a number; using ${DEFAULT_OPTIONS.layerOpacity}.`
      );
    }
    return DEFAULT_OPTIONS.layerOpacity;
  }
  if (numeric > 1 && numeric <= 100) {
    console.warn(
      "FloodSimulator: layerOpacity looks like a percent; converting to 0–1."
    );
    return Math.min(1, Math.max(0, numeric / 100));
  }
  if (numeric < 0 || numeric > 1) {
    const clamped = Math.min(1, Math.max(0, numeric));
    console.warn(
      `FloodSimulator: layerOpacity (${numeric}) was clamped to ${clamped}.`
    );
    return clamped;
  }
  return numeric;
}

function resolveCrossOrigin(value: unknown): ElevationCrossOrigin {
  if (value === undefined) {
    return DEFAULT_OPTIONS.crossOrigin;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    console.warn(
      `FloodSimulator: crossOrigin (${String(value)}) is invalid; using ${DEFAULT_OPTIONS.crossOrigin}.`
    );
    return DEFAULT_OPTIONS.crossOrigin;
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "none") {
    return null;
  }
  if (trimmed === "anonymous" || trimmed === "use-credentials") {
    return trimmed;
  }
  console.warn(
    `FloodSimulator: unknown crossOrigin (${value}); using ${DEFAULT_OPTIONS.crossOrigin}.`
  );
  return DEFAULT_OPTIONS.crossOrigin;
}

function resolveEncoding(value: unknown): ElevationEncoding {
  if (value === "mapbox" || value === "terrarium") {
    return value;
  }
  if (value !== undefined && value !== null) {
    console.warn(
      `FloodSimulator: unknown elevationEncoding (${String(value)}); using ${DEFAULT_OPTIONS.elevationEncoding}.`
    );
  }
  return DEFAULT_OPTIONS.elevationEncoding;
}

function resolveColor(value: unknown, fallback: string, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  if (!normalizeHex(value)) {
    console.warn(
      `FloodSimulator: ${name} (${value}) is not a hex color; using ${fallback}.`
    );
    return fallback;
  }
  const normalized = normalizeHex(value);
  return normalized ? `#${normalized.toLowerCase()}` : fallback;
}

function resolveDepthColors(value: unknown): DepthColorStop[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    console.warn(
      "FloodSimulator: depthColors must be an array of { maxDepth, color }; ignoring."
    );
    return [];
  }
  if (value.length === 0) {
    return [];
  }

  const stops: DepthColorStop[] = [];
  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      console.warn(
        `FloodSimulator: depthColors[${index}] is not an object; skipping.`
      );
      return;
    }
    const raw = item as { maxDepth?: unknown; color?: unknown };
    const maxDepth = asFiniteNumber(raw.maxDepth);
    if (maxDepth === undefined || maxDepth <= 0) {
      console.warn(
        `FloodSimulator: depthColors[${index}].maxDepth must be a number > 0; skipping.`
      );
      return;
    }
    if (typeof raw.color !== "string" || !normalizeHex(raw.color)) {
      console.warn(
        `FloodSimulator: depthColors[${index}].color is not a hex color; skipping.`
      );
      return;
    }
    const normalized = normalizeHex(raw.color);
    if (!normalized) {
      return;
    }
    stops.push({
      maxDepth,
      color: `#${normalized.toLowerCase()}`,
    });
  });

  stops.sort((a, b) => a.maxDepth - b.maxDepth);
  const unique: DepthColorStop[] = [];
  for (const stop of stops) {
    const previous = unique[unique.length - 1];
    if (previous && previous.maxDepth === stop.maxDepth) {
      console.warn(
        `FloodSimulator: duplicate depthColors maxDepth (${stop.maxDepth}); keeping the first.`
      );
      continue;
    }
    unique.push(stop);
  }
  return unique;
}
