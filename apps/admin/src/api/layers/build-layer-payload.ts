import type { LayerKind } from "./types";

const DISPLAY_DEFAULT_KEYS = new Set([
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
  "infoClickSettings",
]);

const SEARCH_DEFAULT_KEYS = new Set([
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
  "searchSettings",
]);

const EDITING_DEFAULT_KEYS = new Set(["geometryField"]);

const COMMON_DEFAULT_KEYS = new Set([
  "name",
  "internalName",
  "description",
  "selectedLayers",
  "locked",
  "metadata",
  "options",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Strip config defaults / merged fields that do not belong on this layer kind. */
export function filterDefaultsForLayerKind(
  kind: LayerKind,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = new Set<string>(COMMON_DEFAULT_KEYS);
  if (kind === "search") {
    SEARCH_DEFAULT_KEYS.forEach((key) => allowed.add(key));
  } else if (kind === "editing") {
    EDITING_DEFAULT_KEYS.forEach((key) => allowed.add(key));
  } else {
    DISPLAY_DEFAULT_KEYS.forEach((key) => allowed.add(key));
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (allowed.has(key)) {
      out[key] = value;
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

function flattenSearchSettings(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const nested = data.searchSettings;
  if (!isPlainObject(nested)) return {};
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

export function buildLayerUpdatePayload(
  kind: LayerKind,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const flat = { ...input, ...flattenSearchSettings(input) };
  const base: Record<string, unknown> = {
    layerKind: kind,
    name: flat.name,
    serviceId: flat.serviceId,
    selectedLayers: flat.selectedLayers,
    internalName: flat.internalName,
    description: flat.description,
    locked: flat.locked,
  };

  if (kind === "search") {
    return {
      ...base,
      active: flat.active,
      url: flat.url,
      searchFields: flat.searchFields,
      primaryDisplayFields: flat.primaryDisplayFields,
      secondaryDisplayFields: flat.secondaryDisplayFields,
      shortDisplayFields: flat.shortDisplayFields,
      outputFormat: flat.outputFormat,
      geometryField: flat.geometryField,
      infobox: flat.infobox,
      aliasDict: flat.aliasDict,
      zIndex: flat.zIndex,
      options: flat.options,
      metadata: flat.metadata,
    };
  }

  if (kind === "editing") {
    return {
      ...base,
      geometryField: flat.geometryField,
      options: flat.options,
    };
  }

  return {
    ...base,
    hidpi: flat.hidpi,
    tiled: flat.tiled,
    singleTile: flat.singleTile,
    customRatio: flat.customRatio,
    timeSliderVisible: flat.timeSliderVisible,
    timeSliderStart: flat.timeSliderStart,
    timeSliderEnd: flat.timeSliderEnd,
    hideExpandArrow: flat.hideExpandArrow,
    zIndex: flat.zIndex,
    style: flat.style,
    opacity: flat.opacity,
    minMaxZoomAlertOnToggleOnly: flat.minMaxZoomAlertOnToggleOnly,
    minZoom: flat.minZoom,
    maxZoom: flat.maxZoom,
    infoClickActive: flat.infoClickActive,
    showMetadata: flat.showMetadata,
    legendUrl: flat.legendUrl,
    legendIconUrl: flat.legendIconUrl,
    legendOptions: flat.legendOptions,
    options: flat.options,
    metadata: flat.metadata,
    infoClickSettings: flat.infoClickSettings,
  };
}
