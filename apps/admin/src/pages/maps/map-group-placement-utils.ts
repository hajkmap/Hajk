import type { TreeItems } from "dnd-kit-sortable-tree";
import type { TreeItem } from "dnd-kit-sortable-tree";
import type {
  MapGroup,
  MapGroupPlacement,
  MapLayer,
  MapLayerPlacement,
} from "../../api/maps";
import type { TreeItemData } from "../../components/layerswitcher-dnd";
import { ID_DELIMITER } from "../../components/layerswitcher-dnd";
import { adjustDrawOrderInsertIndex } from "../../components/layerswitcher-dnd/utils";

export function entityIdFromItemId(itemId: string | number): string {
  const parts = String(itemId).split(ID_DELIMITER);
  return parts[parts.length - 1];
}

function sortByIndex(rows: MapGroup[]): MapGroup[] {
  return rows.slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/** Flatten stored placements (including legacy nested rows) into sibling order. */
function flattenPlacementRows(rows: MapGroup[]): MapGroup[] {
  const byParent = new Map<string | null, MapGroup[]>();
  rows.forEach((row) => {
    const key = row.parentGroupId ?? null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(row);
    else byParent.set(key, [row]);
  });

  const result: MapGroup[] = [];
  const visited = new Set<string>();
  const visit = (parentPlacementId: string | null) => {
    for (const row of sortByIndex(byParent.get(parentPlacementId) ?? [])) {
      if (visited.has(row.id)) continue;
      visited.add(row.id);
      result.push(row);
      visit(row.id);
    }
  };
  visit(null);
  rows.forEach((row) => {
    if (!visited.has(row.id)) result.push(row);
  });
  return result;
}

/** Direct map layers as a flat list (mapId set, outside groups). */
export function buildMapLayerTree(
  layers: MapLayer[],
): TreeItems<TreeItemData> {
  return layers
    .filter((layer) => layer.mapId != null)
    .slice()
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map((layer) => ({
      id: `layer${ID_DELIMITER}${layer.id}`,
      name: layer.name,
      type: "layer" as const,
      canHaveChildren: false,
      visibleAtStart: layer.visibleAtStart ?? false,
    }));
}

/** Map group placements as a flat list (no nesting on the map). */
export function buildMapGroupTree(
  rows: MapGroup[],
): TreeItems<TreeItemData> {
  return flattenPlacementRows(rows).map((row) => ({
    id: `group${ID_DELIMITER}${row.groupId}`,
    name: row.name,
    type: "group" as const,
    canHaveChildren: false,
    toggled: row.toggled,
    expanded: row.expanded,
  }));
}

/** Server baseline for the map content drop zone (layers first, then groups). */
export function buildServerMapContentItems(
  mapLayers: MapLayer[],
  mapGroups: MapGroup[],
): TreeItems<TreeItemData> {
  return [...buildMapLayerTree(mapLayers), ...buildMapGroupTree(mapGroups)];
}

export function mapLayerTreeToPayload(
  items: TreeItems<TreeItemData>,
): MapLayerPlacement[] {
  // zIndex is 0-based ascending; backend stores on LayerInstance and emits as
  // drawOrder in client layersConfig (higher index = drawn on top).
  return items
    .filter((node) => node.type === "layer")
    .map((node, index) => ({
      layerId: entityIdFromItemId(node.id),
      zIndex: index,
      visibleAtStart: node.visibleAtStart ?? false,
    }));
}

export function extractLayerItems(
  items: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> {
  return items.filter((node) => node.type === "layer");
}

export function extractGroupItems(
  items: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> {
  return items.filter((node) => node.type === "group");
}

/** Layers are managed on the draw-order tab; placement edits groups only. */
export function mergeMapContentLayersAndGroups(
  layers: TreeItems<TreeItemData>,
  groups: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> {
  return [...layers, ...groups];
}

export function drawOrderTreeToLayerIds(
  items: TreeItems<TreeItemData>,
): string[] {
  return items.map((item) => entityIdFromItemId(item.id));
}

export function createGroupTreeItem(
  group: {
    id: string;
    name: string;
    layerCount?: number;
    nestedGroupCount?: number;
  },
): TreeItem<TreeItemData> {
  return {
    id: `group${ID_DELIMITER}${group.id}`,
    name: group.name,
    type: "group",
    canHaveChildren: false,
    toggled: true,
    expanded: false,
    layerCount: group.layerCount,
    nestedGroupCount: group.nestedGroupCount,
  };
}

export function placementTreeToItemIds(
  items: TreeItems<TreeItemData>,
): string[] {
  return items.map((item) => item.id.toString());
}

export function reorderPlacementByItemIds(
  items: TreeItems<TreeItemData>,
  orderedItemIds: string[],
): TreeItems<TreeItemData> {
  const byId = new Map(items.map((item) => [item.id.toString(), item]));
  return orderedItemIds
    .map((id) => byId.get(id))
    .filter((item): item is TreeItem<TreeItemData> => item != null);
}

export function insertItemInPlacement(
  items: TreeItems<TreeItemData>,
  newItem: TreeItem<TreeItemData>,
  insertIndex: number,
): TreeItems<TreeItemData> {
  const itemId = newItem.id.toString();
  const filtered = items.filter((item) => item.id.toString() !== itemId);
  const existing = items.find((item) => item.id.toString() === itemId);
  const itemToInsert = existing ?? newItem;
  const orderedIds = placementTreeToItemIds(items);
  const adjustedIndex = adjustDrawOrderInsertIndex(
    orderedIds,
    itemId,
    insertIndex,
  );
  const next = [...filtered];
  next.splice(adjustedIndex, 0, itemToInsert);
  return next;
}

export function removeItemFromPlacement(
  items: TreeItems<TreeItemData>,
  treeItemId: string,
): TreeItems<TreeItemData> {
  return items.filter((item) => item.id.toString() !== treeItemId);
}

export function createLayerTreeItem(
  layer: { id: string; name: string },
  visibleAtStart = false,
): TreeItem<TreeItemData> {
  return {
    id: `layer${ID_DELIMITER}${layer.id}`,
    name: layer.name,
    type: "layer",
    canHaveChildren: false,
    visibleAtStart,
  };
}

export function reorderDrawOrderByLayerIds(
  items: TreeItems<TreeItemData>,
  layerIds: string[],
): TreeItems<TreeItemData> {
  const byEntityId = new Map(
    items.map((item) => [entityIdFromItemId(item.id), item]),
  );
  return layerIds
    .map((id) => byEntityId.get(id))
    .filter((item): item is TreeItem<TreeItemData> => item != null);
}

export function insertLayerInDrawOrder(
  items: TreeItems<TreeItemData>,
  layer: { id: string; name: string },
  insertIndex: number,
): TreeItems<TreeItemData> {
  const filtered = items.filter(
    (item) => entityIdFromItemId(item.id) !== layer.id,
  );
  const existing = items.find(
    (item) => entityIdFromItemId(item.id) === layer.id,
  );
  const newItem = existing ?? createLayerTreeItem(layer);
  const adjustedIndex = adjustDrawOrderInsertIndex(
    drawOrderTreeToLayerIds(items),
    layer.id,
    insertIndex,
  );
  const next = [...filtered];
  next.splice(adjustedIndex, 0, newItem);
  return next;
}

export function removeLayerFromDrawOrderTree(
  items: TreeItems<TreeItemData>,
  layerId: string,
): TreeItems<TreeItemData> {
  return items.filter((item) => entityIdFromItemId(item.id) !== layerId);
}

export function addLayerToPlacementIfMissing(
  placement: TreeItems<TreeItemData>,
  layer: { id: string; name: string },
): TreeItems<TreeItemData> {
  const itemId = `layer${ID_DELIMITER}${layer.id}`;
  if (placement.some((item) => item.id === itemId)) {
    return placement;
  }
  return [...placement, createLayerTreeItem(layer)];
}

/** Keep draw-order list in sync when layers are added/removed on the placement tab. */
export function syncLayerDrawOrderWithPlacement(
  placement: TreeItems<TreeItemData>,
  drawOrder: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> {
  const placementLayers = extractLayerItems(placement);
  const byId = new Map(placementLayers.map((layer) => [layer.id, layer]));
  const kept = drawOrder
    .filter((layer) => byId.has(layer.id))
    .map((layer) => {
      const placementLayer = byId.get(layer.id)!;
      return {
        ...placementLayer,
        ...layer,
        visibleAtStart: placementLayer.visibleAtStart,
      };
    });
  const keptIds = new Set(kept.map((layer) => layer.id));
  const added = placementLayers.filter((layer) => !keptIds.has(layer.id));
  return [...kept, ...added];
}

/** Mirror visibleAtStart from the draw-order tab back onto placement layers. */
export function syncPlacementVisibleAtStartFromDrawOrder(
  placement: TreeItems<TreeItemData>,
  drawOrder: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> {
  const drawOrderById = new Map(drawOrder.map((layer) => [layer.id, layer]));
  return placement.map((item) => {
    if (item.type !== "layer") return item;
    const drawLayer = drawOrderById.get(item.id);
    if (!drawLayer) return item;
    return { ...item, visibleAtStart: drawLayer.visibleAtStart };
  });
}

export function mapLayerDrawOrderSignature(
  items: TreeItems<TreeItemData>,
): string {
  return JSON.stringify(
    items.map((item, index) => ({
      id: entityIdFromItemId(item.id),
      drawOrder: index,
      visibleAtStart: item.visibleAtStart ?? false,
    })),
  );
}

/** Placement dirty check (layer membership + groups; not layer draw order). */
export function mapPlacementSignature(items: TreeItems<TreeItemData>): string {
  return JSON.stringify(
    items.map((item) => {
      if (item.type === "layer") {
        return {
          type: "layer",
          id: entityIdFromItemId(item.id),
          visibleAtStart: item.visibleAtStart ?? false,
        };
      }
      return {
        type: "group",
        id: entityIdFromItemId(item.id),
        name: item.name,
        toggled: item.toggled ?? false,
        expanded: item.expanded ?? false,
      };
    }),
  );
}

export function mapGroupTreeToPayload(
  items: TreeItems<TreeItemData>,
): MapGroupPlacement[] {
  return items
    .filter((node) => node.type === "group")
    .map((node, index) => ({
      id: crypto.randomUUID(),
      groupId: entityIdFromItemId(node.id),
      parentGroupId: null,
      name: node.name,
      toggled: node.toggled ?? false,
      expanded: node.expanded ?? false,
      index,
    }));
}

export function mapContentToPayloads(
  placementItems: TreeItems<TreeItemData>,
  layerDrawOrder?: TreeItems<TreeItemData>,
) {
  const layers = layerDrawOrder ?? extractLayerItems(placementItems);
  return {
    layers: mapLayerTreeToPayload(layers),
    groups: mapGroupTreeToPayload(placementItems),
  };
}

/** @deprecated Use mapPlacementSignature + mapLayerDrawOrderSignature */
export function mapContentSignature(items: TreeItems<TreeItemData>): string {
  return mapPlacementSignature(items);
}

/** Collect placed item ids (layers and groups) from the map content list. */
export function collectPlacedItemIds(
  items: TreeItems<TreeItemData>,
): Set<string> {
  return new Set(items.map((node) => node.id));
}

/** @deprecated Use collectPlacedItemIds */
export function collectPlacedGroupIds(
  items: TreeItems<TreeItemData>,
  acc = new Set<string>(),
): Set<string> {
  items.forEach((node) => {
    if (node.type === "group") {
      acc.add(node.id);
    }
  });
  return acc;
}
