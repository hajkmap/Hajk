import TileGrid from "ol/tilegrid/TileGrid";

import type { Coordinate } from "ol/coordinate";
import type { Extent } from "ol/extent";
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

export interface LookupTileGrid {
  /** Tile grid whose zoom index `i` has resolution `resolutions[levels[i]]`. */
  grid: TileGrid;
  /** Terrain pyramid `{z}` for each grid zoom index (used in the tile URL). */
  levels: number[];
}

/**
 * Elevation tile grid with the map-zoom → terrain-level mapping encoded in the
 * grid *data* instead of an overridden `getZForResolution` (which would rely on
 * internal renderer call ordering).
 *
 * The grid has one zoom index per distinct terrain level, with the map
 * resolution of that level. Whichever index the renderer's nearest-resolution
 * match picks, it maps to a valid level: map resolutions are strictly
 * decreasing, so a view resolution between two map zooms is nearest the level
 * used at those zooms, and zooming past the pyramid edges reuses the coarsest
 * / finest level — the same clamp the lookup describes.
 *
 * Grid zoom `i` tiles the extent exactly like pyramid level `levels[i]`
 * (the plugin's documented invariant), so `{x}`/`{y}` carry over unchanged;
 * only the URL `{z}` needs rewriting, which the source's url getter does.
 */
export function createLookupTileGrid(params: {
  lookup?: number[];
  resolutions?: number[];
  origin?: number[];
  originExtent?: number[];
  extent?: number[];
  tileSize: number;
}): LookupTileGrid | undefined {
  const { lookup, resolutions, origin, extent, originExtent, tileSize } =
    params;
  if (!isNumberArray(resolutions, 1) || !isNumberArray(lookup, 1)) {
    return undefined;
  }
  if (!lookup.every((level) => isValidLevel(level, resolutions.length))) {
    return undefined;
  }
  const levels = distinctLevels(monotoneLookup(lookup));
  if (levels.length === 0) {
    return undefined;
  }

  const xyzOrigin = resolveXyzOrigin(origin, originExtent ?? extent);
  if (!xyzOrigin) {
    return undefined;
  }

  return {
    grid: new TileGrid({
      origin: xyzOrigin,
      extent: parseExtent(extent),
      resolutions: levels.map((level) => resolutions[level]),
      tileSize,
    }),
    levels,
  };
}

/**
 * A pathological `terrainZoomByMapZoom` can map a finer terrain level to a
 * lower map zoom than to a higher one. Such a lookup cannot be encoded as
 * grid resolutions (they must be strictly descending), so it is replaced with
 * the equivalent of the default `minZoom`/`maxZoom` clamping.
 */
function monotoneLookup(lookup: number[]): number[] {
  for (let i = 1; i < lookup.length; i++) {
    if (lookup[i] < lookup[i - 1]) {
      console.warn(
        "FloodSimulator: terrainZoomByMapZoom is not monotone (a finer terrain level is mapped to a lower map zoom than a higher one); using the minZoom/maxZoom clamp instead."
      );
      const min = Math.min(...lookup);
      const max = Math.max(...lookup);
      return lookup.map((_, z) => clamp(z, min, max));
    }
  }
  return lookup;
}

function distinctLevels(lookup: number[]): number[] {
  const levels: number[] = [];
  for (const level of lookup) {
    if (levels[levels.length - 1] !== level) {
      levels.push(level);
    }
  }
  return levels;
}

function isValidLevel(level: number, resolutionCount: number): boolean {
  return Number.isInteger(level) && level >= 0 && level < resolutionCount;
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
