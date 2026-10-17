import type { ToolOnMap } from "../../api/maps";
import type { Tool } from "../../api/tools";
import {
  getCatalogToolDisplayName,
  getToolDisplayName,
} from "../../pages/maps/map-tools-utils";

/** What the map's layerswitcher shows, so the editor can look like it. */
export interface LayerTreePreviewOptions {
  /** The active layerswitcher's name; none when the map has no layerswitcher. */
  name?: string;
  showFilter: boolean;
  showQuickAccess: boolean;
  showDrawOrderView: boolean;
  enableQuickAccessPresets: boolean;
  enableUserQuickAccessFavorites: boolean;
}

/** Without a layerswitcher the client loads the layers with a hidden one. */
export const NO_LAYERSWITCHER: LayerTreePreviewOptions = {
  showFilter: true,
  showQuickAccess: false,
  showDrawOrderView: false,
  enableQuickAccessPresets: false,
  enableUserQuickAccessFavorites: false,
};

function catalogToolAsMapEntry(tool: Tool): ToolOnMap {
  return {
    mapName: "",
    toolId: Number(tool.id),
    active: true,
    index: 0,
    target: null,
    tool: { id: Number(tool.id), type: tool.type, options: tool.options ?? {} },
  };
}

/**
 * The layerswitcher toggled on in the map's tools, saved or not. With
 * `activeToolIds` (the tools tab's state) there is no fallback to another one.
 */
export function findActiveLayerswitcher(
  mapTools: ToolOnMap[] | undefined,
  activeToolIds: Set<number> | undefined,
  catalogTools?: Tool[],
): ToolOnMap | null {
  const layerswitchers = (mapTools ?? []).filter(
    (entry) => entry.tool.type === "layerswitcher",
  );
  if (activeToolIds) {
    const fromMap = layerswitchers.find((entry) =>
      activeToolIds.has(entry.toolId),
    );
    if (fromMap) return fromMap;
    const fromCatalog = (catalogTools ?? []).find(
      (tool) =>
        tool.type === "layerswitcher" && activeToolIds.has(Number(tool.id)),
    );
    return fromCatalog ? catalogToolAsMapEntry(fromCatalog) : null;
  }
  return layerswitchers.find((entry) => entry.active !== false) ?? null;
}

/** As Lagerordning read them: the tool's options, then the map's own. */
export function previewOptionsFor(
  mapTools: ToolOnMap[] | undefined,
  activeToolIds: Set<number> | undefined,
  catalogTools?: Tool[],
): LayerTreePreviewOptions {
  const active = findActiveLayerswitcher(mapTools, activeToolIds, catalogTools);
  if (!active) return NO_LAYERSWITCHER;
  const options: Record<string, unknown> = {
    ...(active.tool.options ?? {}),
    ...(active.options ?? {}),
  };
  const title = typeof options.title === "string" ? options.title.trim() : "";
  const catalogTool = catalogTools?.find(
    (tool) => Number(tool.id) === active.toolId,
  );
  return {
    name:
      title ||
      (catalogTool
        ? getCatalogToolDisplayName(catalogTool)
        : getToolDisplayName(active)),
    showFilter: Boolean(options.showFilter),
    showQuickAccess: Boolean(options.showQuickAccess),
    showDrawOrderView: Boolean(options.showDrawOrderView),
    enableQuickAccessPresets: Boolean(options.enableQuickAccessPresets),
    enableUserQuickAccessFavorites: Boolean(
      options.enableUserQuickAccessFavorites,
    ),
  };
}
