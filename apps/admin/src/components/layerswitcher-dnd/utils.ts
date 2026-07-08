import type { SxProps, Theme } from "@mui/material";
import { useDndMonitor } from "@dnd-kit/core";
import {
  TreeItems,
  TreeItem,
  type ItemChangedReason,
} from "dnd-kit-sortable-tree";
import {
  ItemType,
  TreeItemData,
  ID_DELIMITER,
  ITEM_CAPABILITIES,
} from "./types";

export type ReorderDropPosition = "above" | "below";

/** Card styling when a dragged item will be dropped into this group. */
export const getGroupDropTargetCardSx = (
  isDarkMode: boolean,
  isDropTarget: boolean,
): SxProps<Theme> =>
  isDropTarget
    ? {
        backgroundColor: isDarkMode
          ? "rgba(102, 187, 106, 0.2)"
          : "rgba(76, 175, 80, 0.14)",
        border: `2px dashed ${isDarkMode ? "#66bb6a" : "#43a047"}`,
        boxShadow: `inset 0 0 0 1px ${
          isDarkMode ? "rgba(102, 187, 106, 0.45)" : "rgba(67, 160, 71, 0.35)"
        }`,
      }
    : {};

export const getDropLineSx = (isDarkMode: boolean, edge: "top" | "bottom") => ({
  position: "absolute" as const,
  ...(edge === "top" ? { top: 0 } : { bottom: 0 }),
  left: 0,
  right: 0,
  height: "2px",
  backgroundColor: isDarkMode ? "#42a5f5" : "#1976d2",
  zIndex: 10,
  pointerEvents: "none" as const,
  boxShadow: `0 0 4px ${isDarkMode ? "#42a5f5" : "#1976d2"}`,
});

/** Map a drop index from the full list to an index in the list without `movedLayerId`. */
export function adjustDrawOrderInsertIndex(
  layerIds: string[],
  movedLayerId: string,
  insertIndex: number,
): number {
  const existingIndex = layerIds.indexOf(movedLayerId);
  const maxIndex =
    existingIndex === -1 ? layerIds.length : layerIds.length - 1;
  const clamped = Math.max(0, Math.min(insertIndex, layerIds.length));
  if (existingIndex === -1 || existingIndex >= clamped) {
    return Math.min(clamped, maxIndex);
  }
  return Math.max(0, clamped - 1);
}

export const treeDragActiveIdRef = { current: null as string | null };

export const treePointerXRef = { current: null as number | null };

export const treePointerYRef = { current: null as number | null };

/** Last pointer position during a tree drag — kept through drop handling. */
export const lastTreeDragPointerRef = {
  current: { x: null as number | null, y: null as number | null },
};

export type GroupDropIntent = "into" | "above" | "below";

/** Hit area for the drop-into-group icon shown during external drags. */
export const GROUP_INTO_DROP_TARGET_WIDTH_PX = 64;
export const GROUP_INTO_DROP_TARGET_HEIGHT_PX = 48;

/** @deprecated Use GROUP_INTO_DROP_TARGET_WIDTH_PX for grid column sizing. */
export const GROUP_INTO_DROP_TARGET_PX = GROUP_INTO_DROP_TARGET_WIDTH_PX;

export const GROUP_INTO_DROP_ID_PREFIX = "group-into-";

export const createGroupIntoDropId = (groupId: string) =>
  `${GROUP_INTO_DROP_ID_PREFIX}${groupId}`;

export const parseGroupIntoDropId = (id: string): string | null => {
  if (!id.startsWith(GROUP_INTO_DROP_ID_PREFIX)) {
    return null;
  }
  return id.slice(GROUP_INTO_DROP_ID_PREFIX.length);
};

export const treeGroupDropIntentRef = {
  current: null as { groupId: string; intent: GroupDropIntent } | null,
};

export const treeIntoDropHandlerRef = {
  current: null as ((activeId: string, groupId: string) => void) | null,
};

export const treeSiblingEdgeDropHandlerRef = {
  current: null as
    | ((
        activeId: string,
        pointer: { x: number | null; y: number | null },
      ) => void)
    | null,
};

const treeDragListeners = new Set<() => void>();

const notifyTreeDragListeners = () => {
  treeDragListeners.forEach((listener) => listener());
};

export const subscribeTreeDrag = (listener: () => void) => {
  treeDragListeners.add(listener);
  return () => {
    treeDragListeners.delete(listener);
  };
};

export const isPointerInRect = (
  x: number | null,
  y: number | null,
  rect: DOMRect | null,
  padding = 6,
): boolean => {
  if (x === null || y === null || rect === null) {
    return false;
  }
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  );
};

export const getGroupIntoTargetElementId = (groupId: string) =>
  `group-into-el-${groupId}`;

export const getTreeItemRowElementId = (itemId: string) =>
  `tree-item-row-${itemId}`;

/** Pointer band at the top/bottom of a group row for drag-out-as-sibling. */
export const GROUP_SIBLING_DROP_ZONE_ABOVE_PX = 24;
export const GROUP_SIBLING_DROP_ZONE_BELOW_PX = 24;
export const GROUP_SIBLING_DROP_ZONE_EXTEND_ABOVE_PX = 20;

export const isPointerOverGroupSiblingDropZone = (
  groupId: string,
  edge: ReorderDropPosition,
  pointer?: { x: number | null; y: number | null },
): boolean => {
  const x =
    pointer?.x ?? lastTreeDragPointerRef.current.x ?? treePointerXRef.current;
  const y =
    pointer?.y ?? lastTreeDragPointerRef.current.y ?? treePointerYRef.current;
  const el = document.getElementById(getTreeItemRowElementId(groupId));
  const rect = el?.getBoundingClientRect() ?? null;
  if (x === null || y === null || rect === null) {
    return false;
  }
  if (x < rect.left || x > rect.right) {
    return false;
  }
  if (edge === "above") {
    return (
      y >= rect.top - GROUP_SIBLING_DROP_ZONE_EXTEND_ABOVE_PX &&
      y <= rect.top + GROUP_SIBLING_DROP_ZONE_ABOVE_PX
    );
  }
  return (
    y >= rect.bottom - GROUP_SIBLING_DROP_ZONE_BELOW_PX && y <= rect.bottom + 10
  );
};

export const isPointerOverGroupIntoTarget = (
  groupId: string,
  pointer?: { x: number | null; y: number | null },
): boolean => {
  const x = pointer?.x ?? treePointerXRef.current;
  const y = pointer?.y ?? treePointerYRef.current;
  const el = document.getElementById(getGroupIntoTargetElementId(groupId));
  return isPointerInRect(x, y, el?.getBoundingClientRect() ?? null, 4);
};

/** Track the item currently being dragged inside a SortableTree. */
export const useTrackTreeDragActiveId = () => {
  useDndMonitor({
    onDragStart(event) {
      treeDragActiveIdRef.current = event.active.id.toString();
      const activator = event.activatorEvent;
      if (activator instanceof MouseEvent) {
        lastTreeDragPointerRef.current = {
          x: activator.clientX,
          y: activator.clientY,
        };
      } else if (
        activator instanceof TouchEvent &&
        activator.touches.length > 0
      ) {
        lastTreeDragPointerRef.current = {
          x: activator.touches[0].clientX,
          y: activator.touches[0].clientY,
        };
      }
      notifyTreeDragListeners();
    },
    onDragEnd(event) {
      const activeId = event.active.id.toString();
      const overId = event.over?.id?.toString();
      const intoGroupId = overId ? parseGroupIntoDropId(overId) : null;
      if (intoGroupId && isPointerOverGroupIntoTarget(intoGroupId)) {
        treeGroupDropIntentRef.current = {
          groupId: intoGroupId,
          intent: "into",
        };
        if (!activeId.startsWith("source-")) {
          treeIntoDropHandlerRef.current?.(activeId, intoGroupId);
        }
      } else if (!activeId.startsWith("source-")) {
        treeSiblingEdgeDropHandlerRef.current?.(activeId, {
          x: lastTreeDragPointerRef.current.x,
          y: lastTreeDragPointerRef.current.y,
        });
      }
      treeDragActiveIdRef.current = null;
      notifyTreeDragListeners();
    },
    onDragCancel() {
      treeDragActiveIdRef.current = null;
      treeGroupDropIntentRef.current = null;
      notifyTreeDragListeners();
    },
  });
};

export const flattenTreeItemIds = <T extends { id: unknown; children?: T[] }>(
  items: T[],
): string[] => {
  const ids: string[] = [];
  const visit = (nodes: T[]) => {
    for (const node of nodes) {
      ids.push(String(node.id));
      if (node.children?.length) {
        visit(node.children);
      }
    }
  };
  visit(items);
  return ids;
};

/** Removes an item (and its subtree) from a sortable tree by id. */
export const removeItemFromTree = (
  items: TreeItems<TreeItemData>,
  itemId: string,
): TreeItems<TreeItemData> =>
  items
    .filter((item) => item.id.toString() !== itemId)
    .map((item) =>
      item.children?.length
        ? {
            ...item,
            children: removeItemFromTree(item.children, itemId),
          }
        : item,
    );

/** Updates a single tree node in place (depth-first). */
export const updateItemInTree = (
  items: TreeItems<TreeItemData>,
  itemId: string,
  updater: (item: TreeItem<TreeItemData>) => TreeItem<TreeItemData>,
): TreeItems<TreeItemData> =>
  items.map((item) => {
    if (item.id.toString() === itemId) {
      return updater(item);
    }
    if (item.children?.length) {
      return {
        ...item,
        children: updateItemInTree(item.children, itemId, updater),
      };
    }
    return item;
  });

/** Drop edge from list order: dragging down → below target, dragging up → above. */
export const getReorderDropPosition = (
  targetItemId: string,
  activeDragId: string | null,
  flattenedIds: readonly string[],
  isReorderTarget: boolean,
): ReorderDropPosition | null => {
  if (!isReorderTarget || !activeDragId || activeDragId === targetItemId) {
    return null;
  }

  const dragIndex = flattenedIds.indexOf(activeDragId);
  const targetIndex = flattenedIds.indexOf(targetItemId);
  if (dragIndex === -1 || targetIndex === -1) {
    return null;
  }

  return dragIndex < targetIndex ? "below" : "above";
};

/** Up to two lines of item text, clamped with ellipsis when longer. */
export const DND_ITEM_TITLE_SX: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  wordBreak: "break-word",
  lineHeight: 1.25,
};

/** Item text shown in full, wrapping across multiple lines when needed. */
export const DND_ITEM_TITLE_FULL_SX: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  wordBreak: "break-word",
  lineHeight: 1.25,
  whiteSpace: "normal",
};

export const DND_TREE_ACTION_SLOT_SIZE = 28;

export const DND_TREE_ACTION_SLOT_GAP = 2;

export const getTreeActionsBarWidth = (slotCount: number) =>
  DND_TREE_ACTION_SLOT_SIZE * slotCount +
  DND_TREE_ACTION_SLOT_GAP * (slotCount - 1);

export const getTreeItemGridColumns = (options?: {
  showIntoDropTarget?: boolean;
  actionSlotCount?: number;
}) => {
  const actionSlots = options?.actionSlotCount ?? 4;
  const intoColumn = options?.showIntoDropTarget
    ? `${GROUP_INTO_DROP_TARGET_WIDTH_PX}px `
    : "";
  return `auto minmax(0, 1fr) ${intoColumn}${getTreeActionsBarWidth(actionSlots)}px`;
};

/** Compact row layout for tree drop-zone items. */
export const DND_TREE_ITEM_CARD_SX: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: `auto minmax(0, 1fr) ${getTreeActionsBarWidth(4)}px`,
  columnGap: 1,
  alignItems: "flex-start",
  px: 1.5,
  py: 1,
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  position: "relative",
  borderRadius: 2,
};

/** Drag grip inside item cards — matches left-panel source items. */
export const DND_DRAG_HANDLE_SX: SxProps<Theme> = {
  mt: 0.25,
  color: "text.secondary",
  flexShrink: 0,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
};

export const DND_TREE_ICON_BUTTON_SX = {
  p: 0.25,
  width: DND_TREE_ACTION_SLOT_SIZE,
  height: DND_TREE_ACTION_SLOT_SIZE,
} as const;

/** Fixed-width action bar: up, down, add, remove — one slot per column. */
export const DND_TREE_ACTIONS_BAR_SX: SxProps<Theme> = {
  display: "flex",
  gap: 0.25,
  flexShrink: 0,
  justifyContent: "flex-end",
  alignItems: "flex-start",
  justifySelf: "end",
  mt: 0.25,
};

export const DND_TREE_ACTION_SLOT_SX: SxProps<Theme> = {
  width: DND_TREE_ACTION_SLOT_SIZE,
  height: DND_TREE_ACTION_SLOT_SIZE,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

/** Strip default padding/border from dnd-kit-sortable-tree item shell. */
export const DND_TREE_SORTABLE_OVERRIDES_SX: SxProps<Theme> = {
  "& .dnd-sortable-tree_simple_wrapper": {
    width: "100%",
    maxWidth: "100%",
  },
  "& .dnd-sortable-tree_simple_tree-item": {
    width: "100%",
    maxWidth: "100%",
    p: 0,
    border: "none",
    alignItems: "stretch",
  },
  "& .dnd-sortable-tree_simple_handle": {
    display: "none",
  },
};

/** Full tree panel overrides — fixes library overlap (-1px margin) and nested flex clipping. */
export const getSortableTreePanelSx = (
  isDarkMode: boolean,
): SxProps<Theme> => ({
  ...DND_TREE_SORTABLE_OVERRIDES_SX,
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  "& .dnd-sortable-tree_simple_wrapper": {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    marginBottom: "8px",
    listStyle: "none",
  },
  "& .dnd-sortable-tree_simple_tree-item": {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    p: 0,
    border: "none",
    alignItems: "stretch",
    display: "flex",
    boxSizing: "border-box",
  },
  "& .dnd-sortable-tree_simple_tree-item-collapse_button": {
    filter: isDarkMode ? "brightness(0) invert(0.6)" : "none",
    alignSelf: "flex-start",
    mt: 1,
  },
  "& .dnd-sortable-tree_simple_handle": {
    display: "none",
  },
  "& .dnd-sortable-tree_drop-indicator": {
    backgroundColor: isDarkMode ? "#42a5f5" : "#1976d2",
    height: "2px",
    boxShadow: `0 0 4px ${isDarkMode ? "#42a5f5" : "#1976d2"}`,
  },
});

// Parse source ID: "source::type::actualId" -> { type, id }
export const parseSourceId = (
  sourceId: string,
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

export type ZoneRules = {
  acceptedItemTypes?: ItemType[];
  allowNesting?: boolean;
};

export type ZoneRuleViolation =
  | "invalid-item-type"
  | "nesting-not-allowed"
  | "parent-cannot-have-children";

/** Returns the first zone rule violation in `treeItems`, or null if valid. */
export const findZoneRuleViolations = (
  treeItems: TreeItems<TreeItemData>,
  options?: ZoneRules,
): ZoneRuleViolation | null => {
  for (const item of treeItems) {
    if (
      options?.acceptedItemTypes?.length &&
      !options.acceptedItemTypes.includes(item.type)
    ) {
      return "invalid-item-type";
    }
    if (item.children?.length) {
      if (options?.allowNesting === false) {
        return "nesting-not-allowed";
      }
      if (!ITEM_CAPABILITIES[item.type].canHaveChildren) {
        return "parent-cannot-have-children";
      }
      const childViolation = findZoneRuleViolations(item.children, options);
      if (childViolation) {
        return childViolation;
      }
    }
  }
  return null;
};

export const isValidZoneTree = (
  treeItems: TreeItems<TreeItemData>,
  options?: ZoneRules,
): boolean => findZoneRuleViolations(treeItems, options) === null;

/** Whether a SortableTree drop should be applied (rejects invalid nest targets). */
export const isValidTreeDrop = (
  reason: ItemChangedReason<TreeItemData>,
  options?: ZoneRules,
): boolean => {
  if (reason.type !== "dropped") {
    return true;
  }

  const { droppedToParent, draggedItem } = reason;

  if (options?.allowNesting === false && droppedToParent !== null) {
    return false;
  }

  if (droppedToParent) {
    if (!ITEM_CAPABILITIES[droppedToParent.type].canHaveChildren) {
      return false;
    }
    if (
      options?.acceptedItemTypes?.length &&
      !options.acceptedItemTypes.includes(draggedItem.type)
    ) {
      return false;
    }
  }

  return true;
};

// Enforce item rules (canHaveChildren based on type)
export const enforceItemRules = (
  treeItems: TreeItems<TreeItemData>,
  options?: Pick<ZoneRules, "allowNesting">,
): TreeItems<TreeItemData> =>
  treeItems.map((item) => {
    const canHaveChildren =
      options?.allowNesting === false
        ? false
        : ITEM_CAPABILITIES[item.type].canHaveChildren;
    return {
      ...item,
      canHaveChildren,
      children: canHaveChildren
        ? item.children?.length
          ? enforceItemRules(item.children, options)
          : undefined
        : undefined,
    };
  });

/** Flattens a tree to root-level siblings (preserves depth-first order). */
export const flattenToRoot = (
  treeItems: TreeItems<TreeItemData>,
): TreeItems<TreeItemData> => {
  const result: TreeItems<TreeItemData> = [];
  const visit = (nodes: TreeItems<TreeItemData>) => {
    nodes.forEach((node) => {
      result.push({ ...node, children: undefined, canHaveChildren: false });
      if (node.children?.length) {
        visit(node.children);
      }
    });
  };
  visit(treeItems);
  return result;
};

const filterAcceptedItemTypes = (
  treeItems: TreeItems<TreeItemData>,
  acceptedItemTypes: ItemType[],
): TreeItems<TreeItemData> =>
  treeItems
    .filter((item) => acceptedItemTypes.includes(item.type))
    .map((item) =>
      item.children?.length
        ? {
            ...item,
            children: filterAcceptedItemTypes(item.children, acceptedItemTypes),
          }
        : item,
    );

export const enforceZoneRules = (
  treeItems: TreeItems<TreeItemData>,
  options?: ZoneRules,
): TreeItems<TreeItemData> => {
  let tree = enforceItemRules(treeItems, {
    allowNesting: options?.allowNesting,
  });
  if (options?.acceptedItemTypes?.length) {
    tree = filterAcceptedItemTypes(tree, options.acceptedItemTypes);
  }
  if (options?.allowNesting === false) {
    tree = flattenToRoot(tree);
  }
  return tree;
};

export const zoneAcceptsItemType = (
  zone: { acceptedItemTypes?: ItemType[] },
  itemType: ItemType,
): boolean =>
  !zone.acceptedItemTypes?.length || zone.acceptedItemTypes.includes(itemType);

// Collect all item IDs from tree(s)
export const collectItemIds = (
  nodes: TreeItems<TreeItemData>,
  acc = new Set<string>(),
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
  targetId: string,
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

/** Whether a catalog/external drop landed on an allowed target for the zone. */
export const isValidExternalDropTarget = (
  overId: string,
  zone: {
    id: string;
    items: TreeItems<TreeItemData>;
    allowNesting?: boolean;
  },
): boolean => {
  if (overId === zone.id) {
    return true;
  }
  if (zone.allowNesting === false) {
    return false;
  }
  return findGroupInTree(zone.items, overId) !== null;
};

// Insert item into a group within a tree
export const insertIntoGroup = (
  nodes: TreeItems<TreeItemData>,
  targetId: string,
  newItem: TreeItem<TreeItemData>,
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
  itemId: string,
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
      : node,
  );
};

// Move item down within its sibling list
export const moveItemDown = (
  nodes: TreeItems<TreeItemData>,
  itemId: string,
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
      : node,
  );
};

// Check if item can move up
export const canItemMoveUp = (
  nodes: TreeItems<TreeItemData>,
  itemId: string,
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
  itemId: string,
): boolean => {
  const findPositionAndLength = (
    items: TreeItems<TreeItemData>,
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
