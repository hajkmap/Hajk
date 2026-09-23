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

/**
 * Fractional-digit count of a step value, clamped to `[0, max]`. Used so a
 * fine `levelStep` (e.g. `0.001`) is not quantized to a coarser precision.
 */
export function decimalsFromStep(step: number, max = 4): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const text = String(step);
  let decimals: number;
  if (text.includes("e") || text.includes("E")) {
    decimals = -Math.floor(Math.log10(step));
  } else {
    const fraction = text.split(".")[1];
    decimals = fraction === undefined ? 0 : fraction.length;
  }
  return Math.min(max, Math.max(0, decimals));
}
