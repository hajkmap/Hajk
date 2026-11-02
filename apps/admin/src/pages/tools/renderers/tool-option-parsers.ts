export function parseNumberList(text: string): number[] | null {
  const numbers = text
    .split(",")
    .map((part) => parseFloat(part.trim()))
    .filter((n) => Number.isFinite(n));
  return numbers.length > 0 ? numbers : null;
}

export function formatNumberList(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

export function parseTerrainBreakpoints(
  text: string,
): Record<string, number> | null {
  const result: Record<string, number> = {};
  text.split(",").forEach((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf(":");
    if (separator === -1) return;
    const zoom = parseFloat(trimmed.slice(0, separator));
    const terrainZoom = parseFloat(trimmed.slice(separator + 1));
    if (Number.isFinite(zoom) && Number.isFinite(terrainZoom)) {
      result[String(Math.trunc(zoom))] = terrainZoom;
    }
  });
  return Object.keys(result).length > 0 ? result : null;
}

export function formatTerrainBreakpoints(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((zoom) => `${zoom}:${(value as Record<string, number>)[zoom]}`)
    .join(", ");
}

export function storedNumber(raw: string): number | null {
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGroups(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export function formatGroups(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

/** Plain base64 as the legacy admin stored it; undecodable values are shown as-is. */
export function decodeInstruction(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  try {
    return atob(value);
  } catch {
    return value;
  }
}

/** Null when the text has characters plain base64 can't hold (outside Latin-1). */
export function encodeInstruction(text: string): string | null {
  try {
    return btoa(text);
  } catch {
    return null;
  }
}
