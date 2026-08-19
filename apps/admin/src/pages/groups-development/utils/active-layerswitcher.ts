import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";

function catalogToolAsMapEntry(tool: Tool): ToolOnMap {
  return {
    mapName: "",
    toolId: Number(tool.id),
    active: true,
    index: 0,
    target: null,
    tool: {
      id: Number(tool.id),
      type: tool.type,
      options: tool.options ?? {},
    },
  };
}

/**
 * The layerswitcher currently toggled on in map Tools.
 * When `activeToolIds` is provided, do not fall back to another layerswitcher.
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
    if (fromMap) {
      return fromMap;
    }

    const fromCatalog = (catalogTools ?? []).find(
      (tool) =>
        tool.type === "layerswitcher" && activeToolIds.has(Number(tool.id)),
    );
    return fromCatalog ? catalogToolAsMapEntry(fromCatalog) : null;
  }

  return layerswitchers.find((entry) => entry.active !== false) ?? null;
}
