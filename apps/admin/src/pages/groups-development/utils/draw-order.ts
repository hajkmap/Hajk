/** Build top→bottom order: highest drawOrder first; alphabetic for ties. */
export function buildDrawOrderIds(
  layers: { id: string; name: string }[],
  drawOrderById: Record<string, number | undefined>,
): string[] {
  return layers
    .slice()
    .sort((a, b) => {
      const orderA = drawOrderById[a.id] ?? 1000;
      const orderB = drawOrderById[b.id] ?? 1000;
      if (orderA !== orderB) {
        return orderB - orderA;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    })
    .map((layer) => layer.id);
}

/** Assign drawOrder with bottom = 1, ascending toward the top. */
export function drawOrdersFromTopToBottom(
  orderedIdsTopToBottom: string[],
): Record<string, number> {
  const total = orderedIdsTopToBottom.length;
  const result: Record<string, number> = {};
  orderedIdsTopToBottom.forEach((id, index) => {
    result[id] = total - index;
  });
  return result;
}
