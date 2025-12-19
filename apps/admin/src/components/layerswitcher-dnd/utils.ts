import { TreeItems, TreeItem } from "dnd-kit-sortable-tree";
import {
  ItemType,
  TreeItemData,
  ID_DELIMITER,
  ITEM_CAPABILITIES,
} from "./types";

// Parse source ID: "source::type::actualId" -> { type, id }
export const parseSourceId = (
  sourceId: string
): { type: ItemType; id: string } | null => {
  if (!sourceId.startsWith(`source${ID_DELIMITER}`)) return null;
  const withoutPrefix = sourceId.slice(`source${ID_DELIMITER}`.length);
  const delimIndex = withoutPrefix.indexOf(ID_DELIMITER);
  if (delimIndex === -1) return null;
  const type = withoutPrefix.slice(0, delimIndex) as ItemType;
  const id = withoutPrefix.slice(delimIndex + ID_DELIMITER.length);
  return { type, id };
};

// Create source ID from type and item id
export const createSourceId = (type: ItemType, id: string): string =>
  `source${ID_DELIMITER}${type}${ID_DELIMITER}${id}`;

// Enforce item rules (canHaveChildren based on type)
export const enforceItemRules = (
  treeItems: TreeItems<TreeItemData>
): TreeItems<TreeItemData> =>
  treeItems.map((item) => ({
    ...item,
    canHaveChildren: ITEM_CAPABILITIES[item.type].canHaveChildren,
    children: ITEM_CAPABILITIES[item.type].canHaveChildren
      ? item.children
        ? enforceItemRules(item.children)
        : item.children
      : undefined,
  }));

// Collect all item IDs from tree(s)
export const collectItemIds = (
  nodes: TreeItems<TreeItemData>,
  acc = new Set<string>()
): Set<string> => {
  nodes.forEach((n) => {
    acc.add(n.id);
    if (n.children) collectItemIds(n.children, acc);
  });
  return acc;
};

// Find a group node by ID in a tree
export const findGroupInTree = (
  nodes: TreeItems<TreeItemData>,
  targetId: string
): TreeItem<TreeItemData> | null => {
  for (const node of nodes) {
    if (node.id === targetId && node.type === "group") return node;
    if (node.children) {
      const found = findGroupInTree(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

// Insert item into a group within a tree
export const insertIntoGroup = (
  nodes: TreeItems<TreeItemData>,
  targetId: string,
  newItem: TreeItem<TreeItemData>
): TreeItems<TreeItemData> =>
  nodes.map((node) => {
    if (node.id === targetId && node.type === "group") {
      return {
        ...node,
        children: [...(node.children ?? []), newItem],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: insertIntoGroup(node.children, targetId, newItem),
      };
    }
    return node;
  });

// Move item up within its sibling list
export const moveItemUp = (
  nodes: TreeItems<TreeItemData>,
  itemId: string
): TreeItems<TreeItemData> => {
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].id === itemId) {
      const newNodes = [...nodes];
      [newNodes[i - 1], newNodes[i]] = [newNodes[i], newNodes[i - 1]];
      return newNodes;
    }
  }
  return nodes.map((node) =>
    node.children
      ? { ...node, children: moveItemUp(node.children, itemId) }
      : node
  );
};

// Move item down within its sibling list
export const moveItemDown = (
  nodes: TreeItems<TreeItemData>,
  itemId: string
): TreeItems<TreeItemData> => {
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].id === itemId) {
      const newNodes = [...nodes];
      [newNodes[i], newNodes[i + 1]] = [newNodes[i + 1], newNodes[i]];
      return newNodes;
    }
  }
  return nodes.map((node) =>
    node.children
      ? { ...node, children: moveItemDown(node.children, itemId) }
      : node
  );
};

// Check if item can move up
export const canItemMoveUp = (
  nodes: TreeItems<TreeItemData>,
  itemId: string
): boolean => {
  const findPosition = (items: TreeItems<TreeItemData>): number | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) return i;
      if (items[i].children) {
        const pos = findPosition(items[i].children!);
        if (pos !== null) return pos;
      }
    }
    return null;
  };
  const pos = findPosition(nodes);
  return pos !== null && pos > 0;
};

// Check if item can move down
export const canItemMoveDown = (
  nodes: TreeItems<TreeItemData>,
  itemId: string
): boolean => {
  const findPositionAndLength = (
    items: TreeItems<TreeItemData>
  ): { index: number; length: number } | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) return { index: i, length: items.length };
      if (items[i].children) {
        const result = findPositionAndLength(items[i].children!);
        if (result) return result;
      }
    }
    return null;
  };
  const result = findPositionAndLength(nodes);
  return result !== null && result.index < result.length - 1;
};
