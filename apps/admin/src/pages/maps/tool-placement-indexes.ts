import type { ToolOnMap, ToolZone } from "../../api/maps";
import { getMapToolFieldConfig } from "./map-tool-field-config";
import {
  findToolZoneForId,
  zoneKeyToTarget,
  type ToolZones,
} from "./map-tools-utils";

const TOOL_PLACEMENTS: ReadonlySet<ToolZone> = new Set([
  "drawer",
  "widgetLeft",
  "widgetRight",
  "controlButton",
]);

/** Placement target for an active tool, or "" when unplaced / inactive. */
export function findToolPlacement(
  toolId: number,
  zones: ToolZones,
  activeToolIds: Set<number>,
): ToolZone | "" {
  if (!activeToolIds.has(toolId)) return "";
  const zone = findToolZoneForId(zones, toolId);
  return zone ? zoneKeyToTarget(zone) : "";
}

/**
 * Indexes already used by other active tools that share the same placement.
 * Applies to every placement zone (drawer, widgetLeft, widgetRight, controlButton).
 * Unplaced tools (`""`) are not constrained.
 */
export function getTakenIndexesForPlacement(
  placement: ToolZone | "",
  indexes: Record<number, number>,
  zones: ToolZones,
  activeToolIds: Set<number>,
  toolTypesById: Map<number, string>,
  excludeToolId?: number,
  mapTools: ToolOnMap[] = [],
): Set<number> {
  const taken = new Set<number>();
  if (placement === "" || !TOOL_PLACEMENTS.has(placement)) {
    return taken;
  }

  const mapIndexById = new Map<number, number>();
  for (const tool of mapTools) {
    mapIndexById.set(tool.toolId, tool.index);
  }

  for (const toolId of Array.from(activeToolIds)) {
    if (excludeToolId != null && toolId === excludeToolId) continue;
    if (!getMapToolFieldConfig(toolTypesById.get(toolId) ?? "").index) continue;
    if (findToolPlacement(toolId, zones, activeToolIds) !== placement) continue;

    const index = indexes[toolId] ?? mapIndexById.get(toolId);
    if (index != null) taken.add(index);
  }

  return taken;
}

/** Next free index in `direction`, starting at `start` (inclusive). */
export function findNextAvailableToolIndex(
  start: number,
  direction: 1 | -1,
  taken: Set<number>,
): number {
  let candidate = start;
  for (let i = 0; i < 10000; i++) {
    if (!taken.has(candidate)) return candidate;
    candidate += direction;
  }
  return candidate;
}
