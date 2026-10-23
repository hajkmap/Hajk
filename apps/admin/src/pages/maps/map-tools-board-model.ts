import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../api/maps";
import type { Tool } from "../../api/tools";
import { getMapToolFieldConfig } from "./map-tool-field-config";
import {
  activeColumnOrder,
  getCatalogToolDisplayName,
  getCatalogToolWindowSize,
  getToolDisplayName,
  isFixedControlTool,
  type ToolWindowSize,
  type ToolZones,
} from "./map-tools-utils";
import {
  TOOL_PLACEMENT_ZONES,
  type ToolColumnOrder,
} from "./map-tools-layout";

export interface BoardTool {
  toolId: number;
  title: string;
  type: string;
  draggable: boolean;
  showUnplacedChip: boolean;
  windowPosition: ToolWindowPosition;
  showWindowPosition: boolean;
  showWindowWidth: boolean;
  showWindowHeight: boolean;
  windowWidth?: number;
  windowHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface AddableTool {
  toolId: number;
  title: string;
  type: string;
  active: boolean;
  placement: ToolZone | null;
}

export interface ToolBoard {
  columns: Record<ToolZone, BoardTool[]>;
  order: ToolColumnOrder;
}

function describeTool(
  toolId: number,
  catalogToolsById: Map<number, Tool>,
  mapToolsById: Map<number, ToolOnMap>,
  windowPositions: Record<number, ToolWindowPosition>,
  windowSizes: Record<number, ToolWindowSize>,
  placed: boolean,
): BoardTool {
  const catalog = catalogToolsById.get(toolId);
  const onMap = mapToolsById.get(toolId);
  const type = catalog?.type ?? onMap?.tool.type ?? "";
  const title = catalog
    ? getCatalogToolDisplayName(catalog)
    : onMap
      ? getToolDisplayName(onMap)
      : type || String(toolId);
  const fields = getMapToolFieldConfig(type);
  const defaultSize = catalog ? getCatalogToolWindowSize(catalog) : {};
  const size = windowSizes[toolId] ?? {};

  return {
    toolId,
    title,
    type,
    draggable: placed || fields.target,
    showUnplacedChip: !placed && fields.target,
    windowPosition: windowPositions[toolId] ?? "right",
    showWindowPosition: fields.windowPosition,
    showWindowWidth: fields.windowWidth,
    showWindowHeight: fields.windowHeight,
    windowWidth: size.width,
    windowHeight: size.height,
    defaultWidth: defaultSize.width,
    defaultHeight: defaultSize.height,
  };
}

export function buildToolBoard(
  catalogTools: Tool[],
  mapTools: ToolOnMap[],
  toolZones: ToolZones,
  activeToolIds: Set<number>,
  windowPositions: Record<number, ToolWindowPosition>,
  windowSizes: Record<number, ToolWindowSize>,
  indexes: Record<number, number>,
): ToolBoard {
  const catalogToolsById = new Map(
    catalogTools.map((tool) => [Number(tool.id), tool]),
  );
  const mapToolsById = new Map(mapTools.map((tool) => [tool.toolId, tool]));
  const columns = {
    drawer: [],
    widgetLeft: [],
    widgetRight: [],
    controlButton: [],
  } as Record<ToolZone, BoardTool[]>;
  const sourceOrder = activeColumnOrder(toolZones, activeToolIds, indexes);
  const order = {
    drawer: [],
    widgetLeft: [],
    widgetRight: [],
    controlButton: [],
  } as ToolColumnOrder;
  const canPlace = (toolId: number) =>
    getMapToolFieldConfig(
      catalogToolsById.get(toolId)?.type ??
        mapToolsById.get(toolId)?.tool.type ??
        "",
    ).target;
  for (const zone of TOOL_PLACEMENT_ZONES) {
    const ids = sourceOrder[zone].filter(canPlace);
    order[zone] = ids;
    columns[zone] = ids.map((toolId) =>
      describeTool(
        toolId,
        catalogToolsById,
        mapToolsById,
        windowPositions,
        windowSizes,
        true,
      ),
    );
  }

  return { columns, order };
}

export function toolsAvailableToAdd(
  catalogTools: Tool[],
  activeToolIds: Set<number>,
  order: ToolColumnOrder,
  zone: ToolZone,
): AddableTool[] {
  const placedIds = new Set<number>([
    ...order.drawer,
    ...order.widgetLeft,
    ...order.widgetRight,
    ...order.controlButton,
    ...activeToolIds,
  ]);

  return catalogTools
    .map((tool) => {
      const toolId = Number(tool.id);
      return {
        toolId,
        title: getCatalogToolDisplayName(tool),
        type: tool.type,
        active: activeToolIds.has(toolId),
        placement: null,
      };
    })
    .filter((tool) => {
      if (!Number.isFinite(tool.toolId) || placedIds.has(tool.toolId)) {
        return false;
      }
      if (getMapToolFieldConfig(tool.type).target) return true;
      return zone === "controlButton" && isFixedControlTool(tool.type);
    })
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
}
