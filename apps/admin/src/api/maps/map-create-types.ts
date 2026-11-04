import { mergeWithConfigDefaults } from "../../lib/merge-with-config-defaults";
import { getDefaultMapProjectionCode } from "../../lib/map-defaults";
import useAppStateStore from "../../store/use-app-state-store";
export interface MapCreateOptionsInput {
  title?: string;
  description?: string;
  /** EPSG code selected in the create wizard; falls back to config default. */
  projection?: string;
  zoom?: string;
  minZoom?: string;
  maxZoom?: string;
  center?: string;
  origin?: string;
  extent?: string;
  resolutions?: string;
  extraPrintResolutions?: string;
  constrainResolution?: boolean | string;
  constrainOnlyCenter?: boolean | string;
  constrainResolutionMobile?: boolean | string;
}

export type MapOptionsRecord = Record<string, unknown>;

export interface MapCreateInput {
  name: string;
  locked?: boolean;
  options?: MapCreateOptionsInput;
}

export interface MapCreatePayload {
  name: string;
  locked: boolean;
  projection: { code: string };
  options: MapOptionsRecord;
}

function toOptionString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function normalizeMapOptions(
  options: Record<string, unknown>,
): MapOptionsRecord {
  const normalized: MapOptionsRecord = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === "colors") {
      normalized.colors = value;
      continue;
    }
    const asString = toOptionString(value);
    if (asString !== undefined) {
      normalized[key] = asString;
    }
  }
  return normalized;
}

/**
 * Builds the JSON body for `POST /maps`.
 * Merges `mapsDefault` from config.json into `options` (user dialog fields win).
 */
export function buildCreateMapPayload(input: MapCreateInput): MapCreatePayload {
  const { mapsDefault } = useAppStateStore.getState();
  const configDefaults = { ...(mapsDefault ?? {}) };

  const requestedProjection =
    typeof input.options?.projection === "string"
      ? input.options.projection.trim()
      : "";
  const projectionCode = requestedProjection || getDefaultMapProjectionCode();

  const mergedOptions = mergeWithConfigDefaults(
    configDefaults,
    { ...(input.options ?? {}) },
  );
  const normalizedOptions = normalizeMapOptions(mergedOptions);

  return {
    name: input.name.trim(),
    locked: input.locked ?? false,
    projection: { code: projectionCode },
    options: {
      ...normalizedOptions,
      projection: projectionCode,
    },
  };
}