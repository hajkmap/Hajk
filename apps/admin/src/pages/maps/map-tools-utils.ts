import type { TreeItem } from "dnd-kit-sortable-tree";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../api/maps";
import type { Tool } from "../../api/tools";
import type { TreeItemData } from "../../components/layerswitcher-dnd";
import { ID_DELIMITER } from "../../components/layerswitcher-dnd";
import { getMapToolFieldConfig, type MapToolFieldConfig } from "./map-tool-field-config";

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

const TARGET_TO_ZONE: Record<ToolZone, ToolZoneKey> = {
  drawer: "drawer",
  widgetLeft: "widgetLeft",
  widgetRight: "widgetRight",
  controlButton: "control",
};

export interface ToolWindowSize {
  width?: number;
  height?: number;
}

export interface MapToolsDraftState {
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  indexes: Record<number, number>;
  inactiveTargets: Record<number, ToolZone>;
}

export interface MapToolPayloadEntry {
  toolId: number;
  active: boolean;
  index: number;
  target: string | null;
  options?: Record<string, string | number>;
}

export type { MapToolFieldConfig } from "./map-tool-field-config";
export { getMapToolFieldConfig } from "./map-tool-field-config";

export function buildToolTypesById(
  catalogTools: Tool[],
  mapTools: ToolOnMap[],
): Map<number, string> {
  const types = new Map<number, string>();

  for (const tool of catalogTools) {
    types.set(Number(tool.id), tool.type);
  }
  for (const tool of mapTools) {
    types.set(tool.toolId, tool.tool.type);
  }

  return types;
}

function resolveToolType(
  toolId: number,
  mapToolsById: Map<number, ToolOnMap>,
  toolTypesById: Map<number, string>,
): string {
  return (
    mapToolsById.get(toolId)?.tool.type ?? toolTypesById.get(toolId) ?? ""
  );
}

function parseOptionNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function getMapToolWindowPosition(tool: ToolOnMap): ToolWindowPosition {
  const mapPosition = tool.options?.position;
  if (mapPosition === "left" || mapPosition === "right") {
    return mapPosition;
  }

  const toolPosition = tool.tool.options?.position;
  if (toolPosition === "left" || toolPosition === "right") {
    return toolPosition;
  }

  return "right";
}

export function getMapToolWindowSize(tool: ToolOnMap): ToolWindowSize {
  const width = parseOptionNumber(tool.options?.width);
  const height = parseOptionNumber(tool.options?.height);
  return { width, height };
}

export function getCatalogToolWindowSize(tool: Tool): ToolWindowSize {
  const width = parseOptionNumber(tool.options?.width);
  const height = parseOptionNumber(tool.options?.height);
  return { width, height };
}

export function isMapToolActive(tool: ToolOnMap): boolean {
  return tool.active !== false;
}

export function buildToolsDraftState(
  mapTools: ToolOnMap[],
): MapToolsDraftState {
  const activeToolIds = new Set<number>();
  const windowPositions: Record<number, ToolWindowPosition> = {};
  const windowSizes: Record<number, ToolWindowSize> = {};
  const indexes: Record<number, number> = {};
  const inactiveTargets: Record<number, ToolZone> = {};

  for (const tool of mapTools) {
    windowPositions[tool.toolId] = getMapToolWindowPosition(tool);
    windowSizes[tool.toolId] = getMapToolWindowSize(tool);
    indexes[tool.toolId] = tool.index;

    if (!isMapToolActive(tool)) {
      const zone = resolveToolZone(tool);
      if (zone) inactiveTargets[tool.toolId] = zoneKeyToTarget(zone);
      continue;
    }

    activeToolIds.add(tool.toolId);
  }

  return {
    activeToolIds,
    windowPositions,
    windowSizes,
    indexes,
    inactiveTargets,
  };
}

export function findToolZoneForId(
  zones: ToolZones,
  toolId: number,
): ToolZoneKey | null {
  const itemId = `tool${ID_DELIMITER}${toolId}`;
  for (const zone of Object.keys(zones) as ToolZoneKey[]) {
    if (zones[zone].some((item) => item.id === itemId)) {
      return zone;
    }
  }
  return null;
}

export function zoneKeyToTarget(zone: ToolZoneKey): ToolZone {
  return ZONE_TO_TARGET[zone] as ToolZone;
}

export function targetToZoneKey(target: ToolZone): ToolZoneKey {
  return TARGET_TO_ZONE[target];
}

export function moveToolToZone(
  zones: ToolZones,
  toolId: number,
  displayName: string,
  targetZone: ToolZoneKey | null,
): ToolZones {
  const itemId = `tool${ID_DELIMITER}${toolId}`;
  const next: ToolZones = {
    drawer: zones.drawer.filter((item) => item.id !== itemId),
    widgetLeft: zones.widgetLeft.filter((item) => item.id !== itemId),
    widgetRight: zones.widgetRight.filter((item) => item.id !== itemId),
    control: zones.control.filter((item) => item.id !== itemId),
  };

  if (!targetZone) {
    return next;
  }

  next[targetZone] = [
    ...next[targetZone],
    {
      id: itemId,
      name: displayName,
      type: "tool",
      canHaveChildren: false,
    },
  ];

  return next;
}

export function removeToolFromZones(
  zones: ToolZones,
  toolId: number,
): ToolZones {
  return moveToolToZone(zones, toolId, "", null);
}

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
  if (tool.target) return false;
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
    if (!isMapToolActive(tool)) continue;

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

/** Active tools not placed in a zone — shown in the placement DnD source list. */
export function unplacedActiveToolsToSourceItems(
  catalogTools: Tool[],
  mapTools: ToolOnMap[],
  zones: ToolZones,
  activeToolIds: Set<number>,
): { id: string; name: string }[] {
  const placedIds = collectPlacedToolIds(zones);
  const catalogById = new Map(
    catalogTools.map((tool) => [Number(tool.id), tool]),
  );
  const mapToolsById = new Map(mapTools.map((tool) => [tool.toolId, tool]));

  return [...activeToolIds]
    .filter((toolId) => !placedIds.has(toolId))
    .map((toolId) => {
      const catalogTool = catalogById.get(toolId);
      const mapTool = mapToolsById.get(toolId);
      const name = catalogTool
        ? getCatalogToolDisplayName(catalogTool)
        : mapTool
          ? getToolDisplayName(mapTool)
          : String(toolId);

      return { id: String(toolId), name };
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
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

export function getToolPlacementLabelKey(
  tool: ToolOnMap,
): ToolPlacementLabelKey {
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

function buildToolPayloadOptions(
  fields: MapToolFieldConfig,
  windowPosition?: ToolWindowPosition,
  windowSize?: ToolWindowSize,
): Record<string, string | number> | undefined {
  const options: Record<string, string | number> = {};

  if (fields.windowPosition && windowPosition) {
    options.position = windowPosition;
  }
  if (fields.windowWidth && windowSize?.width != null) {
    options.width = windowSize.width;
  }
  if (fields.windowHeight && windowSize?.height != null) {
    options.height = windowSize.height;
  }

  return Object.keys(options).length > 0 ? options : undefined;
}

/** Flattens the draft into the `PUT /maps/:name/tools` payload. */
export function zonesToToolsPayload(
  zones: ToolZones,
  activeToolIds: Set<number>,
  windowPositions: Record<number, ToolWindowPosition>,
  windowSizes: Record<number, ToolWindowSize>,
  inactiveTargets: Record<number, ToolZone>,
  mapTools: ToolOnMap[],
  toolTypesById: Map<number, string> = new Map(),
  indexes: Record<number, number> = {},
): MapToolPayloadEntry[] {
  const mapToolsById = new Map(mapTools.map((tool) => [tool.toolId, tool]));
  const allToolIds = new Set<number>([
    ...mapTools.map((tool) => tool.toolId),
    ...activeToolIds,
    ...Object.keys(inactiveTargets).map(Number),
  ]);

  const result: MapToolPayloadEntry[] = [];

  for (const toolId of [...allToolIds].sort((a, b) => a - b)) {
    const existing = mapToolsById.get(toolId);
    const isActive = activeToolIds.has(toolId);
    const toolType = resolveToolType(toolId, mapToolsById, toolTypesById);
    const fields = getMapToolFieldConfig(toolType);
    const options = buildToolPayloadOptions(
      fields,
      windowPositions[toolId],
      windowSizes[toolId],
    );

    let target: string | null = null;
    if (fields.target) {
      if (isActive) {
        const zone = findToolZoneForId(zones, toolId);
        target = zone ? ZONE_TO_TARGET[zone] : null;
      } else {
        target =
          inactiveTargets[toolId] != null
            ? inactiveTargets[toolId]
            : (existing?.target ?? null);
      }
    }

    const index = fields.index
      ? (indexes[toolId] ?? existing?.index ?? 0)
      : (existing?.index ?? 0);

    result.push({
      toolId,
      active: isActive,
      index,
      target,
      ...(options ? { options } : {}),
    });
  }

  return result;
}

export function toolsPayloadSignature(payload: MapToolPayloadEntry[]): string {
  return JSON.stringify(
    payload
      .slice()
      .sort((a, b) => a.toolId - b.toolId)
      .map(({ toolId, active, index, target, options }) => ({
        toolId,
        active,
        index,
        target,
        options: options ?? {},
      })),
  );
}

export function toolsDraftSignature(
  zones: ToolZones,
  activeToolIds: Set<number>,
  windowPositions: Record<number, ToolWindowPosition>,
  windowSizes: Record<number, ToolWindowSize>,
  inactiveTargets: Record<number, ToolZone>,
  toolTypesById: Map<number, string> = new Map(),
  indexes: Record<number, number> = {},
): string {
  const relevantIds = new Set<number>([
    ...activeToolIds,
    ...Object.keys(inactiveTargets).map(Number),
  ]);
  const positions: Record<number, ToolWindowPosition> = {};
  const sizes: Record<number, ToolWindowSize> = {};
  const indexEntries: Record<number, number> = {};
  const filteredInactive = Object.entries(inactiveTargets)
    .map(([id, target]) => [Number(id), target] as [number, ToolZone])
    .filter(([id]) => getMapToolFieldConfig(toolTypesById.get(id) ?? "").target)
    .sort((a, b) => a[0] - b[0]);

  [...relevantIds]
    .sort((a, b) => a - b)
    .forEach((id) => {
      const fields = getMapToolFieldConfig(toolTypesById.get(id) ?? "");
      if (fields.windowPosition && windowPositions[id]) {
        positions[id] = windowPositions[id];
      }
      const size = windowSizes[id];
      if (size?.width != null || size?.height != null) {
        const filteredSize: ToolWindowSize = {};
        if (fields.windowWidth && size.width != null) {
          filteredSize.width = size.width;
        }
        if (fields.windowHeight && size.height != null) {
          filteredSize.height = size.height;
        }
        if (filteredSize.width != null || filteredSize.height != null) {
          sizes[id] = filteredSize;
        }
      }
    });

  Object.entries(indexes)
    .map(([id, value]) => [Number(id), value] as [number, number])
    .filter(([id]) =>
      getMapToolFieldConfig(toolTypesById.get(id) ?? "").index,
    )
    .sort((a, b) => a[0] - b[0])
    .forEach(([id, value]) => {
      indexEntries[id] = value;
    });

  const zoneLayout = JSON.parse(toolZonesSignature(zones)) as Record<
    ToolZoneKey,
    number[]
  >;
  (Object.keys(zoneLayout) as ToolZoneKey[]).forEach((zone) => {
    if (toolTypesById.size > 0) {
      zoneLayout[zone] = zoneLayout[zone].filter((toolId) =>
        getMapToolFieldConfig(toolTypesById.get(toolId) ?? "").target,
      );
    }
    // Placement tab only persists zone membership (target), not order.
    zoneLayout[zone].sort((a, b) => a - b);
  });

  return JSON.stringify({
    zones: zoneLayout,
    active: [...activeToolIds].sort((a, b) => a - b),
    inactive: filteredInactive,
    windowPositions: positions,
    windowSizes: sizes,
    indexes: indexEntries,
  });
}

export function serverToolsSignature(
  mapTools: ToolOnMap[],
  toolTypesById: Map<number, string> = new Map(),
): string {
  const zones = mapToolsToZones(mapTools);
  const {
    activeToolIds,
    windowPositions,
    windowSizes,
    inactiveTargets,
    indexes,
  } = buildToolsDraftState(mapTools);
  const types =
    toolTypesById.size > 0
      ? toolTypesById
      : new Map(mapTools.map((tool) => [tool.toolId, tool.tool.type]));
  return toolsDraftSignature(
    zones,
    activeToolIds,
    windowPositions,
    windowSizes,
    inactiveTargets,
    types,
    indexes,
  );
}

/** Stable signature for zone layout (which tools sit in which zone). */
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
