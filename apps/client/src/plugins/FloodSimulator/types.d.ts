import type OlMap from "ol/Map";
import type { Pixel } from "ol/pixel";
import type { HajkApp } from "../../types/hajk";

export type ElevationEncoding = "mapbox" | "terrarium";

/** CORS mode for elevation image tiles. `null` skips the cross-origin attribute. */
export type ElevationCrossOrigin = "anonymous" | "use-credentials" | null;

/** One discrete flood-depth class. `maxDepth` is the inclusive upper bound in metres. */
export interface DepthColorStop {
  maxDepth: number;
  color: string;
}

/**
 * Hajk map zoom index → terrain tile `{z}`.
 * Array form is one value per map zoom; object form is breakpoints
 * (e.g. `{ "0": 4, "5": 5, "6": 6 }`).
 */
export type TerrainZoomByMapZoom = number[] | Record<string, number>;

export interface ElevationTileGridOptions {
  origin?: number[];
  /** Clip for tile requests. Defaults to the map extent. */
  extent?: number[];
  /** Extent used only to place the XYZ origin (usually the map extent). */
  originExtent?: number[];
  resolutions?: number[];
}

export type ElevationSample =
  | { kind: "unloaded" }
  | { kind: "nodata" }
  | { kind: "value"; elevation: number };

export type Readout =
  | { kind: "idle" }
  | { kind: "unloaded" }
  | { kind: "nodata" }
  | { kind: "value"; elevation: number; depth: number };

export interface FloodSimulatorOptions {
  visibleAtStart?: boolean;
  title?: string;
  description?: string;
  target?: string;
  position?: string;
  /**
   * XYZ URL template for Mapbox Terrain-RGB or Terrarium tiles.
   * Empty by default — set this (or keep the demo URL in the map config) or
   * the overlay is not created.
   */
  elevationUrl?: string;
  /** How to decode RGB tiles. */
  elevationEncoding?: ElevationEncoding;
  /**
   * CORS mode for elevation image tiles. Defaults to `"anonymous"` so
   * `getData()` can read pixel values for the pointer readout. Use
   * `"use-credentials"` if the tile server requires cookies, or `null` /
   * `""` to omit the attribute (overlay can still draw; readout will not).
   */
  crossOrigin?: ElevationCrossOrigin | "";
  /** Projection of the elevation tiles. Defaults to the map view projection. */
  elevationProjection?: string;
  tileSize?: number;
  /** Lowest terrain tile z that exists. Map zooms below this reuse that z. */
  minZoom?: number;
  /** Highest terrain tile z that exists. Map zooms above this reuse that z. */
  maxZoom?: number;
  /**
   * Optional explicit mapping from Hajk map zoom → terrain `{z}`.
   * Omit it or set it to `null` to clamp each map zoom to `minZoom`/`maxZoom`.
   */
  terrainZoomByMapZoom?: TerrainZoomByMapZoom | null;
  /**
   * DEM coverage `[minX, minY, maxX, maxY]`. Applied as the tile-grid (and
   * overlay) extent so tiles outside the pyramid are not requested. Does not
   * change the XYZ origin — that still comes from the map.
   */
  elevationExtent?: number[];
  /**
   * Tile grid of the elevation pyramid. Defaults to the map's origin and
   * resolutions so `{z}` matches Hajk zoom indices. `extent` here is the same
   * clip as the top-level `elevationExtent` option.
   */
  elevationTileGrid?: ElevationTileGridOptions;
  /**
   * Hide the overlay below this Hajk map zoom. Unset by default so a limited
   * pyramid keeps showing water with its coarsest `{z}` when zoomed out. Set
   * this (or `maxResolution`) only if that underzoom would request too many tiles.
   */
  minMapZoom?: number;
  /**
   * OpenLayers layer `maxResolution` (exclusive). Derived from `minMapZoom`
   * when that is set; otherwise the overlay stays visible at every map zoom.
   */
  maxResolution?: number;
  /**
   * Multiplier applied when deriving `maxResolution` from `minMapZoom`.
   * `1` (default) uses the next coarser map resolution so the overlay stays
   * visible at `minMapZoom` itself.
   */
  maxResolutionSlack?: number;
  attributions?: string;
  minLevel?: number;
  maxLevel?: number;
  levelStep?: number;
  defaultLevel?: number;
  waterColor?: string;
  /** Deep-water end of the depth-shading ramp. Defaults to a darkened `waterColor`. */
  deepWaterColor?: string;
  /**
   * Discrete depth classes used when depth shading is on.
   * Empty, omitted or `null` keeps the linear `waterColor` → `deepWaterColor` ramp.
   */
  depthColors?: DepthColorStop[] | null;
  layerOpacity?: number;
  enableDepthShading?: boolean;
  maxShadingDepth?: number;
  animationDurationMs?: number;
  showElevationReadout?: boolean;
  /** Elevations at or below this value are treated as nodata (e.g. RGB 0,0,0). */
  minElevation?: number;
  /** Elevations at or above this value are treated as nodata. */
  maxElevation?: number;
  [key: string]: unknown;
}

export interface FloodSimulatorResolvedOptions {
  elevationUrl: string;
  elevationEncoding: ElevationEncoding;
  crossOrigin: ElevationCrossOrigin;
  elevationProjection: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  terrainZoomLookup: number[];
  elevationTileGrid: ElevationTileGridOptions;
  minMapZoom?: number;
  maxResolution?: number;
  maxResolutionSlack: number;
  attributions: string;
  minLevel: number;
  maxLevel: number;
  levelStep: number;
  defaultLevel: number;
  waterColor: string;
  deepWaterColor: string;
  depthColors: DepthColorStop[];
  layerOpacity: number;
  enableDepthShading: boolean;
  maxShadingDepth: number;
  animationDurationMs: number;
  showElevationReadout: boolean;
  minElevation: number;
  maxElevation: number;
}

export interface FloodSimulatorProps {
  app: HajkApp;
  map: OlMap;
  options: FloodSimulatorOptions;
  [key: string]: unknown;
}

export interface FloodSimulatorModelSettings extends FloodSimulatorOptions {
  app: HajkApp;
  map: OlMap;
}

export interface FloodSimulatorViewProps {
  map: OlMap;
  model: import("./FloodSimulatorModel").default;
  pluginShown: boolean;
  onHideRef: {
    current: (() => void) | null;
  };
}

export type { Pixel };
