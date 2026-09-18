import type { MoveZoneItem } from "../types";

export type MoveZonePreviewTab = "layers" | "background" | "drawOrder";

export type MoveZoneByTab = Record<MoveZonePreviewTab, MoveZoneItem[]>;

export function createEmptyMoveZoneByTab(): MoveZoneByTab {
  return {
    layers: [],
    background: [],
    drawOrder: [],
  };
}

function moveZoneStorageKey(mapName: string, toolId: number): string {
  return `hajk.admin.layerswitcher.moveZone.${mapName}.${toolId}`;
}

function isMoveZoneItem(value: unknown): value is MoveZoneItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    (record.kind === "group" || record.kind === "layer") &&
    typeof record.sourceId === "string" &&
    typeof record.name === "string" &&
    Array.isArray(record.nodes)
  );
}

function parseMoveZoneByTab(raw: string | null): MoveZoneByTab {
  if (!raw) {
    return createEmptyMoveZoneByTab();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const readTab = (tab: MoveZonePreviewTab): MoveZoneItem[] => {
      const entries = parsed[tab];
      if (!Array.isArray(entries)) {
        return [];
      }
      return entries.filter(isMoveZoneItem);
    };

    return {
      layers: readTab("layers"),
      background: readTab("background"),
      drawOrder: readTab("drawOrder"),
    };
  } catch {
    return createEmptyMoveZoneByTab();
  }
}

/** Load per-tab Flyttzon contents for a map + active LayerSwitcher tool. */
export function loadMoveZoneByTabFromStorage(
  mapName: string | undefined,
  toolId: number | undefined,
): MoveZoneByTab {
  if (mapName == null || mapName === "" || toolId == null) {
    return createEmptyMoveZoneByTab();
  }

  try {
    return parseMoveZoneByTab(
      window.localStorage.getItem(moveZoneStorageKey(mapName, toolId)),
    );
  } catch {
    return createEmptyMoveZoneByTab();
  }
}

/** Persist per-tab Flyttzon contents (survives tab switches and reload). */
export function saveMoveZoneByTabToStorage(
  mapName: string | undefined,
  toolId: number | undefined,
  zones: MoveZoneByTab,
): void {
  if (mapName == null || mapName === "" || toolId == null) {
    return;
  }

  const key = moveZoneStorageKey(mapName, toolId);
  const isEmpty =
    zones.layers.length === 0 &&
    zones.background.length === 0 &&
    zones.drawOrder.length === 0;

  try {
    if (isEmpty) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(zones));
  } catch {
    // Quota / private mode — ignore; in-memory zone still works for the session.
  }
}

/**
 * Drop Flyttzon entries that are already present in the live editor lists
 * (e.g. after the user placed them back and saved).
 */
export function pruneMoveZoneByTabAgainstPlaced(
  zones: MoveZoneByTab,
  placed: {
    treeLayerIds: ReadonlySet<string>;
    treeGroupIds: ReadonlySet<string>;
    backgroundIds: ReadonlySet<string>;
    drawOrderIds: ReadonlySet<string>;
  },
): MoveZoneByTab {
  return {
    layers: zones.layers.filter((item) =>
      item.kind === "group"
        ? !placed.treeGroupIds.has(item.sourceId)
        : !placed.treeLayerIds.has(item.sourceId),
    ),
    background: zones.background.filter(
      (item) => !placed.backgroundIds.has(item.sourceId),
    ),
    drawOrder: zones.drawOrder.filter(
      (item) => !placed.drawOrderIds.has(item.sourceId),
    ),
  };
}
