import type { TreeItems } from "dnd-kit-sortable-tree";
import type {
  MapGroup,
  MapGroupPlacement,
  MapLayer,
  MapLayerPlacement,
} from "../../api/maps";
import type { TreeItemData } from "../../components/layerswitcher-dnd";
import { ID_DELIMITER } from "../../components/layerswitcher-dnd";

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
  return items
    .filter((node) => node.type === "layer")
    .map((node, index) => ({
      layerId: entityIdFromItemId(node.id),
      zIndex: index,
      visibleAtStart: node.visibleAtStart ?? false,
    }));
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

export function mapContentToPayloads(items: TreeItems<TreeItemData>) {
  return {
    layers: mapLayerTreeToPayload(items),
    groups: mapGroupTreeToPayload(items),
  };
}

/** Combined flat-list signature for dirty detection. */
export function mapContentSignature(items: TreeItems<TreeItemData>): string {
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

/** @deprecated Use mapContentSignature */
export function mapGroupTreeSignature(items: TreeItems<TreeItemData>): string {
  return mapContentSignature(items.filter((item) => item.type === "group"));
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
