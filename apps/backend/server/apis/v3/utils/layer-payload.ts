import type { Prisma } from "@prisma/client";

export type LayerKind = "display" | "search" | "editing";

const COMMON_KEYS = [
  "name",
  "internalName",
  "description",
  "selectedLayers",
  "locked",
] as const;

const DISPLAY_SCALAR_KEYS = [
  "opacity",
  "maxZoom",
  "minZoom",
  "minMaxZoomAlertOnToggleOnly",
  "tiled",
  "singleTile",
  "hidpi",
  "legendOptions",
  "legendUrl",
  "legendIconUrl",
  "style",
  "customRatio",
  "showMetadata",
  "infoClickActive",
  "timeSliderVisible",
  "timeSliderStart",
  "timeSliderEnd",
  "hideExpandArrow",
  "zIndex",
] as const;

const SEARCH_SCALAR_KEYS = [
  "active",
  "url",
  "searchFields",
  "primaryDisplayFields",
  "secondaryDisplayFields",
  "shortDisplayFields",
  "outputFormat",
  "geometryField",
  "infobox",
  "aliasDict",
  "zIndex",
] as const;

const EDITING_SCALAR_KEYS = ["geometryField"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyDefined(
  source: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
}

/** Legacy API nests search fields under `searchSettings`; SearchLayer stores them flat. */
export function flattenSearchSettings(
  data: Record<string, unknown>
): Record<string, unknown> {
  const nested = data.searchSettings;
  if (!isPlainObject(nested)) {
    return {};
  }
  return {
    active: nested.active,
    url: nested.url,
    searchFields: toStringArray(nested.searchFields),
    primaryDisplayFields: toStringArray(nested.primaryDisplayFields),
    secondaryDisplayFields: toStringArray(nested.secondaryDisplayFields),
    shortDisplayFields: toStringArray(nested.shortDisplayFields),
    outputFormat: nested.outputFormat,
    geometryField: nested.geometryField,
    infobox: nested.infobox,
    aliasDict: nested.aliasDict,
  };
}

export function pickLayerCreateData(
  kind: LayerKind,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const flat = { ...raw, ...flattenSearchSettings(raw) };
  const common = copyDefined(flat, COMMON_KEYS);

  if (kind === "search") {
    const search = copyDefined(flat, SEARCH_SCALAR_KEYS);
    if (search.searchFields === undefined && flat.searchFields !== undefined) {
      search.searchFields = toStringArray(flat.searchFields);
    }
    return {
      ...common,
      ...search,
      ...(flat.options !== undefined ? { options: flat.options } : {}),
      ...(flat.metadata !== undefined ? { metadata: flat.metadata } : {}),
    };
  }

  if (kind === "editing") {
    return {
      ...common,
      ...copyDefined(flat, EDITING_SCALAR_KEYS),
      ...(flat.options !== undefined ? { options: flat.options } : {}),
    };
  }

  return {
    ...common,
    ...copyDefined(flat, DISPLAY_SCALAR_KEYS),
    ...(flat.options !== undefined ? { options: flat.options } : {}),
    ...(flat.metadata !== undefined ? { metadata: flat.metadata } : {}),
    ...(flat.infoClickSettings !== undefined
      ? { infoClickSettings: flat.infoClickSettings }
      : {}),
  };
}

export function pickLayerUpdateData(
  kind: LayerKind,
  raw: Record<string, unknown>
): {
  scalars: Record<string, unknown>;
  options?: Prisma.InputJsonValue;
  metadata?: unknown;
  infoClickSettings?: unknown;
} {
  const flat = { ...raw, ...flattenSearchSettings(raw) };
  const options =
    flat.options !== undefined
      ? (flat.options as Prisma.InputJsonValue)
      : undefined;

  if (kind === "search") {
    const search = copyDefined(flat, SEARCH_SCALAR_KEYS);
    if (search.searchFields === undefined && flat.searchFields !== undefined) {
      search.searchFields = toStringArray(flat.searchFields);
    }
    return {
      scalars: { ...copyDefined(flat, COMMON_KEYS), ...search },
      options,
      metadata: flat.metadata,
    };
  }

  if (kind === "editing") {
    return {
      scalars: {
        ...copyDefined(flat, COMMON_KEYS),
        ...copyDefined(flat, EDITING_SCALAR_KEYS),
      },
      options,
    };
  }

  return {
    scalars: { ...copyDefined(flat, COMMON_KEYS), ...copyDefined(flat, DISPLAY_SCALAR_KEYS) },
    options,
    metadata: flat.metadata,
    infoClickSettings: flat.infoClickSettings,
  };
}
