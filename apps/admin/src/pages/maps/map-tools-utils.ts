import type { TreeItem } from "dnd-kit-sortable-tree";
import type { ToolOnMap } from "../../api/maps";
import type { Tool } from "../../api/tools";
import type { TreeItemData } from "../../components/layerswitcher-dnd";
import { ID_DELIMITER } from "../../components/layerswitcher-dnd";

export interface ToolZones {
  drawer: TreeItem<TreeItemData>[];
  widgetLeft: TreeItem<TreeItemData>[];
  widgetRight: TreeItem<TreeItemData>[];
  control: TreeItem<TreeItemData>[];
}

export const EMPTY_TOOL_ZONES: ToolZones = {
  drawer: [],
  widgetLeft: [],
  widgetRight: [],
  control: [],
};

export type ToolZoneKey = keyof ToolZones;

const ZONE_TO_TARGET: Record<ToolZoneKey, string> = {
  drawer: "drawer",
  widgetLeft: "widgetLeft",
  widgetRight: "widgetRight",
  control: "controlButton",
};

const BACKEND_TARGET_TO_ZONE: Record<string, ToolZoneKey> = {
  drawer: "drawer",
  widgetLeft: "widgetLeft",
  widgetRight: "widgetRight",
  controlButton: "control",
};

/** Legacy client `options.target` values mapped to admin placement zones. */
const LEGACY_TARGET_TO_ZONE: Record<string, ToolZoneKey | null> = {
  toolbar: "drawer",
  left: "widgetLeft",
  right: "widgetRight",
  control: "control",
  hidden: null,
};

export function getToolDisplayName(tool: ToolOnMap): string {
  const title = tool.tool.options?.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }
  return tool.tool.type;
}

export function getCatalogToolDisplayName(tool: Tool): string {
  if (typeof tool.title === "string" && tool.title.trim()) {
    return tool.title.trim();
  }
  return tool.type;
}

function legacyOptionsTarget(tool: ToolOnMap): string | null {
  const target = tool.tool.options?.target;
  return typeof target === "string" ? target : null;
}

/** Resolves which placement zone a map tool belongs in, if any. */
export function resolveToolZone(tool: ToolOnMap): ToolZoneKey | null {
  if (tool.target) {
    return BACKEND_TARGET_TO_ZONE[tool.target] ?? null;
  }

  const legacyTarget = legacyOptionsTarget(tool);
  if (legacyTarget) {
    return LEGACY_TARGET_TO_ZONE[legacyTarget] ?? null;
  }

  return null;
}

export function isHiddenMapTool(tool: ToolOnMap): boolean {
  return legacyOptionsTarget(tool) === "hidden";
}

function toZoneItem(tool: ToolOnMap): TreeItem<TreeItemData> {
  return {
    id: `tool${ID_DELIMITER}${tool.toolId}`,
    name: getToolDisplayName(tool),
    type: "tool",
    canHaveChildren: false,
  };
}

/** Groups map tools into placement zones using backend target or legacy options.target. */
export function mapToolsToZones(mapTools: ToolOnMap[]): ToolZones {
  const zones: ToolZones = {
    drawer: [],
    widgetLeft: [],
    widgetRight: [],
    control: [],
  };

  const byZone = new Map<ToolZoneKey, ToolOnMap[]>();

  for (const tool of mapTools) {
    if (isHiddenMapTool(tool)) continue;

    const zone = resolveToolZone(tool);
    if (!zone) continue;

    const bucket = byZone.get(zone);
    if (bucket) bucket.push(tool);
    else byZone.set(zone, [tool]);
  }

  (Object.keys(zones) as ToolZoneKey[]).forEach((zone) => {
    zones[zone] = (byZone.get(zone) ?? [])
      .slice()
      .sort((a, b) => a.index - b.index)
      .map(toZoneItem);
  });

  return zones;
}

export function collectPlacedToolIds(zones: ToolZones): Set<number> {
  const ids = new Set<number>();
  (Object.keys(zones) as ToolZoneKey[]).forEach((zone) => {
    zones[zone].forEach((item) => {
      const parts = String(item.id).split(ID_DELIMITER);
      const toolId = Number(parts[parts.length - 1]);
      if (!Number.isNaN(toolId)) ids.add(toolId);
    });
  });
  return ids;
}

/** Map tools that are on the map but not assigned to a placement zone. */
export function getUnplacedMapTools(
  mapTools: ToolOnMap[],
  zones: ToolZones,
): ToolOnMap[] {
  const placedIds = collectPlacedToolIds(zones);

  return mapTools
    .filter((tool) => !isHiddenMapTool(tool) && !placedIds.has(tool.toolId))
    .slice()
    .sort((a, b) => a.index - b.index);
}

export function unplacedMapToolsToSourceItems(
  mapTools: ToolOnMap[],
  zones: ToolZones,
): { id: string; name: string }[] {
  return getUnplacedMapTools(mapTools, zones).map((tool) => ({
    id: String(tool.toolId),
    name: getToolDisplayName(tool),
  }));
}

/** All catalog tools not yet placed in a zone — available to drag onto the map. */
export function catalogToolsToSourceItems(
  catalogTools: Tool[],
  zones: ToolZones,
): { id: string; name: string }[] {
  const placedIds = collectPlacedToolIds(zones);

  return catalogTools
    .filter((tool) => !placedIds.has(Number(tool.id)))
    .slice()
    .sort((a, b) =>
      getCatalogToolDisplayName(a).localeCompare(
        getCatalogToolDisplayName(b),
        undefined,
        { sensitivity: "base" },
      ),
    )
    .map((tool) => ({
      id: tool.id,
      name: getCatalogToolDisplayName(tool),
    }));
}

export type ToolPlacementLabelKey =
  | "maps.toolPlacement.drawer"
  | "maps.toolPlacement.widgetLeft"
  | "maps.toolPlacement.widgetRight"
  | "maps.toolPlacement.controlButton"
  | "maps.toolPlacement.unplaced"
  | "maps.toolPlacement.hidden"
  | "maps.toolPlacement.notOnMap";

export function getToolPlacementLabelKey(tool: ToolOnMap): ToolPlacementLabelKey {
  if (isHiddenMapTool(tool)) {
    return "maps.toolPlacement.hidden";
  }

  const zone = resolveToolZone(tool);
  switch (zone) {
    case "drawer":
      return "maps.toolPlacement.drawer";
    case "widgetLeft":
      return "maps.toolPlacement.widgetLeft";
    case "widgetRight":
      return "maps.toolPlacement.widgetRight";
    case "control":
      return "maps.toolPlacement.controlButton";
    default:
      return "maps.toolPlacement.unplaced";
  }
}

/** Flattens zones into the `PUT /maps/:name/tools` payload, keeping unplaced map tools. */
export function zonesToToolsPayload(
  zones: ToolZones,
  mapTools: ToolOnMap[],
): { toolId: number; index: number; target: string | null }[] {
  const result: { toolId: number; index: number; target: string | null }[] = [];
  const placedIds = new Set<number>();

  (Object.keys(ZONE_TO_TARGET) as ToolZoneKey[]).forEach((zone) => {
    zones[zone].forEach((item, index) => {
      const parts = String(item.id).split(ID_DELIMITER);
      const toolId = Number(parts[parts.length - 1]);
      if (!Number.isNaN(toolId)) {
        placedIds.add(toolId);
        result.push({ toolId, index, target: ZONE_TO_TARGET[zone] });
      }
    });
  });

  mapTools
    .slice()
    .sort((a, b) => a.index - b.index)
    .forEach((tool) => {
      if (placedIds.has(tool.toolId)) return;
      result.push({
        toolId: tool.toolId,
        index: tool.index,
        target: null,
      });
    });

  return result;
}

export function toolsPayloadSignature(
  payload: { toolId: number; index: number; target: string | null }[],
): string {
  return JSON.stringify(
    payload
      .slice()
      .sort((a, b) => a.toolId - b.toolId)
      .map(({ toolId, index, target }) => ({ toolId, index, target })),
  );
}

/** Stable signature for zone layout (which tools sit in which zone, and in what order). */
export function toolZonesSignature(zones: ToolZones): string {
  const layout: Record<ToolZoneKey, number[]> = {
    drawer: [],
    widgetLeft: [],
    widgetRight: [],
    control: [],
  };

  (Object.keys(layout) as ToolZoneKey[]).forEach((zone) => {
    layout[zone] = zones[zone].map((item) => {
      const parts = String(item.id).split(ID_DELIMITER);
      return Number(parts[parts.length - 1]);
    });
  });

  return JSON.stringify(layout);
}
