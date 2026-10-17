import type { CatalogDragItem, GroupLayerTreeNode } from "./types";
import { GROUP_LAYER_TREE_ROOT_ID } from "./types";
import { moveTreeNodeWithIndex } from "./move-tree-node";

export { moveTreeNodeWithIndex } from "./move-tree-node";

const GROUP_ID_PREFIX = "group:";
const LAYER_ID_PREFIX = "layer:";

export function toGroupTreeNodeId(groupId: string): string {
  return `${GROUP_ID_PREFIX}${groupId}`;
}

export function toLayerTreeNodeId(layerId: string): string {
  return `${LAYER_ID_PREFIX}${layerId}`;
}

export function parseTreeNodeSourceId(
  nodeId: GroupLayerTreeNode["id"],
): string {
  return String(nodeId).replace(/^(group|layer):/, "");
}

export function createGroupTreeNode(
  groupId: string,
  name: string,
  parent: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
  order = 0,
): GroupLayerTreeNode {
  return {
    id: toGroupTreeNodeId(groupId),
    parent,
    text: name,
    droppable: true,
    data: { kind: "group", sourceId: groupId, order },
  };
}

export function createLayerTreeNode(
  layerId: string,
  name: string,
  parent: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
  order = 0,
): GroupLayerTreeNode {
  return {
    id: toLayerTreeNodeId(layerId),
    parent,
    text: name,
    droppable: false,
    data: { kind: "layer", sourceId: layerId, order },
  };
}

export function createTreeNodeFromCatalogItem(
  item: CatalogDragItem,
  parent: GroupLayerTreeNode["parent"],
  order = 0,
): GroupLayerTreeNode {
  return item.kind === "group"
    ? createGroupTreeNode(item.id, item.name, parent, order)
    : createLayerTreeNode(item.id, item.name, parent, order);
}

export function sortSiblingNodes<T extends GroupLayerTreeNode>(
  a: T,
  b: T,
): number {
  if (a.parent !== b.parent) {
    return 0;
  }

  return (a.data?.order ?? 0) - (b.data?.order ?? 0);
}

/** Assign sibling order from the flat tree array order returned by the DnD tree. */
export function applySiblingOrderFromFlatTree(
  tree: GroupLayerTreeNode[],
): GroupLayerTreeNode[] {
  const orderCounters = new Map<string, number>();

  return tree.map((node) => {
    const parentKey = String(node.parent);
    const order = orderCounters.get(parentKey) ?? 0;
    orderCounters.set(parentKey, order + 1);

    if (!node.data) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        order,
      },
    };
  });
}

export function resolveCatalogInsertTarget(
  tree: GroupLayerTreeNode[],
  dropTargetId: GroupLayerTreeNode["id"],
  dropTarget?: GroupLayerTreeNode,
  relativeIndex?: number,
): { parentId: GroupLayerTreeNode["parent"]; index: number } {
  const target = dropTarget ?? tree.find((node) => node.id === dropTargetId);

  if (target?.data?.kind === "layer" && dropTargetId === target.id) {
    const parentId = target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
    const siblings = tree.filter((node) => node.parent === parentId);
    const targetSiblingIndex = siblings.findIndex(
      (node) => node.id === target.id,
    );

    return {
      parentId,
      index: relativeIndex ?? Math.max(0, targetSiblingIndex),
    };
  }

  const parentId =
    target?.data?.kind === "layer"
      ? (target.parent ?? GROUP_LAYER_TREE_ROOT_ID)
      : dropTargetId;

  const siblingCount = tree.filter((node) => node.parent === parentId).length;

  return {
    parentId,
    index: relativeIndex ?? siblingCount,
  };
}

export function resolveDropParentId(
  tree: GroupLayerTreeNode[],
  dropTargetId?: GroupLayerTreeNode["id"],
  dropTarget?: GroupLayerTreeNode,
): GroupLayerTreeNode["parent"] {
  if (dropTargetId == null || dropTargetId === GROUP_LAYER_TREE_ROOT_ID) {
    return GROUP_LAYER_TREE_ROOT_ID;
  }

  const target = dropTarget ?? tree.find((node) => node.id === dropTargetId);

  if (target?.data?.kind === "layer") {
    return target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
  }

  return dropTargetId;
}

export function applyDropOnLayerRedirect(
  tree: GroupLayerTreeNode[],
  options: {
    dragSourceId?: GroupLayerTreeNode["id"];
    dropTargetId?: GroupLayerTreeNode["id"];
    dropTarget?: GroupLayerTreeNode;
  },
): GroupLayerTreeNode[] {
  const { dragSourceId, dropTargetId, dropTarget } = options;

  if (dragSourceId == null || dropTargetId == null) {
    return tree;
  }

  const target = dropTarget ?? tree.find((node) => node.id === dropTargetId);

  if (!target || target.data?.kind !== "layer") {
    return tree;
  }

  const resolvedParent = resolveDropParentId(tree, dropTargetId, target);
  const siblings = tree
    .filter(
      (node) => node.parent === resolvedParent && node.id !== dragSourceId,
    )
    .slice()
    .sort(sortSiblingNodes);
  const targetIndex = siblings.findIndex((node) => node.id === target.id);
  // Ignore library relativeIndex when the drop target is a layer — it often
  // means "index 0 under the layer" rather than sibling position.
  const index = targetIndex < 0 ? siblings.length : targetIndex + 1;

  return moveTreeNodeWithIndex(tree, dragSourceId, resolvedParent, index);
}
