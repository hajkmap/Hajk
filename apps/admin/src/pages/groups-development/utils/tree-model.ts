import type { LayerSwitcherTreeNode } from "../../../api/groups/types";
import type { CatalogDragItem, GroupLayerTreeNode } from "../types";
import { CATALOG_DRAG_TYPE, GROUP_LAYER_TREE_ROOT_ID } from "../types";

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
): GroupLayerTreeNode {
  return {
    id: toGroupTreeNodeId(groupId),
    parent,
    text: name,
    droppable: true,
    data: { kind: "group", sourceId: groupId },
  };
}

export function createLayerTreeNode(
  layerId: string,
  name: string,
  parent: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
): GroupLayerTreeNode {
  return {
    id: toLayerTreeNodeId(layerId),
    parent,
    text: name,
    droppable: false,
    data: { kind: "layer", sourceId: layerId },
  };
}

export function createTreeNodeFromCatalogItem(
  item: CatalogDragItem,
  parent: GroupLayerTreeNode["parent"],
): GroupLayerTreeNode {
  return item.kind === "group"
    ? createGroupTreeNode(item.id, item.name, parent)
    : createLayerTreeNode(item.id, item.name, parent);
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

function getDescendantIds(
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

  for (const node of nodes) {
    if (node.type === "layer") {
      result.push(
        createLayerTreeNode(
          node.id,
          layerNames.get(node.id) ?? node.id,
          parent,
        ),
      );
      continue;
    }

    const groupNode = createGroupTreeNode(
      node.id,
      node.name || groupNames.get(node.id) || node.id,
      parent,
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
  const children = tree.filter((node) => node.parent === parentId);

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
