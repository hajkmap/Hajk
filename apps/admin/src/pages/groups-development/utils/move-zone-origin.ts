import type {
  GroupLayerTreeNode,
  MoveZoneItemOrigin,
} from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";

export function captureTreeMoveZoneOrigin(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): MoveZoneItemOrigin | undefined {
  const node = tree.find((entry) => entry.id === nodeId);
  if (!node) {
    return undefined;
  }

  const parentId = node.parent ?? GROUP_LAYER_TREE_ROOT_ID;
  const siblings = tree
    .filter((entry) => entry.parent === parentId)
    .slice()
    .sort((a, b) => {
      const orderA = a.data?.order ?? 0;
      const orderB = b.data?.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a.id).localeCompare(String(b.id));
    });
  const siblingIndex = siblings.findIndex((entry) => entry.id === nodeId);

  return {
    parentId,
    siblingIndex: siblingIndex < 0 ? siblings.length : siblingIndex,
  };
}
