import { useCallback, type Dispatch, type SetStateAction } from "react";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MoveZoneItem,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  GROUP_LAYER_TREE_ROOT_ID,
  MOVE_ZONE_DRAG_TYPE,
} from "../types";
import { isLayerStillInMapLayersTree } from "../utils/maplayers-editor";
import { moveTreeNodeWithIndex } from "../utils/move-tree-node";
import {
  applyMapLayersSiblingOrder,
  createTreeNodeFromCatalogItem,
  getNextSiblingOrder,
  insertCatalogItemIntoTree,
  insertMoveZoneSubtreeIntoTree,
  isValidLayerParentId,
  resolveDropParentId,
  sortSiblingNodes,
} from "../utils/tree-model";
import type { MapLayersTreeDropOptions } from "./maplayers-tree-drop-options";

export type { MapLayersTreeDropOptions } from "./maplayers-tree-drop-options";

export interface UseMapLayersTreeDndParams {
  treeData: GroupLayerTreeNode[];
  setTreeData: Dispatch<SetStateAction<GroupLayerTreeNode[]>>;
  setMoveZoneItems: Dispatch<SetStateAction<MoveZoneItem[]>>;
  backgroundMode: boolean;
}

export function useMapLayersTreeDnd({
  treeData,
  setTreeData,
  setMoveZoneItems,
  backgroundMode,
}: UseMapLayersTreeDndParams) {
  const addCatalogItemsToParent = useCallback(
    (
      catalogItems: CatalogDragItem[],
      parentId: GroupLayerTreeNode["parent"],
    ) => {
      if (catalogItems.length === 0) {
        return;
      }

      setTreeData((current) => {
        let next = current;

        for (const catalogItem of catalogItems) {
          const order = getNextSiblingOrder(next, parentId);
          const newNode = createTreeNodeFromCatalogItem(
            catalogItem,
            parentId,
            order,
          );

          if (next.some((node) => node.id === newNode.id)) {
            continue;
          }

          if (
            catalogItem.kind === "layer" &&
            !isValidLayerParentId(next, parentId)
          ) {
            continue;
          }

          next = [...next, newNode];
        }

        return applyMapLayersSiblingOrder(next);
      });
    },
    [setTreeData],
  );

  const addCatalogItem = useCallback(
    (
      catalogItem: CatalogDragItem,
      dropOptions: {
        dropTargetId: GroupLayerTreeNode["id"];
        dropTarget?: GroupLayerTreeNode;
        relativeIndex?: number;
      },
    ) => {
      setTreeData((current) => {
        const next = insertCatalogItemIntoTree(
          current,
          catalogItem,
          dropOptions,
        );

        if (!next) {
          return current;
        }

        return next;
      });
    },
    [setTreeData],
  );

  const handleCatalogDropToRoot = useCallback(
    (catalogItem: CatalogDragItem) => {
      if (catalogItem.kind === "layer") {
        return;
      }

      addCatalogItem(catalogItem, {
        dropTargetId: GROUP_LAYER_TREE_ROOT_ID,
      });
    },
    [addCatalogItem],
  );

  const canAcceptCatalogDropToRoot = useCallback(
    (item: CatalogDragItem) => item.kind === "group",
    [],
  );

  const handleMoveZoneDropToRoot = useCallback(
    (moveItem: MoveZoneItem) => {
      if (moveItem.kind === "layer") {
        // Draw-order parking keeps the layer in Maplayers — consuming from
        // Flyttzon only clears the park slot (layer reappears in Ritordning).
        if (isLayerStillInMapLayersTree(treeData, moveItem.sourceId)) {
          setMoveZoneItems((current) =>
            current.filter((entry) => entry.key !== moveItem.key),
          );
        }
        return;
      }

      setTreeData((current) => {
        const next = insertMoveZoneSubtreeIntoTree(current, moveItem.nodes, {
          dropTargetId: GROUP_LAYER_TREE_ROOT_ID,
        });
        return next ?? current;
      });
      setMoveZoneItems((current) =>
        current.filter((entry) => entry.key !== moveItem.key),
      );
    },
    [setMoveZoneItems, setTreeData, treeData],
  );

  const canAcceptMoveZoneDropToRoot = useCallback(
    (item: MoveZoneItem) => item.kind === "group",
    [],
  );

  const handleDrop = useCallback(
    (_newTree: GroupLayerTreeNode[], options: MapLayersTreeDropOptions) => {
      const itemType = options.monitor.getItemType();

      if (itemType === CATALOG_DRAG_TYPE) {
        if (backgroundMode) {
          return;
        }
        if (options.dropTargetId == null) {
          return;
        }
        addCatalogItem(options.monitor.getItem() as CatalogDragItem, {
          dropTargetId: options.dropTargetId,
          dropTarget: options.dropTarget,
          relativeIndex: options.relativeIndex,
        });
        return;
      }

      if (itemType === MOVE_ZONE_DRAG_TYPE) {
        const moveItem = options.monitor.getItem() as MoveZoneItem;
        if (
          moveItem.kind === "layer" &&
          isLayerStillInMapLayersTree(treeData, moveItem.sourceId)
        ) {
          setMoveZoneItems((current) =>
            current.filter((entry) => entry.key !== moveItem.key),
          );
          return;
        }
        if (options.dropTargetId == null) {
          return;
        }
        const dropTargetId = options.dropTargetId;
        setTreeData((current) => {
          const next = insertMoveZoneSubtreeIntoTree(current, moveItem.nodes, {
            dropTargetId,
            dropTarget: options.dropTarget,
            relativeIndex: options.relativeIndex,
          });
          return next ?? current;
        });
        setMoveZoneItems((current) =>
          current.filter((entry) => entry.key !== moveItem.key),
        );
        return;
      }

      // Do not trust the library `newTree` flat order for persisted `data.order`.
      // Resolve parent/index like click-place, then restamp sibling order.
      const dragSourceId = options.dragSourceId;
      const dropTargetId = options.dropTargetId;
      if (dragSourceId == null || dropTargetId == null) {
        return;
      }

      setTreeData((current) => {
        const source = current.find((node) => node.id === dragSourceId);
        if (!source) {
          return current;
        }

        const target =
          options.dropTarget ??
          current.find((node) => node.id === dropTargetId);
        const parentId = resolveDropParentId(current, dropTargetId, target);

        if (
          source.data?.kind === "layer" &&
          !isValidLayerParentId(current, parentId)
        ) {
          return current;
        }

        const siblingsBeforeMove = current
          .filter((node) => node.parent === parentId)
          .slice()
          .sort(sortSiblingNodes);
        const siblings = siblingsBeforeMove.filter(
          (node) => node.id !== dragSourceId,
        );

        let index: number;
        if (target?.data?.kind === "layer") {
          // Dropping on a layer row: place after that layer (same as click-place).
          // Placeholder drops use the parent group + relativeIndex instead.
          const targetIndex = siblings.findIndex(
            (node) => node.id === target.id,
          );
          index = targetIndex < 0 ? siblings.length : targetIndex + 1;
        } else {
          index = options.relativeIndex ?? siblings.length;
          // @minoru's relativeIndex is computed while the drag source is still
          // among siblings — when moving down within the same parent, shift back.
          const oldIndex = siblingsBeforeMove.findIndex(
            (node) => node.id === dragSourceId,
          );
          if (oldIndex >= 0 && index > oldIndex) {
            index -= 1;
          }
        }

        return applyMapLayersSiblingOrder(
          moveTreeNodeWithIndex(current, dragSourceId, parentId, index),
        );
      });
    },
    [addCatalogItem, backgroundMode, setMoveZoneItems, setTreeData, treeData],
  );

  const handleDropTreeItemToRoot = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setTreeData((current) => {
        const node = current.find((entry) => entry.id === nodeId);
        if (!node || node.data?.kind !== "group") {
          return current;
        }

        const rootSiblings = current
          .filter((entry) => entry.parent === GROUP_LAYER_TREE_ROOT_ID)
          .slice()
          .sort(sortSiblingNodes);
        const alreadyAtRoot = node.parent === GROUP_LAYER_TREE_ROOT_ID;
        const alreadyLast =
          alreadyAtRoot &&
          rootSiblings.length > 0 &&
          rootSiblings[rootSiblings.length - 1]?.id === node.id;

        // Dropping in the empty area below the list moves the group to the end.
        // No-op when it is already the last root sibling (avoids same-position
        // drops that miss the tree target from reshuffling needlessly).
        if (alreadyLast) {
          return current;
        }

        const remaining = current.filter((entry) => entry.id !== nodeId);
        return applyMapLayersSiblingOrder([
          ...remaining,
          { ...node, parent: GROUP_LAYER_TREE_ROOT_ID },
        ]);
      });
    },
    [setTreeData],
  );

  const canAcceptTreeItemToRoot = useCallback(
    (node: GroupLayerTreeNode) => node.data?.kind === "group",
    [],
  );

  return {
    addCatalogItemsToParent,
    handleCatalogDropToRoot,
    canAcceptCatalogDropToRoot,
    handleMoveZoneDropToRoot,
    canAcceptMoveZoneDropToRoot,
    handleDrop,
    handleDropTreeItemToRoot,
    canAcceptTreeItemToRoot,
  };
}
