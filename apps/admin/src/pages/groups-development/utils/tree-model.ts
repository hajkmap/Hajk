import type { LayerSwitcherTreeNode } from "../../../api/groups/types";
import { mutateTreeWithIndex } from "@minoru/react-dnd-treeview";
import type { CatalogDragItem, GroupLayerTreeNode, MoveZoneItem } from "../types";
import {
  CATALOG_DRAG_TYPE,
  GROUP_LAYER_TREE_ROOT_ID,
  MOVE_ZONE_DRAG_TYPE,
} from "../types";

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

export function getNextSiblingOrder(
  tree: GroupLayerTreeNode[],
  parentId: GroupLayerTreeNode["parent"],
): number {
  return tree
    .filter((node) => node.parent === parentId)
    .reduce((max, node) => Math.max(max, node.data?.order ?? 0), -1) + 1;
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
    const targetSiblingIndex = siblings.findIndex((node) => node.id === target.id);

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

export function insertCatalogItemIntoTree(
  tree: GroupLayerTreeNode[],
  catalogItem: CatalogDragItem,
  options: {
    dropTargetId: GroupLayerTreeNode["id"];
    dropTarget?: GroupLayerTreeNode;
    relativeIndex?: number;
  },
): GroupLayerTreeNode[] | null {
  const { dropTargetId, dropTarget, relativeIndex } = options;
  const { parentId, index } = resolveCatalogInsertTarget(
    tree,
    dropTargetId,
    dropTarget,
    relativeIndex,
  );

  if (catalogItem.kind === "layer" && !isValidLayerParentId(tree, parentId)) {
    return null;
  }

  const newNode = createTreeNodeFromCatalogItem(catalogItem, parentId, 0);

  if (tree.some((node) => node.id === newNode.id)) {
    return null;
  }

  const next = mutateTreeWithIndex(
    [...tree, newNode],
    newNode.id,
    parentId,
    index,
  ) as GroupLayerTreeNode[];

  return applySiblingOrderFromFlatTree(next);
}

export function collectTreeNodeIds(tree: GroupLayerTreeNode[]): Set<string> {
  return new Set(tree.map((node) => String(node.id)));
}

export function collectPlacedSourceIds(tree: GroupLayerTreeNode[]): {
  groupIds: Set<string>;
  layerIds: Set<string>;
} {
  const groupIds = new Set<string>();
  const layerIds = new Set<string>();

  for (const node of tree) {
    if (!node.data) {
      continue;
    }

    if (node.data.kind === "group") {
      groupIds.add(node.data.sourceId);
    } else {
      layerIds.add(node.data.sourceId);
    }
  }

  return { groupIds, layerIds };
}

export function getDescendantIds(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): Set<GroupLayerTreeNode["id"]> {
  const descendants = new Set<GroupLayerTreeNode["id"]>();
  const queue: GroupLayerTreeNode["id"][] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }

    for (const node of tree) {
      if (node.parent === current && !descendants.has(node.id)) {
        descendants.add(node.id);
        queue.push(node.id);
      }
    }
  }

  return descendants;
}

/**
 * Extract a node + descendants from the Kartlager tree for the Flyttzon.
 * Root of the extracted subtree is re-parented to GROUP_LAYER_TREE_ROOT_ID.
 */
export function extractSubtreeForMoveZone(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): { remainingTree: GroupLayerTreeNode[]; subtree: GroupLayerTreeNode[] } | null {
  const root = tree.find((node) => node.id === nodeId);
  if (!root?.data) {
    return null;
  }

  const descendantIds = getDescendantIds(tree, nodeId);
  const idsToExtract = new Set<GroupLayerTreeNode["id"]>([
    nodeId,
    ...descendantIds,
  ]);

  const subtree = tree
    .filter((node) => idsToExtract.has(node.id))
    .map((node) =>
      node.id === nodeId
        ? { ...node, parent: GROUP_LAYER_TREE_ROOT_ID }
        : { ...node },
    );

  const remainingTree = tree.filter((node) => !idsToExtract.has(node.id));

  return {
    remainingTree: applySiblingOrderFromFlatTree(remainingTree),
    subtree: applySiblingOrderFromFlatTree(subtree),
  };
}

export function removeTreeNodeWithDescendants(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): GroupLayerTreeNode[] {
  const descendants = getDescendantIds(tree, nodeId);
  const idsToRemove = new Set<GroupLayerTreeNode["id"]>([nodeId, ...descendants]);

  return tree.filter((node) => !idsToRemove.has(node.id));
}

export function isGroupNode(node: GroupLayerTreeNode | undefined): boolean {
  return node?.data?.kind === "group" || node?.droppable === true;
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

export function isValidLayerParentId(
  tree: GroupLayerTreeNode[],
  parentId: GroupLayerTreeNode["parent"],
): boolean {
  if (parentId == null || parentId === GROUP_LAYER_TREE_ROOT_ID) {
    return false;
  }

  const parentNode = tree.find((node) => node.id === parentId);
  return isGroupNode(parentNode);
}

export function insertMoveZoneSubtreeIntoTree(
  tree: GroupLayerTreeNode[],
  subtree: GroupLayerTreeNode[],
  dropOptions: {
    dropTargetId: GroupLayerTreeNode["id"];
    dropTarget?: GroupLayerTreeNode;
    relativeIndex?: number;
  },
): GroupLayerTreeNode[] | null {
  const root = subtree.find(
    (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
  );
  if (!root?.data) {
    return null;
  }

  if (tree.some((node) => node.id === root.id)) {
    return null;
  }

  const { parentId, index } = resolveCatalogInsertTarget(
    tree,
    dropOptions.dropTargetId,
    dropOptions.dropTarget,
    dropOptions.relativeIndex,
  );

  if (root.data.kind === "layer" && !isValidLayerParentId(tree, parentId)) {
    return null;
  }

  if (
    root.data.kind === "group" &&
    parentId !== GROUP_LAYER_TREE_ROOT_ID &&
    !isGroupNode(tree.find((node) => node.id === parentId))
  ) {
    return null;
  }

  const remappedRoot = { ...root, parent: parentId };
  const descendants = subtree.filter((node) => node.id !== root.id);

  let next = mutateTreeWithIndex(
    [...tree, remappedRoot],
    remappedRoot.id,
    parentId,
    index,
  ) as GroupLayerTreeNode[];

  next = [...next, ...descendants];
  return applySiblingOrderFromFlatTree(next);
}

export function canPlaceLayerAt(
  tree: GroupLayerTreeNode[],
  dropTargetId?: GroupLayerTreeNode["id"],
  dropTarget?: GroupLayerTreeNode,
): boolean {
  const resolvedParentId = resolveDropParentId(tree, dropTargetId, dropTarget);
  return isValidLayerParentId(tree, resolvedParentId);
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

  return tree.map((node) =>
    node.id === dragSourceId ? { ...node, parent: resolvedParent } : node,
  );
}

export function canDropGroupLayerNode(
  tree: GroupLayerTreeNode[],
  options: {
    dragSourceId?: GroupLayerTreeNode["id"];
    dropTargetId?: GroupLayerTreeNode["id"];
    dragSource?: GroupLayerTreeNode;
    dropTarget?: GroupLayerTreeNode;
    monitor?: {
      getItemType: () => string | symbol | null;
      getItem: () => unknown;
    };
  },
): boolean {
  const { dragSourceId, dropTargetId, dragSource, dropTarget, monitor } =
    options;

  if (dropTargetId == null) {
    return false;
  }

  if (dragSourceId == null) {
    const itemType = monitor?.getItemType();
    if (itemType === CATALOG_DRAG_TYPE) {
      const item = monitor?.getItem() as CatalogDragItem | undefined;
      if (item?.kind === "layer") {
        return canPlaceLayerAt(tree, dropTargetId, dropTarget);
      }
    }

    if (itemType === MOVE_ZONE_DRAG_TYPE) {
      const item = monitor?.getItem() as MoveZoneItem | undefined;
      if (item?.kind === "layer") {
        return canPlaceLayerAt(tree, dropTargetId, dropTarget);
      }
    }

    return true;
  }

  if (dragSourceId === dropTargetId) {
    return false;
  }

  const resolvedParentId = resolveDropParentId(tree, dropTargetId, dropTarget);

  if (dragSource?.data?.kind === "layer") {
    return isValidLayerParentId(tree, resolvedParentId);
  }

  if (dragSource?.data?.kind === "group") {
    if (resolvedParentId === dragSourceId) {
      return false;
    }

    const descendants = getDescendantIds(tree, dragSourceId);
    if (descendants.has(resolvedParentId)) {
      return false;
    }
  }

  return true;
}

export function layerSwitcherTreeToNodeModels(
  nodes: LayerSwitcherTreeNode[],
  parent: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
  groupNames: Map<string, string> = new Map(),
  layerNames: Map<string, string> = new Map(),
): GroupLayerTreeNode[] {
  const result: GroupLayerTreeNode[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.type === "layer") {
      result.push(
        createLayerTreeNode(
          node.id,
          layerNames.get(node.id) ?? node.id,
          parent,
          index,
        ),
      );
      continue;
    }

    const groupNode = createGroupTreeNode(
      node.id,
      node.name || groupNames.get(node.id) || node.id,
      parent,
      index,
    );
    result.push(groupNode);

    if (node.children?.length) {
      result.push(
        ...layerSwitcherTreeToNodeModels(
          node.children,
          groupNode.id,
          groupNames,
          layerNames,
        ),
      );
    }
  }

  return result;
}

export function nodeModelsToLayerSwitcherTree(
  tree: GroupLayerTreeNode[],
  parentId: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
): LayerSwitcherTreeNode[] {
  const children = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);

  return children.map((node) => {
    if (node.data?.kind === "layer") {
      return {
        type: "layer",
        id: node.data.sourceId,
      };
    }

    return {
      type: "group",
      id: node.data?.sourceId ?? parseTreeNodeSourceId(node.id),
      name: node.text,
      children: nodeModelsToLayerSwitcherTree(tree, node.id),
    };
  });
}
