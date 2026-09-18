export function parseDecimalInput(raw: string): number {
  return Number(raw.replace(",", "."));
}

export function isIntermediateNumber(raw: string): boolean {
  return (
    raw === "" ||
    raw === "-" ||
    raw === "." ||
    raw === "," ||
    raw === "-." ||
    raw === "-," ||
    raw.endsWith(".") ||
    raw.endsWith(",")
  );
}

export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export function clampNumber(
  value: number,
  min: number,
  max: number,
  decimals: number
): number {
  const rounded = Number(value.toFixed(decimals));
  return Math.min(max, Math.max(min, rounded));
}
