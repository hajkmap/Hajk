/**
 * Where the map client takes a layer's infobox template from, which follows
 * from how the backend builds the client config for the service type:
 * - "sublayers": WMS, one template and infoclick switch per selected layer
 *   (the `infobox` / `queryable` of each row in `options.layersInfo`).
 * - "layer": VECTOR, one template for the layer (`infoClickSettings.definition`).
 * - "unsupported": the client never shows a template.
 * In every case a map can replace the template in its layer tree.
 */
export type InfoClickTarget = "sublayers" | "layer" | "unsupported";

export function infoClickTargetFor(
  serviceType: string | undefined,
): InfoClickTarget | undefined {
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

const toSublayerInfo = (row: Record<string, unknown>): SublayerInfo => {
  const { legendUrl, ...rest } = row;
  return {
    ...rest,
    ...(typeof rest.legend !== "string" &&
      typeof legendUrl === "string" && { legend: legendUrl }),
    definition:
      typeof row.definition === "string"
        ? row.definition
        : typeof row.infobox === "string"
          ? row.infobox
          : "",
    queryable: row.queryable === true,
  };
};

/**
 * The saved per-layer settings with an entry for every selected layer, read
 * the way the backend reads them (`definition`, else `infobox`; not queryable
 * unless saved as such). Other saved fields are kept as they are.
 */
export function sublayersInfoFrom(
  options: unknown,
  selectedLayers: string[],
): SublayersInfo {
  const raw = isRecord(options) ? options.layersInfo : undefined;
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

const asText = (value: unknown) => (typeof value === "string" ? value : "");

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
