/**
 * Scale-based zoom settings. Scales are never saved: they are derived from the
 * saved resolutions and zoom values, and each committed edit writes those back.
 * Rows run finest first for the admin; resolutions run coarsest first, because
 * OpenLayers needs that.
 */

/** Metres per pixel at scale 1:1. Matches the client's scale bar. */
const RESOLUTION_PER_SCALE = 0.00028;

export const SCALE_PRESETS = [
  100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 15000, 20000,
  25000, 50000, 100000, 200000, 300000, 400000, 500000,
];

/** Starting rows when a map moves to a projection that uses scales. */
const DEFAULT_SCALES = [
  500000, 200000, 100000, 50000, 25000, 10000, 5000, 2000, 1000, 500,
];
const DEFAULT_START_SCALE = 100000;

/** Option keys that only make sense for the map's projection. */
const PROJECTION_OPTION_KEYS = [
  ...["scales", "printScales", "startScale", "minScale", "maxScale"],
  ...["resolutions", "extraPrintResolutions", "zoom", "minZoom", "maxZoom"],
  ...["extent", "center", "origin"],
];

export interface ScaleValues {
  scales: string[];
  printScales: string[];
  startScale: string;
  minScale: string;
  maxScale: string;
}

export interface ZoomOptions {
  resolutions: string;
  extraPrintResolutions: string;
  zoom: string;
  minZoom: string;
  maxZoom: string;
}

export type ScaleError =
  | "noScales"
  | "invalidScale"
  | "invalidPrintScale"
  | "invalidZoomScale"
  | "zoomOrder"
  | "maxIsCoarsest"
  | "printNotFiner";

export const SCALE_KEYS = [
  "scales",
  "printScales",
  "startScale",
  "minScale",
  "maxScale",
] as const;

export const SCALE_FIELD_NAMES = SCALE_KEYS.map((key) => `options.${key}`);

/** Accepts `1:5000`, `5000` and `1:5 000`. Null unless a positive whole number. */
export function parseScale(text: string): number | null {
  const digits = text.replace(/\s/g, "").replace(/^1:/, "");
  if (!/^\d+$/.test(digits)) return null;
  const scale = Number(digits);
  return scale > 0 && Number.isSafeInteger(scale) ? scale : null;
}

export function formatScale(scale: number): string {
  return `1:${scale}`;
}

/** Rounded to avoid float noise such as `0.8400000000000001`. */
export function scaleToResolution(scale: number): number {
  return Number((scale * RESOLUTION_PER_SCALE).toFixed(6));
}

function resolutionToScale(resolution: number): number {
  return Math.max(1, Math.round(resolution / RESOLUTION_PER_SCALE));
}

function parseResolutions(value: unknown): number[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map(Number)
    .filter((resolution) => Number.isFinite(resolution) && resolution > 0);
}

function zoomNumber(value: unknown): number {
  const zoom = Number(value);
  return Number.isFinite(zoom) ? Math.round(zoom) : 0;
}

/** Scale form values for a map's resolutions and zoom options. */
export function deriveScalesFromOptions(
  options: Record<string, unknown>,
): ScaleValues {
  const toRows = (value: unknown) =>
    parseResolutions(value).map((resolution) =>
      formatScale(resolutionToScale(resolution)),
    );
  const scales = toRows(options.resolutions);
  const rowAt = (zoom: number) =>
    scales[Math.max(0, Math.min(zoom, scales.length - 1))] ?? "";

  return {
    scales: [...scales].reverse(),
    printScales: toRows(options.extraPrintResolutions).reverse(),
    startScale: rowAt(zoomNumber(options.zoom)),
    minScale: rowAt(zoomNumber(options.minZoom)),
    // The client reads a maxZoom of 0 as no limit.
    maxScale: rowAt(zoomNumber(options.maxZoom) || scales.length - 1),
  };
}

/** Scale values from watched fields, in `SCALE_KEYS` order. */
export function toScaleValues(watched: unknown[]): ScaleValues {
  const [scales, printScales, startScale, minScale, maxScale] = watched;
  const asRows = (value: unknown) =>
    Array.isArray(value) ? (value as string[]) : [];
  const asText = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    scales: asRows(scales),
    printScales: asRows(printScales),
    startScale: asText(startScale),
    minScale: asText(minScale),
    maxScale: asText(maxScale),
  };
}

function filledRows(rows: string[]): string[] {
  return rows.filter((row) => row.trim() !== "");
}

function descendingUnique(scales: number[]): number[] {
  return Array.from(new Set(scales)).sort((a, b) => b - a);
}

function isScale(scale: number | null): scale is number {
  return scale !== null;
}

function readScales(values: ScaleValues) {
  const rows = filledRows(values.scales).map(parseScale);
  const printRows = filledRows(values.printScales).map(parseScale);
  const start = parseScale(values.startScale);
  const min = parseScale(values.minScale);
  const max = parseScale(values.maxScale);
  // Typed Start, Min and Max scales become rows.
  const merged = descendingUnique([...rows, start, min, max].filter(isScale));
  return { rows, printRows, start, min, max, merged };
}

export function validateScales(values: ScaleValues): ScaleError[] {
  const { rows, printRows, start, min, max, merged } = readScales(values);
  if (rows.length === 0) return ["noScales"];

  const errors: ScaleError[] = [];
  if (rows.includes(null)) errors.push("invalidScale");
  if (printRows.includes(null)) errors.push("invalidPrintScale");
  if (start === null || min === null || max === null) {
    errors.push("invalidZoomScale");
  } else {
    if (min < start || start < max) errors.push("zoomOrder");
    // The client reads a maxZoom of 0 as no limit.
    if (merged.length > 1 && max === merged[0]) errors.push("maxIsCoarsest");
  }
  // The client appends print resolutions, and OpenLayers needs one strictly
  // descending list.
  const finest = merged[merged.length - 1];
  if (printRows.some((scale) => scale !== null && scale >= finest)) {
    errors.push("printNotFiner");
  }
  return errors;
}

/**
 * Normalises the scale values and builds the options they stand for. With
 * validation errors the values come back as they are and `options` is null.
 * A scale that matches a current resolution keeps that exact value.
 */
export function applyScaleChange(
  values: ScaleValues,
  current: { resolutions?: unknown; extraPrintResolutions?: unknown },
): { values: ScaleValues; options: ZoomOptions | null } {
  const { printRows, start, min, max, merged } = readScales(values);
  if (
    validateScales(values).length > 0 ||
    start === null ||
    min === null ||
    max === null
  ) {
    return { values, options: null };
  }

  const printScales = descendingUnique(printRows.filter(isScale));

  const existing = new Map(
    [
      ...parseResolutions(current.resolutions),
      ...parseResolutions(current.extraPrintResolutions),
    ].map((resolution) => [resolutionToScale(resolution), resolution]),
  );
  const toResolutions = (scales: number[]) =>
    scales
      .map((scale) => existing.get(scale) ?? scaleToResolution(scale))
      .join(", ");

  return {
    values: {
      scales: [...merged].reverse().map(formatScale),
      printScales: [...printScales].reverse().map(formatScale),
      startScale: formatScale(start),
      minScale: formatScale(min),
      maxScale: formatScale(max),
    },
    options: {
      resolutions: toResolutions(merged),
      extraPrintResolutions: toResolutions(printScales),
      zoom: String(merged.indexOf(start)),
      minZoom: String(merged.indexOf(min)),
      maxZoom: String(merged.indexOf(max)),
    },
  };
}

export interface ScaleBounds {
  /** Options must be coarser than this scale. */
  coarserThan?: number;
  /** Options must be finer than this scale. */
  finerThan?: number;
}

/** Print scales must stay finer than every scale row. */
export function scaleRowBounds(values: ScaleValues): {
  scales: ScaleBounds;
  printScales: ScaleBounds;
} {
  const { printRows, merged } = readScales(values);
  const printScales = printRows.filter(isScale);
  return {
    scales: { coarserThan: Math.max(0, ...printScales) },
    printScales: { finerThan: merged[merged.length - 1] },
  };
}

/**
 * Presets for one row: coarser than the rows above it, and not used by another
 * row. Picking past a row below is fine, since rows re-sort on commit.
 */
export function scaleRowOptions(
  rows: string[],
  index: number,
  { coarserThan = 0, finerThan = Infinity }: ScaleBounds = {},
): string[] {
  const scales = rows.map(parseScale);
  const others = scales.filter((_, i) => i !== index);
  const lowest = Math.max(
    coarserThan,
    ...scales.slice(0, index).filter(isScale),
  );
  return SCALE_PRESETS.filter(
    (scale) => scale > lowest && scale < finerThan && !others.includes(scale),
  ).map(formatScale);
}

function isSameScale(a: string, b: string): boolean {
  const scale = parseScale(a);
  return scale !== null ? scale === parseScale(b) : a.trim() === b.trim();
}

function nearestRow(rows: string[], text: string): string {
  const target = parseScale(text);
  const scales = filledRows(rows).map(parseScale).filter(isScale);
  if (target === null || scales.length === 0) return "";
  const distance = (scale: number) => Math.abs(Math.log(scale / target));
  const nearest = scales.reduce((best, scale) =>
    distance(scale) < distance(best) ? scale : best,
  );
  return formatScale(nearest);
}

/** Moves Start, Min and Max off a scale that is no longer in `rows`. */
function withRows(
  values: ScaleValues,
  rows: string[],
  previous: string,
  replacement: string,
): ScaleValues {
  const next = { ...values, scales: rows };
  if (rows.some((row) => isSameScale(row, previous))) return next;
  const follow = (selected: string) =>
    isSameScale(selected, previous) ? replacement : selected;
  return {
    ...next,
    startScale: follow(values.startScale),
    minScale: follow(values.minScale),
    maxScale: follow(values.maxScale),
  };
}

/** Start, Min and Max on the edited row follow it, so the old scale isn't re-added. */
export function changeScaleRow(
  values: ScaleValues,
  index: number,
  text: string,
): ScaleValues {
  const previous = values.scales[index];
  const rows = values.scales.map((row, i) => (i === index ? text : row));
  const replacement = text.trim() === "" ? nearestRow(rows, previous) : text;
  return withRows(values, rows, previous, replacement);
}

/** Start, Min and Max on the removed row move to the nearest remaining row. */
export function removeScaleRow(
  values: ScaleValues,
  index: number,
): ScaleValues {
  const previous = values.scales[index];
  const rows = values.scales.filter((_, i) => i !== index);
  return withRows(values, rows, previous, nearestRow(rows, previous));
}

function defaultScaleOptions(): Record<string, unknown> {
  const { values, options } = applyScaleChange(
    {
      scales: DEFAULT_SCALES.map(formatScale),
      printScales: [],
      startScale: formatScale(DEFAULT_START_SCALE),
      minScale: formatScale(DEFAULT_SCALES[0]),
      maxScale: formatScale(DEFAULT_SCALES[DEFAULT_SCALES.length - 1]),
    },
    {},
  );
  return { ...values, ...options };
}

function extentOptions(extent: number[]): Record<string, string> {
  const [minX, minY, maxX, maxY] = extent;
  return {
    extent: extent.join(", "),
    center: `${Math.round((minX + maxX) / 2)}, ${Math.round((minY + maxY) / 2)}`,
    origin: "0,0",
  };
}

/**
 * Options to write when the main projection moves between the zoom-level and
 * scale groups. Coming back to the saved group restores the saved values. Going
 * from zoom levels to scales sets defaults, because Web Mercator resolutions
 * and coordinates mean nothing there. Otherwise null: nothing to write.
 */
export function optionsForProjectionGroupChange({
  usesZoomFields,
  savedUsesZoomFields,
  savedOptions,
  extent,
}: {
  usesZoomFields: boolean;
  savedUsesZoomFields: boolean;
  savedOptions: Record<string, unknown>;
  /** The new projection's extent, when known. */
  extent?: number[] | null;
}): Record<string, unknown> | null {
  if (usesZoomFields === savedUsesZoomFields) {
    return Object.fromEntries(
      PROJECTION_OPTION_KEYS.map((key) => [key, savedOptions[key]]),
    );
  }
  if (usesZoomFields) return null;
  return {
    ...defaultScaleOptions(),
    ...(extent?.length === 4 ? extentOptions(extent) : {}),
  };
}

/**
 * Rows aren't saved, so invalid edits would be lost on save. A map that loaded
 * invalid can still save other settings until its scales are edited.
 */
export function scaleEditsBlockSave(
  values: ScaleValues,
  loaded: ScaleValues,
): boolean {
  return (
    validateScales(values).length > 0 &&
    JSON.stringify(values) !== JSON.stringify(loaded)
  );
}
