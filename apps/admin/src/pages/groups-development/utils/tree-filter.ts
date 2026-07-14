import type { GroupLayerTreeNode } from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";

export function filterTreeBySearch(
  tree: GroupLayerTreeNode[],
  search: string,
): GroupLayerTreeNode[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return tree;
  }

  const matchingIds = new Set<GroupLayerTreeNode["id"]>();

  for (const node of tree) {
    if (!node.text.toLowerCase().includes(query)) {
      continue;
    }

    matchingIds.add(node.id);

    let parentId = node.parent;
    while (parentId != null && parentId !== GROUP_LAYER_TREE_ROOT_ID) {
      matchingIds.add(parentId);
      const parentNode = tree.find((candidate) => candidate.id === parentId);
      parentId = parentNode?.parent;
    }

    const queue: GroupLayerTreeNode["id"][] = [node.id];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId == null) {
        continue;
      }

      for (const child of tree.filter(
        (candidate) => candidate.parent === currentId,
      )) {
        if (!matchingIds.has(child.id)) {
          matchingIds.add(child.id);
          queue.push(child.id);
        }
      }
    }
  }

  return tree.filter((node) => matchingIds.has(node.id));
}
