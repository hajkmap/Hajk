import type { GroupLayerTreeNode } from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";
import {
  getDescendantIds,
  isGroupNode,
  isValidLayerParentId,
  sortSiblingNodes,
} from "./tree-model";

export interface ClickPlaceDestination {
  parentId: GroupLayerTreeNode["id"];
  index: number;
  /** True when nesting into the hovered group (vs placing as a sibling after it). */
  nestsIntoGroup: boolean;
}

function isGroupOpen(
  groupId: GroupLayerTreeNode["id"],
  openNodeIds: Set<string> | null | undefined,
): boolean {
  // null = Tree still on initialOpen (treat as expanded).
  return openNodeIds == null || openNodeIds.has(String(groupId));
}

/** Root start click-place (above first root sibling). */
export type ClickPlaceRootEdge = "start" | "end";

/**
 * Destination for placing at the tree root edge (before first / after last).
 */
export function resolveClickPlaceRootDestination(
  tree: GroupLayerTreeNode[],
  edge: ClickPlaceRootEdge,
): ClickPlaceDestination {
  const rootCount = tree.filter(
    (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
  ).length;
  return {
    parentId: GROUP_LAYER_TREE_ROOT_ID,
    index: edge === "start" ? 0 : rootCount,
    nestsIntoGroup: false,
  };
}

/**
 * One bottom-edge drop slot: deepest (inside last group) → shallowest (root).
 * Lines are rendered in stacked hit strips under the tree, not on group headers.
 */
export interface ClickPlaceEndLevel {
  parentId: GroupLayerTreeNode["id"];
  index: number;
  lineDepth: number;
}

function getVisibleSortedChildren(
  tree: GroupLayerTreeNode[],
  parentId: GroupLayerTreeNode["parent"],
  visibleNodeIds?: Set<string> | null,
): GroupLayerTreeNode[] {
  return tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes)
    .filter((node) => !visibleNodeIds || visibleNodeIds.has(String(node.id)));
}

/**
 * Last visible node in depth-first order (dives into expanded groups).
 */
export function getLastVisibleTreeNode(
  tree: GroupLayerTreeNode[],
  openNodeIds?: Set<string> | null,
  visibleNodeIds?: Set<string> | null,
): GroupLayerTreeNode | null {
  const walk = (
    parentId: GroupLayerTreeNode["parent"],
  ): GroupLayerTreeNode | null => {
    const children = getVisibleSortedChildren(tree, parentId, visibleNodeIds);
    if (children.length === 0) {
      return null;
    }
    const last = children[children.length - 1];
    if (
      last &&
      last.data?.kind === "group" &&
      isGroupOpen(last.id, openNodeIds)
    ) {
      return walk(last.id) ?? last;
    }
    return last ?? null;
  };
  return walk(GROUP_LAYER_TREE_ROOT_ID);
}

export function resolveClickPlaceEndLevels(
  tree: GroupLayerTreeNode[],
  openNodeIds?: Set<string> | null,
  visibleNodeIds?: Set<string> | null,
): ClickPlaceEndLevel[] {
  const last = getLastVisibleTreeNode(tree, openNodeIds, visibleNodeIds);
  if (!last) {
    return [
      {
        parentId: GROUP_LAYER_TREE_ROOT_ID,
        index: 0,
        lineDepth: 0,
      },
    ];
  }

  const levels: ClickPlaceEndLevel[] = [];
  let node: GroupLayerTreeNode = last;

  while (true) {
    const parentId = node.parent ?? GROUP_LAYER_TREE_ROOT_ID;
    const siblings = tree
      .filter((entry) => entry.parent === parentId)
      .slice()
      .sort(sortSiblingNodes);
    const nodeIndex = siblings.findIndex(
      (entry) => String(entry.id) === String(node.id),
    );
    levels.push({
      parentId,
      index: nodeIndex < 0 ? siblings.length : nodeIndex + 1,
      lineDepth: getTreeNodeDepth(tree, node.id),
    });

    if (parentId === GROUP_LAYER_TREE_ROOT_ID) {
      break;
    }
    const parent = tree.find((entry) => String(entry.id) === String(parentId));
    if (!parent) {
      break;
    }
    node = parent;
  }

  return levels;
}

/** Groups may live under root; layers must live under a group. */
export function isValidClickPlaceParentId(
  tree: GroupLayerTreeNode[],
  parentId: GroupLayerTreeNode["id"],
  kind: "group" | "layer",
): boolean {
  if (kind === "layer") {
    return isValidLayerParentId(tree, parentId);
  }
  if (parentId === GROUP_LAYER_TREE_ROOT_ID) {
    return true;
  }
  return isGroupNode(tree.find((node) => String(node.id) === String(parentId)));
}

/**
 * Click-and-place destination for a hovered tree node.
 *
 * - Layer target → insert after it under its parent group.
 * - Expanded group → nest as first child.
 * - Collapsed group → insert after it as a sibling (including at root).
 */
export function resolveClickPlaceDestination(
  tree: GroupLayerTreeNode[],
  targetId: GroupLayerTreeNode["id"],
  openNodeIds?: Set<string> | null,
): ClickPlaceDestination | null {
  const target = tree.find((node) => node.id === targetId);
  if (!target?.data) {
    return null;
  }

  if (target.data.kind === "layer") {
    const parentId = target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
    if (parentId === GROUP_LAYER_TREE_ROOT_ID) {
      return null;
    }
    const siblings = tree
      .filter((node) => node.parent === parentId)
      .slice()
      .sort(sortSiblingNodes);
    const targetIndex = siblings.findIndex((node) => node.id === target.id);
    return {
      parentId,
      index: targetIndex < 0 ? siblings.length : targetIndex + 1,
      nestsIntoGroup: false,
    };
  }

  if (target.data.kind !== "group") {
    return null;
  }

  const targetParent = target.parent ?? GROUP_LAYER_TREE_ROOT_ID;
  if (isGroupOpen(target.id, openNodeIds)) {
    return {
      parentId: target.id,
      index: 0,
      nestsIntoGroup: true,
    };
  }

  // Collapsed group: place after it under the same parent (root or nested).
  const siblings = tree
    .filter((node) => node.parent === targetParent)
    .slice()
    .sort(sortSiblingNodes);
  const targetIndex = siblings.findIndex((node) => node.id === target.id);
  return {
    parentId: targetParent,
    index: targetIndex < 0 ? siblings.length : targetIndex + 1,
    nestsIntoGroup: false,
  };
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
 */
export function moveTreeNodeToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceId: GroupLayerTreeNode["id"],
  targetId: GroupLayerTreeNode["id"],
  openNodeIds?: Set<string> | null,
): GroupLayerTreeNode[] | null {
  return moveTreeNodesToClickTarget(tree, [sourceId], targetId, openNodeIds);
}

/**
 * Whether moving `sourceIds` into `destination` is allowed (and would change order).
 */
export function canMoveTreeNodesToDestination(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  destination: ClickPlaceDestination,
  options?: {
    /** When placing onto a node, reject self / descendant targets. */
    targetId?: GroupLayerTreeNode["id"];
  },
): boolean {
  if (sourceIds.length === 0) {
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
  const targetId = options?.targetId;
  for (const sourceId of sourceIds) {
    const key = String(sourceId);
    if (seen.has(key)) {
      continue;
    }
    if (targetId != null && String(sourceId) === String(targetId)) {
      return false;
    }
    const source = tree.find((node) => node.id === sourceId);
    if (!source?.data) {
      continue;
    }
    if (
      targetId != null &&
      getDescendantIds(tree, sourceId, childrenByParent).has(targetId)
    ) {
      return false;
    }
    seen.add(key);
    movingIds.push(sourceId);
  }

  if (movingIds.length === 0) {
    return false;
  }

  const parentId = destination.parentId;
  for (const sourceId of movingIds) {
    if (getDescendantIds(tree, sourceId, childrenByParent).has(parentId)) {
      return false;
    }
  }

  for (const sourceId of movingIds) {
    const source = tree.find((node) => node.id === sourceId);
    if (!source?.data) {
      return false;
    }
    if (!isValidClickPlaceParentId(tree, parentId, source.data.kind)) {
      return false;
    }
  }

  const movingIdSet = new Set(movingIds.map((id) => String(id)));
  const destSiblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);
  const rest = destSiblings.filter((node) => !movingIdSet.has(String(node.id)));
  const insertAt = Math.max(0, Math.min(destination.index, rest.length));

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
 * Whether the click-place destination for a hovered node is allowed.
 */
export function canMoveTreeNodesToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  targetId: GroupLayerTreeNode["id"],
  openNodeIds?: Set<string> | null,
): boolean {
  const destination = resolveClickPlaceDestination(tree, targetId, openNodeIds);
  if (!destination) {
    return false;
  }
  const target = tree.find((node) => node.id === targetId);
  if (!target?.data) {
    return false;
  }
  return canMoveTreeNodesToDestination(tree, sourceIds, destination, {
    targetId,
  });
}

/**
 * Move multiple nodes onto a click-place target, preserving `sourceIds` order
 * (first id becomes the topmost / earliest after the target).
 */
export function moveTreeNodesToDestination(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  destination: ClickPlaceDestination,
  options?: {
    targetId?: GroupLayerTreeNode["id"];
  },
): GroupLayerTreeNode[] | null {
  if (!canMoveTreeNodesToDestination(tree, sourceIds, destination, options)) {
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

  const parentId = destination.parentId;
  const movingIdSet = new Set(movingIds.map((id) => String(id)));
  const destSiblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);
  const rest = destSiblings.filter((node) => !movingIdSet.has(String(node.id)));
  const insertAt = Math.max(0, Math.min(destination.index, rest.length));

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

/**
 * Move multiple nodes onto a click-place target, preserving `sourceIds` order
 * (first id becomes the topmost / earliest after the target).
 */
export function moveTreeNodesToClickTarget(
  tree: GroupLayerTreeNode[],
  sourceIds: GroupLayerTreeNode["id"][],
  targetId: GroupLayerTreeNode["id"],
  openNodeIds?: Set<string> | null,
): GroupLayerTreeNode[] | null {
  const destination = resolveClickPlaceDestination(tree, targetId, openNodeIds);
  if (!destination) {
    return null;
  }
  return moveTreeNodesToDestination(tree, sourceIds, destination, {
    targetId,
  });
}
