import ImageTile from "ol/source/ImageTile";
import WebGLTileLayer from "ol/layer/WebGLTile";
import { unByKey } from "ol/Observable";
import { equivalent } from "ol/proj";

import type { EventsKey } from "ol/events";
import type { Options as WebGLTileOptions } from "ol/layer/WebGLTile";
import type { SourceType } from "ol/layer/WebGLTile";
import type { Pixel } from "ol/pixel";
import type { ExpressionValue } from "ol/expr/expression";
import type OlMap from "ol/Map";
import type { HajkApp } from "../../types/hajk";
import type {
  DepthColorStop,
  ElevationCrossOrigin,
  ElevationEncoding,
  ElevationSample,
  ElevationTileGridOptions,
  FloodSimulatorModelSettings,
  FloodSimulatorResolvedOptions,
} from "./types";

import {
  DEFAULT_OPTIONS,
  FALLBACK_WATER_COLOR,
  LAYER_NAME,
  LAYER_Z_INDEX,
  UI_STRINGS,
} from "./constants";
import {
  createElevationTileGrid,
  parseExtent,
  resolveLayerMaxResolution,
  resolveTerrainZoomLookup,
  zoomRangeFromLookup,
  type MapTileConfig,
} from "./elevationTileGrid";

type Rgba = [number, number, number, number];

export default class FloodSimulatorModel {
  #app: HajkApp;
  #map: OlMap;
  #options: FloodSimulatorResolvedOptions;
  #source: SourceType | null = null;
  #layer: WebGLTileLayer | null = null;
  #visible = false;
  #generation = 0;
  #level: number;
  #depthShading: boolean;
  #projectionWarningShown = false;
  #sourceErrorShown = false;
  #tileLoadErrors = 0;
  #sourceListeners: EventsKey[] = [];

  constructor(settings: FloodSimulatorModelSettings) {
    this.#app = settings.app;
    this.#map = settings.map;
    this.#visible = settings.visibleAtStart === true;
    this.#options = this.#resolveOptions(settings);
    this.#level = this.#options.defaultLevel;
    this.#depthShading = this.#options.enableDepthShading;
  }

  getOptions = (): FloodSimulatorResolvedOptions => this.#options;

  init = (): void => {
    const generation = ++this.#generation;
    this.#clearLayer();

    const source = this.#createSource();
    if (!source || generation !== this.#generation) {
      return;
    }

    this.#source = source;
    this.#layer = this.#createLayer();
    this.#map.addLayer(this.#layer);
    this.#watchSource(source, generation);
    this.#validateProjection();
  };

  dispose = (): void => {
    this.#generation++;
    this.#clearLayer();
    this.#projectionWarningShown = false;
    this.#sourceErrorShown = false;
    this.#tileLoadErrors = 0;
  };

  setLevel = (level: number): void => {
    this.#level = level;
    this.#layer?.updateStyleVariables({ level });
  };

  setOpacity = (opacity: number): void => {
    this.#layer?.setOpacity(opacity);
  };

  setDepthShading = (enabled: boolean): void => {
    this.#depthShading = enabled;
    this.#layer?.updateStyleVariables({ depthShading: enabled ? 1 : 0 });
  };

  setWaterColor = (hex: string): void => {
    this.#options.waterColor = hex;
    this.#layer?.setStyle(this.#createStyle());
  };

  setDeepWaterColor = (hex: string): void => {
    this.#options.deepWaterColor = hex;
    this.#layer?.setStyle(this.#createStyle());
  };

  setVisible = (visible: boolean): void => {
    this.#visible = visible;
    this.#layer?.setVisible(visible);
  };

  getElevationAtPixel = (pixel: Pixel): ElevationSample => {
    if (!this.#layer) {
      return { kind: "unloaded" };
    }
    const data = this.#layer.getData(pixel);
    if (!data) {
      return { kind: "unloaded" };
    }
    const elevation = this.#decodeElevation(data);
    if (elevation === null) {
      return { kind: "nodata" };
    }
    return { kind: "value", elevation };
  };

  #clearLayer(): void {
    unByKey(this.#sourceListeners);
    this.#sourceListeners = [];
    if (this.#layer) {
      this.#map.removeLayer(this.#layer);
    }
    this.#layer = null;
    this.#source = null;
  }

  #resolveOptions(
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

  #createSource(): SourceType | null {
    const {
      elevationUrl,
      crossOrigin,
      tileSize,
      minZoom,
      maxZoom,
      attributions,
      terrainZoomLookup,
      elevationTileGrid,
    } = this.#options;

    if (!elevationUrl) {
      console.warn(UI_STRINGS.noElevationUrl);
      return null;
    }

    const tileGrid = createElevationTileGrid({
      origin: elevationTileGrid.origin,
      originExtent: elevationTileGrid.originExtent,
      extent: elevationTileGrid.extent,
      resolutions: elevationTileGrid.resolutions,
      tileSize,
      lookup: terrainZoomLookup,
    });

    if (!tileGrid) {
      console.warn(UI_STRINGS.tileGridMissing);
    }

    return new ImageTile({
      url: elevationUrl,
      tileSize,
      tileGrid,
      // minZoom/maxZoom are unused when tileGrid is set; only applied in the
      // fallback EPSG:3857 XYZ grid that OpenLayers builds without a tileGrid.
      ...(tileGrid ? {} : { minZoom, maxZoom }),
      interpolate: true,
      // ImageTile's CrossOriginAttribute does not include null.
      ...(crossOrigin != null ? { crossOrigin } : {}),
      wrapX: false,
      transition: 100,
      attributions,
      projection: this.#map.getView().getProjection(),
    }) as SourceType;
  }

  #createLayer(): WebGLTileLayer {
    const source = this.#source;
    if (!source) {
      throw new Error("FloodSimulator: elevation source is missing");
    }

    const options: WebGLTileOptions & {
      layerType: string;
      ignoreInFeatureInfo: boolean;
      name: string;
      caption: string;
    } = {
      source,
      style: this.#createStyle(),
      opacity: this.#options.layerOpacity,
      zIndex: LAYER_Z_INDEX,
      visible: this.#visible,
      layerType: "system",
      ignoreInFeatureInfo: true,
      name: LAYER_NAME,
      caption: "Flood simulator",
    };
    if (this.#options.maxResolution !== undefined) {
      options.maxResolution = this.#options.maxResolution;
    }
    const clipExtent = parseExtent(this.#options.elevationTileGrid.extent);
    if (clipExtent) {
      options.extent = clipExtent;
    }

    return new WebGLTileLayer(options);
  }

  #createStyle() {
    const elev = this.#getElevationExpression();
    const waterColor = hexToRgba(this.#options.waterColor);
    const deepColor = hexToRgba(this.#options.deepWaterColor);
    const depth: ExpressionValue = ["-", ["var", "level"], elev];
    const floodedColor: ExpressionValue = [
      "case",
      ["==", ["var", "depthShading"], 1],
      createShadedFloodColor(depth, this.#options, waterColor, deepColor),
      waterColor,
    ];

    const flooded: ExpressionValue[] = [
      "all",
      [">", elev, ["var", "minElevation"]],
      ["<", elev, ["var", "maxElevation"]],
      ["<=", elev, ["var", "level"]],
      [">", ["band", 4], 0],
    ];

    return {
      variables: {
        level: this.#level,
        minElevation: this.#options.minElevation,
        maxElevation: this.#options.maxElevation,
        depthShading: this.#depthShading ? 1 : 0,
      },
      color: ["case", flooded, floodedColor, [0, 0, 0, 0]] as ExpressionValue,
    };
  }

  #getElevationExpression(): ExpressionValue {
    return getRgbElevationExpression(this.#options.elevationEncoding);
  }

  #watchSource(source: SourceType, generation: number): void {
    this.#sourceListeners.push(
      source.on("change", () => {
        if (generation !== this.#generation) {
          return;
        }
        const state = source.getState();
        if (state === "ready") {
          this.#validateProjection();
        }
        if (state === "error" && !this.#sourceErrorShown) {
          this.#sourceErrorShown = true;
          console.error("FloodSimulator: elevation source failed to load");
        }
      }),
      source.on("tileloaderror", () => {
        if (generation !== this.#generation) {
          return;
        }
        this.#tileLoadErrors += 1;
        if (this.#sourceErrorShown) {
          return;
        }
        this.#sourceErrorShown = true;
        window.setTimeout(() => {
          if (generation !== this.#generation) {
            return;
          }
          console.error(
            `FloodSimulator: ${this.#tileLoadErrors} elevation tile(s) failed to load. Check elevationUrl, CORS (Access-Control-Allow-Origin), and that the pyramid exists. The source is loaded with crossOrigin: ${JSON.stringify(this.#options.crossOrigin)}; "anonymous" (the default) is needed so getData() can read elevation values.`
          );
        }, 500);
      })
    );
  }

  #validateProjection(): void {
    if (this.#projectionWarningShown || !this.#source) {
      return;
    }
    const sourceProjection = this.#source.getProjection();
    const viewProjection = this.#map.getView().getProjection();
    if (!sourceProjection || !viewProjection) {
      return;
    }
    if (equivalent(sourceProjection, viewProjection)) {
      return;
    }
    this.#projectionWarningShown = true;
    console.warn(
      `FloodSimulator: elevation source projection (${sourceProjection.getCode()}) does not match the map view (${viewProjection.getCode()}). WebGL tile layers cannot reproject; the flood overlay may be wrong.`
    );
    this.#app.globalObserver.publish("core.alert", UI_STRINGS.projectionAlert);
  }

  #decodeElevation(
    data: Uint8ClampedArray | Uint8Array | Float32Array | DataView
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
      this.#options.elevationEncoding
    );
    if (!Number.isFinite(elevation)) {
      return null;
    }
    if (
      elevation <= this.#options.minElevation ||
      elevation >= this.#options.maxElevation
    ) {
      return null;
    }
    return elevation;
  }
}

function getRgbElevationExpression(
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

function createShadedFloodColor(
  depth: ExpressionValue,
  options: FloodSimulatorResolvedOptions,
  waterColor: Rgba,
  deepColor: Rgba
): ExpressionValue {
  const stops = options.depthColors;
  if (stops.length === 0) {
    return [
      "interpolate",
      ["linear"],
      depth,
      0,
      waterColor,
      options.maxShadingDepth,
      deepColor,
    ] as ExpressionValue;
  }

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

function hexToRgba(hex: string): Rgba {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return FALLBACK_WATER_COLOR;
  }
  const n = parseInt(normalized, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
}

function darken(color: Rgba, factor: number): Rgba {
  return [color[0] * factor, color[1] * factor, color[2] * factor, color[3]];
}

function rgbaToHex(color: Rgba): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color[0])}${channel(color[1])}${channel(color[2])}`;
}

function normalizeHex(hex: string): string | null {
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
