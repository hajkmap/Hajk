import type { GroupLayerTreeNode } from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";
import {
  getDescendantIds,
  isGroupNode,
  isValidLayerParentId,
  sortSiblingNodes,
} from "./tree-model";

/**
 * Click-and-place insert position: into a group as first child (index 0),
 * or after a layer.
 */
export function resolveClickPlaceInsertIndex(
  tree: GroupLayerTreeNode[],
  targetId: GroupLayerTreeNode["id"],
): number | undefined {
  const target = tree.find((node) => node.id === targetId);
  if (!target?.data) {
    return undefined;
  }
  if (target.data.kind === "group") {
    return 0;
  }
  if (target.data.kind !== "layer") {
    return undefined;
  }
  const parentId = target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
  const siblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);
  const targetIndex = siblings.findIndex((node) => node.id === target.id);
  return targetIndex < 0 ? siblings.length : targetIndex + 1;
}

export function getTreeNodeDepth(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): number {
  let depth = 0;
  let parent = tree.find((node) => node.id === nodeId)?.parent;
  while (parent != null && parent !== GROUP_LAYER_TREE_ROOT_ID) {
    depth += 1;
    parent = tree.find((node) => node.id === parent)?.parent;
  }
  return depth;
}

/**
 * Keep only selection roots — drop nodes that already move with a selected ancestor.
 */
export function filterTreeSelectionRoots(
  tree: GroupLayerTreeNode[],
  nodeIds: GroupLayerTreeNode["id"][],
): GroupLayerTreeNode["id"][] {
  const selected = new Set(nodeIds.map((id) => String(id)));
  return nodeIds.filter((nodeId) => {
    let parent = tree.find((node) => node.id === nodeId)?.parent;
    while (parent != null && parent !== GROUP_LAYER_TREE_ROOT_ID) {
      if (selected.has(String(parent))) {
        return false;
      }
      parent = tree.find((node) => node.id === parent)?.parent;
    }
    return true;
  });
}

/**
 * Move an existing Maplayers node via click-and-drop onto another node.
 * Group targets receive the item as first child (index 0); layer targets get
 * it as the next sibling (same parent).
 */
export function moveTreeNodeToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceId: GroupLayerTreeNode["id"],
  targetId: GroupLayerTreeNode["id"],
): GroupLayerTreeNode[] | null {
  return moveTreeNodesToClickTarget(tree, [sourceId], targetId);
}

/**
 * Move multiple nodes onto a click-place target, preserving `sourceIds` order
 * (first id becomes the topmost / earliest after the target).
 */
export function canMoveTreeNodesToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  targetId: GroupLayerTreeNode["id"],
): boolean {
  if (sourceIds.length === 0) {
    return false;
  }

  const target = tree.find((node) => node.id === targetId);
  if (!target?.data) {
    return false;
  }

  const childrenByParent = new Map<string, GroupLayerTreeNode[]>();
  for (const node of tree) {
    const key = String(node.parent);
    const siblings = childrenByParent.get(key);
    if (siblings) {
      siblings.push(node);
    } else {
      childrenByParent.set(key, [node]);
    }
  }
  const movingIds: GroupLayerTreeNode["id"][] = [];
  const seen = new Set<string>();
  for (const sourceId of sourceIds) {
    const key = String(sourceId);
    if (seen.has(key)) {
      continue;
    }
    if (String(sourceId) === String(targetId)) {
      return false;
    }
    const source = tree.find((node) => node.id === sourceId);
    if (!source?.data) {
      continue;
    }
    if (getDescendantIds(tree, sourceId, childrenByParent).has(targetId)) {
      return false;
    }
    seen.add(key);
    movingIds.push(sourceId);
  }

  if (movingIds.length === 0) {
    return false;
  }

  let parentId: GroupLayerTreeNode["parent"];
  if (target.data.kind === "group") {
    parentId = target.id;
    for (const sourceId of movingIds) {
      if (getDescendantIds(tree, sourceId, childrenByParent).has(parentId)) {
        return false;
      }
    }
  } else {
    parentId = target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
  }

  for (const sourceId of movingIds) {
    const source = tree.find((node) => node.id === sourceId);
    if (!source?.data) {
      return false;
    }
    if (source.data.kind === "layer" && !isValidLayerParentId(tree, parentId)) {
      return false;
    }
    if (
      source.data.kind === "group" &&
      parentId !== GROUP_LAYER_TREE_ROOT_ID &&
      !isGroupNode(tree.find((node) => String(node.id) === String(parentId)))
    ) {
      return false;
    }
  }

  const movingIdSet = new Set(movingIds.map((id) => String(id)));
  const destSiblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);
  const rest = destSiblings.filter((node) => !movingIdSet.has(String(node.id)));

  let insertAt: number;
  if (target.data.kind === "group") {
    insertAt = 0;
  } else {
    const targetIndex = rest.findIndex((node) => node.id === target.id);
    insertAt = targetIndex < 0 ? rest.length : targetIndex + 1;
  }

  const nextSiblingIds = [
    ...rest.slice(0, insertAt).map((node) => node.id),
    ...movingIds,
    ...rest.slice(insertAt).map((node) => node.id),
  ];

  return !(
    nextSiblingIds.length === destSiblings.length &&
    nextSiblingIds.every((id, i) => id === destSiblings[i]?.id) &&
    movingIds.every(
      (id) =>
        String(tree.find((entry) => entry.id === id)?.parent) ===
        String(parentId),
    )
  );
}

/**
 * Move multiple nodes onto a click-place target, preserving `sourceIds` order
 * (first id becomes the topmost / earliest after the target).
 */
export function moveTreeNodesToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  targetId: GroupLayerTreeNode["id"],
): GroupLayerTreeNode[] | null {
  if (!canMoveTreeNodesToClickTarget(tree, sourceIds, targetId)) {
    return null;
  }

  const target = tree.find((node) => node.id === targetId);
  if (!target?.data) {
    return null;
  }

  const movingIds: GroupLayerTreeNode["id"][] = [];
  const seen = new Set<string>();
  for (const sourceId of sourceIds) {
    const key = String(sourceId);
    if (seen.has(key)) {
      continue;
    }
    const source = tree.find((node) => node.id === sourceId);
    if (!source?.data) {
      continue;
    }
    seen.add(key);
    movingIds.push(sourceId);
  }

  const parentId =
    target.data.kind === "group"
      ? target.id
      : (target.parent ?? GROUP_LAYER_TREE_ROOT_ID);

  const movingIdSet = new Set(movingIds.map((id) => String(id)));
  const destSiblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);
  const rest = destSiblings.filter((node) => !movingIdSet.has(String(node.id)));

  let insertAt: number;
  if (target.data.kind === "group") {
    insertAt = 0;
  } else {
    const targetIndex = rest.findIndex((node) => node.id === target.id);
    insertAt = targetIndex < 0 ? rest.length : targetIndex + 1;
  }

  const movingNodes: GroupLayerTreeNode[] = [];
  for (const sourceId of movingIds) {
    const source = tree.find((node) => node.id === sourceId);
    if (!source) {
      return null;
    }
    movingNodes.push({ ...source, parent: parentId });
  }

  const nextSiblings: GroupLayerTreeNode[] = [
    ...rest.slice(0, insertAt),
    ...movingNodes,
    ...rest.slice(insertAt),
  ];

  const orderedIds = new Set(nextSiblings.map((node) => String(node.id)));
  const reorderedSiblings: GroupLayerTreeNode[] = nextSiblings.map(
    (node, order) => ({
      ...node,
      parent: parentId,
      data: node.data
        ? {
            ...node.data,
            order,
          }
        : node.data,
    }),
  );

  const result: GroupLayerTreeNode[] = [];
  let inserted = false;
  for (const node of tree) {
    if (orderedIds.has(String(node.id))) {
      if (!inserted) {
        result.push(...reorderedSiblings);
        inserted = true;
      }
      continue;
    }
    if (movingIdSet.has(String(node.id))) {
      continue;
    }
    result.push(node);
  }
  if (!inserted) {
    result.push(...reorderedSiblings);
  }

  return result;
}
