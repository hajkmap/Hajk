/**
 * Where the map client takes a layer's infobox template from, which follows
 * from how the backend builds the client config for the service type:
 * - "sublayers": WMS, one template and infoclick switch per selected layer
 *   (`infoClickSettings.options`, exported as `layersInfo`).
 * - "layer": VECTOR and search (WFS), one template for the layer
 *   (`infoClickSettings.definition`). Search uses the same template as legacy
 *   `infobox`, plus the three display-field lists.
 * - "unsupported": the client never shows a template.
 * In every case a map can replace the template in its layer tree.
 */
export type InfoClickTarget = "sublayers" | "layer" | "unsupported";

export function infoClickTargetFor(
  serviceType: string | undefined,
  category?: "display" | "search" | "editing",
): InfoClickTarget | undefined {
  if (category === "search") return "layer";
  switch (serviceType) {
    case undefined:
      return undefined;
    case "WMS":
      return "sublayers";
    case "VECTOR":
      return "layer";
    default:
      return "unsupported";
  }
}

export interface SublayerInfo {
  definition: string;
  queryable: boolean;
  caption?: string;
  [key: string]: unknown;
}

export type SublayersInfo = Record<string, SublayerInfo>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const textOf = (value: unknown) => (typeof value === "string" ? value : "");

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
};

/** Form shape. Accepts the shared InfoClickSettings names and the older client names. */
const toSublayerInfo = (row: Record<string, unknown>): SublayerInfo => {
  const { legendUrl, icon, active, displayFields, shortDisplayFields, ...rest } =
    row;
  return {
    ...rest,
    ...(typeof rest.legend !== "string" && typeof legendUrl === "string"
      ? { legend: legendUrl }
      : {}),
    definition: firstText(row.definition, row.infobox),
    queryable: active === true || row.queryable === true,
    infoclickIcon: firstText(row.infoclickIcon, icon),
    searchDisplayName: firstText(row.searchDisplayName, displayFields),
    searchShortDisplayName: firstText(
      row.searchShortDisplayName,
      shortDisplayFields,
    ),
  };
};

/**
 * The saved per-layer settings with an entry for every selected layer.
 * `source` is either `infoClickSettings.options` or the older `options.layersInfo`.
 */
export function sublayersInfoFrom(
  source: unknown,
  selectedLayers: string[],
): SublayersInfo {
  const raw = isRecord(source) ? source.layersInfo ?? source.layers : source;
  const saved: Record<string, Record<string, unknown>> = {};

  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (isRecord(row) && typeof row.id === "string") saved[row.id] = row;
    }
  } else if (isRecord(raw)) {
    for (const [name, row] of Object.entries(raw)) {
      if (isRecord(row)) saved[name] = row;
    }
  }

  const result: SublayersInfo = {};
  for (const [name, row] of Object.entries(saved)) {
    result[name] = toSublayerInfo(row);
  }
  for (const name of selectedLayers) {
    result[name] ??= toSublayerInfo({});
  }
  return result;
}

export interface LayersInfoRow {
  id: string;
  caption: string;
  legend: string;
  legendIcon: string;
  infobox: string;
  style: string;
  queryable: boolean;
  [key: string]: unknown;
}

const asText = textOf;

/** Saved rows, preferring InfoClickSettings and falling back to options.layersInfo. */
export function infoClickLayersFrom(
  settings: { options?: unknown } | null | undefined,
  layerOptions: unknown,
  selectedLayers: string[],
): SublayersInfo {
  const stored = settings?.options;
  if (Array.isArray(stored) && stored.length > 0) {
    return sublayersInfoFrom(stored, selectedLayers);
  }
  return sublayersInfoFrom(layerOptions, selectedLayers);
}

const STORED_ROW_KEYS = new Set([
  "id",
  "caption",
  "style",
  "definition",
  "infobox",
  "icon",
  "infoclickIcon",
  "active",
  "queryable",
  "displayFields",
  "searchDisplayName",
  "secondaryLabelFields",
  "shortDisplayFields",
  "searchShortDisplayName",
  "legend",
  "legendIcon",
  "legendUrl",
]);

/**
 * WMS rows stored on InfoClickSettings.options. Names match the model columns.
 * Search-only extras on the same legacy row (url, property, geometry) are kept.
 */
export function toInfoClickLayers(
  info: SublayersInfo,
  selectedLayers: string[],
): Record<string, unknown>[] {
  return selectedLayers.map((id) => {
    const row = info[id] ?? toSublayerInfo({});
    const extra = Object.fromEntries(
      Object.entries(row).filter(
        ([key, value]) => !STORED_ROW_KEYS.has(key) && value !== undefined,
      ),
    );
    return {
      id,
      caption: asText(row.caption),
      style: asText(row.style),
      definition: row.definition,
      icon: asText(row.infoclickIcon ?? row.icon),
      active: row.queryable === true,
      displayFields: asText(row.searchDisplayName ?? row.displayFields),
      secondaryLabelFields: asText(row.secondaryLabelFields),
      shortDisplayFields: asText(
        row.searchShortDisplayName ?? row.shortDisplayFields,
      ),
      legend: asText(row.legend),
      legendIcon: asText(row.legendIcon),
      ...extra,
    };
  });
}

const ROW_KEYS = new Set([
  "id",
  "caption",
  "legend",
  "legendIcon",
  "infobox",
  "style",
  "queryable",
  "definition",
]);

/**
 * `options.layersInfo` as stored in layers.json: one row per selected layer,
 * in the order of `selectedLayers`. The backend hands an array to the client
 * as it is, and the client builds STYLES from the row order, so the rows must
 * match the selected layers exactly and use the client's field names.
 */
export function toLayersInfoArray(
  info: SublayersInfo,
  selectedLayers: string[],
): LayersInfoRow[] {
  return selectedLayers.map((id) => {
    const row = info[id] ?? toSublayerInfo({});
    const extra = Object.fromEntries(
      Object.entries(row).filter(
        ([key, value]) => !ROW_KEYS.has(key) && value !== undefined,
      ),
    );
    return {
      id,
      caption: asText(row.caption),
      legend: asText(row.legend),
      legendIcon: asText(row.legendIcon),
      infobox: row.definition,
      style: asText(row.style),
      queryable: row.queryable === true,
      ...extra,
    };
  });
}
