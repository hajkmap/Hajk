import type { ToolZone } from "../../api/maps";

export const TOOL_PLACEMENT_ZONES: ToolZone[] = [
  "drawer",
  "widgetLeft",
  "widgetRight",
  "controlButton",
];

export const MAP_TOOL_DND_TYPE = "MAP_TOOL_PLACEMENT";

export interface MapToolDragItem {
  toolId: number;
}

/** Tool ids in visual order, one list per placement column. */
export type ToolColumnOrder = Record<ToolZone, number[]>;

/**
 * Moves `toolId` to `toIndex` in `toZone`.
 * `toIndex` is the index in the destination list before the tool is removed.
 * Returns null when the tool would land in the same slot.
 */
export function placementAfterMove(
  columns: ToolColumnOrder,
  toolId: number,
  toZone: ToolZone,
  toIndex: number,
): ToolColumnOrder | null {
  const fromZone = TOOL_PLACEMENT_ZONES.find((zone) =>
    columns[zone].includes(toolId),
  );
  let insertAt = toIndex;

  if (fromZone === toZone) {
    const fromIndex = columns[toZone].indexOf(toolId);
    if (fromIndex === insertAt || fromIndex + 1 === insertAt) {
      return null;
    }
    if (fromIndex < insertAt) {
      insertAt -= 1;
    }
  }

  const next: ToolColumnOrder = {
    drawer: columns.drawer.filter((id) => id !== toolId),
    widgetLeft: columns.widgetLeft.filter((id) => id !== toolId),
    widgetRight: columns.widgetRight.filter((id) => id !== toolId),
    controlButton: columns.controlButton.filter((id) => id !== toolId),
  };
  const dest = next[toZone];
  const clamped = Math.max(0, Math.min(insertAt, dest.length));
  dest.splice(clamped, 0, toolId);
  return next;
}
