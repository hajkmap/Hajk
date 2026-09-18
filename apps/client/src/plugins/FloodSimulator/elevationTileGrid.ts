import TileGrid from "ol/tilegrid/TileGrid";

import type { Options as TileGridOptions } from "ol/tilegrid/TileGrid";
import type { Coordinate } from "ol/coordinate";
import type { Extent } from "ol/extent";
import type { NearestDirectionFunction } from "ol/array";
import type { TerrainZoomByMapZoom } from "./types";

export interface ElevationTileGridConfig {
  origin?: number[];
  extent?: number[];
  resolutions?: number[];
}

export interface MapTileConfig {
  origin?: number[];
  extent?: number[];
  resolutions?: number[];
  projection?: string;
}

/**
 * Tile grid that asks for terrain-pyramid Z values instead of the Hajk view zoom.
 * `{x}`/`{y}` are computed at the mapped Z, so overzoom / underzoom still lines up.
 *
 * Relies on OpenLayers calling `getZForResolution` *before* `getTileCoordForCoordAndZ`
 * / `getTileRangeForExtentAndZ`. The two call sites this is known to work with are:
 * - `ol/renderer/webgl/TileLayerBase.js` (render / enqueueTiles)
 * - `ol/renderer/webgl/TileLayer.js` `WebGLTileLayerRenderer.getData()`
 * That ordering is internal, not public API — an `ol` minor upgrade can break it.
 */
class MappedTileGrid extends TileGrid {
  #lookup: number[];

  constructor(options: TileGridOptions, lookup: number[]) {
    super(options);
    this.#lookup = lookup;
  }

  getZForResolution(
    resolution: number,
    direction?: number | NearestDirectionFunction
  ): number {
    const mapZ = super.getZForResolution(resolution, direction);
    const mapped = this.#lookup[mapZ];
    if (Number.isFinite(mapped)) {
      return mapped;
    }
    const last = this.#lookup[this.#lookup.length - 1];
    return Number.isFinite(last) ? last : mapZ;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * One terrain Z per Hajk map zoom index.
 * `terrainZoomByMapZoom` may be a full list (`[4,4,4,4,4,5,6,…]`) or breakpoints
 * (`{ "0": 4, "5": 5, "6": 6 }`). Otherwise each map zoom is clamped to min/max.
 */
export function resolveTerrainZoomLookup(options: {
  terrainZoomByMapZoom?: TerrainZoomByMapZoom | null;
  minZoom: number;
  maxZoom: number;
  mapZoomCount: number;
}): number[] {
  const length = Math.max(1, Math.round(options.mapZoomCount));
  const mapping = options.terrainZoomByMapZoom;

  if (Array.isArray(mapping)) {
    if (mapping.length > 0) {
      return lookupFromArray(mapping, length, options.minZoom);
    }
  } else if (mapping) {
    return lookupFromBreakpoints(mapping, length, options.minZoom);
  }

  return Array.from({ length }, (_, z) =>
    clamp(z, options.minZoom, options.maxZoom)
  );
}

export function zoomRangeFromLookup(lookup: number[]): {
  minZoom: number;
  maxZoom: number;
} {
  return {
    minZoom: Math.min(...lookup),
    maxZoom: Math.max(...lookup),
  };
}

/**
 * OpenLayers `maxResolution` is exclusive: the layer is hidden when
 * `viewResolution >= maxResolution`. Using the next coarser map resolution
 * (slack 1) keeps the overlay visible at `minMapZoom` and hides it one Hajk
 * zoom further out.
 *
 * No cutoff is applied unless `maxResolution` or `minMapZoom` is set — a
 * limited pyramid is supposed to keep showing water by reusing its coarsest
 * `{z}` when zoomed out.
 */
export function resolveLayerMaxResolution(params: {
  maxResolution?: number;
  minMapZoom?: number;
  maxResolutionSlack: number;
  resolutions?: number[];
}): number | undefined {
  if (Number.isFinite(params.maxResolution)) {
    return params.maxResolution;
  }

  if (!Number.isFinite(params.minMapZoom)) {
    return undefined;
  }

  const resolutions = params.resolutions;
  if (!isNumberArray(resolutions, 1)) {
    return undefined;
  }

  const hideBelowZoom = Math.round(params.minMapZoom as number);
  if (hideBelowZoom <= 0) {
    return undefined;
  }

  const z = clamp(hideBelowZoom, 1, resolutions.length - 1);
  const coarsestVisible = resolutions[z];
  const nextCoarser = resolutions[z - 1];
  if (!Number.isFinite(coarsestVisible) || !Number.isFinite(nextCoarser)) {
    return undefined;
  }

  if (params.maxResolutionSlack === 1) {
    return nextCoarser;
  }

  return coarsestVisible * params.maxResolutionSlack;
}

export function parseExtent(value: unknown): Extent | undefined {
  if (!isNumberArray(value, 4)) {
    return undefined;
  }
  const [minX, minY, maxX, maxY] = value;
  if (minX >= maxX || minY >= maxY) {
    return undefined;
  }
  return [minX, minY, maxX, maxY];
}

export function createElevationTileGrid(params: {
  origin?: number[];
  extent?: number[];
  originExtent?: number[];
  resolutions?: number[];
  tileSize: number;
  lookup: number[];
}): TileGrid | undefined {
  const { origin, extent, originExtent, resolutions, tileSize, lookup } =
    params;
  if (!isNumberArray(resolutions, 1)) {
    return undefined;
  }

  const xyzOrigin = resolveXyzOrigin(origin, originExtent ?? extent);
  if (!xyzOrigin) {
    return undefined;
  }

  return new MappedTileGrid(
    {
      origin: xyzOrigin,
      extent: parseExtent(extent),
      resolutions,
      tileSize,
    },
    lookup
  );
}

/**
 * XYZ / Terrain-RGB tiles use a top-left origin (Y increases south in tile space).
 * Hajk's map.origin is often the bottom-left of the extent (e.g. `0,0`), which
 * makes OpenLayers request negative `{y}` values.
 */
export function resolveXyzOrigin(
  origin?: number[],
  extent?: number[]
): Coordinate | undefined {
  const hasExtent = isNumberArray(extent, 4);
  const hasOrigin = isNumberArray(origin, 2);

  if (hasOrigin && hasExtent) {
    const south = extent[1];
    const north = extent[3];
    const closerToSouth =
      Math.abs(origin[1] - south) <= Math.abs(origin[1] - north);
    return closerToSouth ? [origin[0], north] : [origin[0], origin[1]];
  }

  if (hasExtent) {
    return [extent[0], extent[3]];
  }

  if (hasOrigin) {
    return [origin[0], origin[1]];
  }

  return undefined;
}

function lookupFromArray(
  mapping: number[],
  length: number,
  fallback: number
): number[] {
  const result: number[] = [];
  let current = fallback;
  for (let z = 0; z < length; z++) {
    const raw = mapping[z];
    if (Number.isFinite(raw)) {
      current = Math.round(raw);
    }
    result[z] = current;
  }
  return result;
}

function lookupFromBreakpoints(
  breakpoints: Record<string, number>,
  length: number,
  fallback: number
): number[] {
  const keys = Object.keys(breakpoints)
    .map(Number)
    .filter((z) => Number.isFinite(z))
    .sort((a, b) => a - b);

  let current = fallback;
  if (keys.length > 0) {
    const first = breakpoints[String(keys[0])];
    if (Number.isFinite(first)) {
      current = Math.round(first);
    }
  }

  const result: number[] = [];
  for (let z = 0; z < length; z++) {
    const raw = breakpoints[String(z)];
    if (Number.isFinite(raw)) {
      current = Math.round(raw);
    }
    result[z] = current;
  }
  return result;
}

function isNumberArray(value: unknown, minLength: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= minLength &&
    value.every((entry) => Number.isFinite(entry))
  );
}
