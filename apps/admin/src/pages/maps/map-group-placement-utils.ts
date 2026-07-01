import type { TreeItems } from "dnd-kit-sortable-tree";
import type { MapGroup, MapGroupPlacement } from "../../api/maps";
import type { TreeItemData } from "../../components/layerswitcher-dnd";
import { flattenToRoot, ID_DELIMITER } from "../../components/layerswitcher-dnd";

export function entityIdFromItemId(itemId: string | number): string {
  const parts = String(itemId).split(ID_DELIMITER);
  return parts[parts.length - 1];
}

/** Map group placements as a flat sibling list (no visual nesting on the map). */
export function buildMapGroupTree(
  rows: MapGroup[],
): TreeItems<TreeItemData> {
  const byParent = new Map<string | null, MapGroup[]>();
  rows.forEach((row) => {
    const key = row.parentGroupId ?? null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(row);
    else byParent.set(key, [row]);
  });

  const buildNested = (
    parentPlacementId: string | null,
  ): TreeItems<TreeItemData> =>
    (byParent.get(parentPlacementId) ?? []).map((row) => ({
      id: `group${ID_DELIMITER}${row.groupId}`,
      name: row.name,
      type: "group" as const,
      canHaveChildren: true,
      toggled: row.toggled,
      expanded: row.expanded,
      children: buildNested(row.id),
    }));

  return flattenToRoot(buildNested(null)).map((item) => ({
    ...item,
    canHaveChildren: false,
    children: undefined,
  }));
}

export function mapGroupTreeToPayload(
  items: TreeItems<TreeItemData>,
): MapGroupPlacement[] {
  const result: MapGroupPlacement[] = [];
  const walk = (
    nodes: TreeItems<TreeItemData>,
    parentPlacementId: string | null,
  ) => {
    nodes.forEach((node) => {
      if (node.type !== "group") return;

      const placementId = crypto.randomUUID();
      result.push({
        id: placementId,
        groupId: entityIdFromItemId(node.id),
        parentGroupId: parentPlacementId,
        toggled: node.toggled ?? false,
        expanded: node.expanded ?? false,
      });
      if (node.children?.length) walk(node.children, placementId);
    });
  };
  walk(items, null);
  return result;
}

/** Signature for flat group order + toggled/expanded (ignores nesting). */
export function mapGroupTreeSignature(items: TreeItems<TreeItemData>): string {
  const flat = flattenToRoot(items);
  return JSON.stringify(
    flat.map((node) => ({
      groupId: entityIdFromItemId(node.id),
      toggled: node.toggled ?? false,
      expanded: node.expanded ?? false,
    })),
  );
}
