import type { LayerSwitcherToggleState } from "../components/layer-switcher-checkbox";
import type { GroupLayerTreeNode } from "../types";

export function normalizeVisibleId(
  nodeId: GroupLayerTreeNode["id"],
): string {
  return String(nodeId);
}

export function isLayerVisible(
  visibleIds: Set<string>,
  layerId: GroupLayerTreeNode["id"],
): boolean {
  return visibleIds.has(normalizeVisibleId(layerId));
}

export function toggleLayerVisibility(
  visibleIds: Set<string>,
  layerId: GroupLayerTreeNode["id"],
): Set<string> {
  const next = new Set(visibleIds);
  const key = normalizeVisibleId(layerId);

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
}

export function getDescendantGroupNodeIds(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): GroupLayerTreeNode["id"][] {
  const groupIds: GroupLayerTreeNode["id"][] = [nodeId];
  const queue: GroupLayerTreeNode["id"][] = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId == null) {
      continue;
    }

    for (const child of tree.filter((node) => node.parent === currentId)) {
      if (child.data?.kind === "group") {
        groupIds.push(child.id);
        queue.push(child.id);
      }
    }
  }

  return groupIds;
}

export function toggleGroupVisibility(
  tree: GroupLayerTreeNode[],
  visibleIds: Set<string>,
  groupId: GroupLayerTreeNode["id"],
): Set<string> {
  const descendantGroupIds = getDescendantGroupNodeIds(tree, groupId);
  const descendantLayerIds = getDescendantLayerNodeIds(tree, groupId);
  const next = new Set(visibleIds);
  const groupKey = normalizeVisibleId(groupId);
  const shouldEnable = !next.has(groupKey);

  for (const id of descendantGroupIds) {
    const key = normalizeVisibleId(id);

    if (shouldEnable) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }

  for (const layerId of descendantLayerIds) {
    const key = normalizeVisibleId(layerId);

    if (shouldEnable) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }

  return next;
}

export function getDescendantLayerNodeIds(
  tree: GroupLayerTreeNode[],
  nodeId: GroupLayerTreeNode["id"],
): GroupLayerTreeNode["id"][] {
  const layerIds: GroupLayerTreeNode["id"][] = [];
  const queue: GroupLayerTreeNode["id"][] = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId == null) {
      continue;
    }

    for (const child of tree.filter((node) => node.parent === currentId)) {
      if (child.data?.kind === "layer") {
        layerIds.push(child.id);
      } else {
        queue.push(child.id);
      }
    }
  }

  return layerIds;
}

export function getGroupToggleState(
  _tree: GroupLayerTreeNode[],
  groupId: GroupLayerTreeNode["id"],
  visibleIds: Set<string>,
): LayerSwitcherToggleState {
  return visibleIds.has(normalizeVisibleId(groupId)) ? "checked" : "unchecked";
}

export function isGroupActive(
  _tree: GroupLayerTreeNode[],
  groupId: GroupLayerTreeNode["id"],
  visibleIds: Set<string>,
): boolean {
  return visibleIds.has(normalizeVisibleId(groupId));
}
