import type { GroupLayerTreeNode } from "../types";

/**
 * Move a node to `dropTargetId` as parent, placing it at sibling `index`.
 * Local stand-in for `@minoru/react-dnd-treeview`'s `mutateTreeWithIndex`.
 *
 * Sibling order is based on `data.order` (not flat-array encounter order), and
 * the flat list stays depth-first so Tree `sort={false}` and save serialization
 * agree on the same sequence.
 */
export function moveTreeNodeWithIndex(
  tree: GroupLayerTreeNode[],
  dragSourceId: GroupLayerTreeNode["id"],
  dropTargetId: GroupLayerTreeNode["id"],
  index: number,
): GroupLayerTreeNode[] {
  const source = tree.find((node) => node.id === dragSourceId);
  if (!source) {
    return tree;
  }

  const withoutSource = tree.filter((node) => node.id !== dragSourceId);
  const destSiblings = withoutSource
    .filter((node) => node.parent === dropTargetId)
    .slice()
    .sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0));
  const clampedIndex = Math.max(0, Math.min(index, destSiblings.length));
  const moved: GroupLayerTreeNode = { ...source, parent: dropTargetId };
  const orderedSiblings = [
    ...destSiblings.slice(0, clampedIndex),
    moved,
    ...destSiblings.slice(clampedIndex),
  ].map((node, order) =>
    node.data
      ? {
          ...node,
          parent: dropTargetId,
          data: {
            ...node.data,
            order,
          },
        }
      : { ...node, parent: dropTargetId },
  );
  const destSiblingIds = new Set(
    destSiblings.map((node) => String(node.id)),
  );

  const result: GroupLayerTreeNode[] = [];
  let siblingsInserted = false;
  for (const node of withoutSource) {
    if (destSiblingIds.has(String(node.id))) {
      if (!siblingsInserted) {
        result.push(...orderedSiblings);
        siblingsInserted = true;
      }
      continue;
    }
    result.push(node);
  }

  if (!siblingsInserted) {
    const parentIndex = result.findIndex((node) => node.id === dropTargetId);
    if (parentIndex >= 0) {
      result.splice(parentIndex + 1, 0, ...orderedSiblings);
    } else {
      result.push(...orderedSiblings);
    }
  }

  return result;
}
