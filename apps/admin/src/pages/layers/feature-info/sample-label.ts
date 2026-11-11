const MAX_LABEL_LENGTH = 60;

/** Tried first, in this order, when the layer has no display field. */
const NAME_KEYS = [
  "namn",
  "name",
  "titel",
  "title",
  "caption",
  "label",
  "beteckning",
  "benamning",
];

const COMPOUND_SUFFIXES = ["namn", "titel", "beteckning", "benamning"];

export function displayFieldNames(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
}

function asLabel(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > 200) return null;
  if (/^https?:/i.test(text) || text.startsWith("{") || text.startsWith("[")) {
    return null;
  }
  return text.length > MAX_LABEL_LENGTH
    ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}…`
    : text;
}

function nameRank(key: string): number {
  const lower = key.toLowerCase();
  const exact = NAME_KEYS.indexOf(lower);
  if (exact >= 0) return exact;
  const compound = COMPOUND_SUFFIXES.findIndex(
    (suffix) => lower.endsWith(`_${suffix}`) || lower.endsWith(suffix),
  );
  return compound === -1 ? -1 : NAME_KEYS.length + compound;
}

/**
 * A short name for a real feature in the preview list. Uses the layer's
 * display fields first, then a name-like attribute, then the first readable
 * attribute. Returns null only when nothing can be shown.
 */
export function sampleFeatureLabel(
  properties: Record<string, unknown>,
  displayFields: string[],
): string | null {
  for (const field of displayFields) {
    const label = asLabel(properties[field]);
    if (label) return label;
  }

  let best: { rank: number; label: string } | null = null;
  let first: string | null = null;
  for (const [key, value] of Object.entries(properties)) {
    const label = asLabel(value);
    if (!label) continue;
    first ??= label;
    const rank = nameRank(key);
    if (rank >= 0 && (best === null || rank < best.rank)) best = { rank, label };
  }
  return best?.label ?? first;
}
