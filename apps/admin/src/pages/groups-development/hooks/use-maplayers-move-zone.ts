import { useCallback, type Dispatch, type SetStateAction } from "react";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MoveZoneItem,
} from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";
import {
  insertDrawOrderIdAt,
  isLayerStillInMapLayersTree,
} from "../utils/maplayers-editor";
import { captureTreeMoveZoneOrigin } from "../utils/move-zone-origin";
import {
  createLayerTreeNode,
  createTreeNodeFromCatalogItem,
  extractSubtreeForMoveZone,
  parseTreeNodeSourceId,
} from "../utils/tree-model";

export interface UseMapLayersMoveZoneParams {
  treeData: GroupLayerTreeNode[];
  setTreeData: Dispatch<SetStateAction<GroupLayerTreeNode[]>>;
  moveZoneItems: MoveZoneItem[];
  setMoveZoneItems: Dispatch<SetStateAction<MoveZoneItem[]>>;
  setVisibleIds: Dispatch<SetStateAction<Set<string>>>;
  setDrawOrderOrderedIds: Dispatch<SetStateAction<string[]>>;
  setBackgroundOrderedIds: Dispatch<SetStateAction<string[]>>;
  drawOrderMode: boolean;
  backgroundMode: boolean;
  effectiveDrawOrderOrderedIds: string[];
  effectiveBackgroundOrderedIds: string[];
  layerNames: Map<string, string>;
  placedIds: { groupIds: Set<string>; layerIds: Set<string> };
}

export function useMapLayersMoveZone({
  treeData,
  setTreeData,
  moveZoneItems,
  setMoveZoneItems,
  setVisibleIds,
  setDrawOrderOrderedIds,
  setBackgroundOrderedIds,
  drawOrderMode,
  backgroundMode,
  effectiveDrawOrderOrderedIds,
  effectiveBackgroundOrderedIds,
  layerNames,
  placedIds,
}: UseMapLayersMoveZoneParams) {
  const canAcceptMoveZoneDropToDrawOrder = useCallback(
    (item: MoveZoneItem) =>
      item.kind === "layer" &&
      isLayerStillInMapLayersTree(treeData, item.sourceId),
    [treeData],
  );

  const handleMoveZoneDropToDrawOrder = useCallback(
    (item: MoveZoneItem, insertIndex?: number) => {
      if (!canAcceptMoveZoneDropToDrawOrder(item)) {
        return;
      }

      setDrawOrderOrderedIds((current) =>
        insertDrawOrderIdAt(current, item.sourceId, insertIndex),
      );
      setMoveZoneItems((current) =>
        current.filter((entry) => entry.key !== item.key),
      );
    },
    [
      canAcceptMoveZoneDropToDrawOrder,
      setDrawOrderOrderedIds,
      setMoveZoneItems,
    ],
  );

  const canAcceptMoveZoneDropToBackground = useCallback(
    (item: MoveZoneItem) =>
      item.kind === "layer" &&
      !effectiveBackgroundOrderedIds.includes(item.sourceId),
    [effectiveBackgroundOrderedIds],
  );

  const handleMoveZoneDropToBackground = useCallback(
    (item: MoveZoneItem, insertIndex?: number) => {
      if (!canAcceptMoveZoneDropToBackground(item)) {
        return;
      }

      setBackgroundOrderedIds((current) =>
        insertDrawOrderIdAt(current, item.sourceId, insertIndex),
      );
      setMoveZoneItems((current) =>
        current.filter((entry) => entry.key !== item.key),
      );
    },
    [
      canAcceptMoveZoneDropToBackground,
      setBackgroundOrderedIds,
      setMoveZoneItems,
    ],
  );

  const handleDropToMoveZone = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      // Ritordning: park without removing from Kartlager.
      if (drawOrderMode) {
        const layerId = parseTreeNodeSourceId(nodeId);
        if (!layerId || !isLayerStillInMapLayersTree(treeData, layerId)) {
          return;
        }
        if (!effectiveDrawOrderOrderedIds.includes(layerId)) {
          return;
        }
        if (
          moveZoneItems.some(
            (item) => item.kind === "layer" && item.sourceId === layerId,
          )
        ) {
          return;
        }

        const listIndex = effectiveDrawOrderOrderedIds.indexOf(layerId);
        const name = layerNames.get(layerId) ?? layerId;
        const moveItem: MoveZoneItem = {
          key: `drawOrder:${layerId}:${Date.now()}`,
          kind: "layer",
          sourceId: layerId,
          name,
          nodes: [
            createLayerTreeNode(layerId, name, GROUP_LAYER_TREE_ROOT_ID, 0),
          ],
          origin: {
            parentId: GROUP_LAYER_TREE_ROOT_ID,
            siblingIndex: 0,
            listIndex: listIndex < 0 ? undefined : listIndex,
          },
        };

        setDrawOrderOrderedIds((ids) => ids.filter((id) => id !== layerId));
        setMoveZoneItems((items) => [...items, moveItem]);
        return;
      }

      // Bakgrund: park from the background list (not Kartlager tree).
      if (backgroundMode) {
        const layerId = parseTreeNodeSourceId(nodeId);
        if (!layerId || !effectiveBackgroundOrderedIds.includes(layerId)) {
          return;
        }
        if (
          moveZoneItems.some(
            (item) => item.kind === "layer" && item.sourceId === layerId,
          )
        ) {
          return;
        }

        const listIndex = effectiveBackgroundOrderedIds.indexOf(layerId);
        const name = layerNames.get(layerId) ?? layerId;
        const moveItem: MoveZoneItem = {
          key: `background:${layerId}:${Date.now()}`,
          kind: "layer",
          sourceId: layerId,
          name,
          nodes: [
            createLayerTreeNode(layerId, name, GROUP_LAYER_TREE_ROOT_ID, 0),
          ],
          origin: {
            parentId: GROUP_LAYER_TREE_ROOT_ID,
            siblingIndex: 0,
            listIndex: listIndex < 0 ? undefined : listIndex,
          },
        };

        setBackgroundOrderedIds((ids) => ids.filter((id) => id !== layerId));
        setMoveZoneItems((items) => [...items, moveItem]);
        return;
      }

      const origin = captureTreeMoveZoneOrigin(treeData, nodeId);
      const extracted = extractSubtreeForMoveZone(treeData, nodeId);
      if (!extracted) {
        return;
      }

      const root = extracted.subtree.find(
        (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
      );
      if (!root?.data) {
        return;
      }

      const moveItem: MoveZoneItem = {
        key: `${root.data.kind}:${root.data.sourceId}:${Date.now()}`,
        kind: root.data.kind,
        sourceId: root.data.sourceId,
        name: root.text,
        nodes: extracted.subtree,
        origin,
      };

      setTreeData(extracted.remainingTree);
      setMoveZoneItems((items) => [...items, moveItem]);
      setVisibleIds((visible) => {
        const next = new Set(visible);
        for (const node of extracted.subtree) {
          next.delete(String(node.id));
        }
        return next;
      });
    },
    [
      backgroundMode,
      drawOrderMode,
      effectiveBackgroundOrderedIds,
      effectiveDrawOrderOrderedIds,
      layerNames,
      moveZoneItems,
      setBackgroundOrderedIds,
      setDrawOrderOrderedIds,
      setMoveZoneItems,
      setTreeData,
      setVisibleIds,
      treeData,
    ],
  );

  const canAcceptCatalogDropToMoveZone = useCallback(
    (item: CatalogDragItem) => {
      if (backgroundMode || drawOrderMode) {
        return false;
      }
      if (item.kind === "group") {
        return !placedIds.groupIds.has(item.id);
      }
      return !placedIds.layerIds.has(item.id);
    },
    [backgroundMode, drawOrderMode, placedIds],
  );

  const handleDropCatalogToMoveZone = useCallback(
    (catalogItem: CatalogDragItem) => {
      if (!canAcceptCatalogDropToMoveZone(catalogItem)) {
        return;
      }

      const node = createTreeNodeFromCatalogItem(
        catalogItem,
        GROUP_LAYER_TREE_ROOT_ID,
        0,
      );

      const moveItem: MoveZoneItem = {
        key: `${catalogItem.kind}:${catalogItem.id}:${Date.now()}`,
        kind: catalogItem.kind,
        sourceId: catalogItem.id,
        name: catalogItem.name,
        nodes: [node],
        fromCatalog: true,
      };

      setMoveZoneItems((items) => [...items, moveItem]);
    },
    [canAcceptCatalogDropToMoveZone, setMoveZoneItems],
  );

  return {
    canAcceptMoveZoneDropToDrawOrder,
    handleMoveZoneDropToDrawOrder,
    canAcceptMoveZoneDropToBackground,
    handleMoveZoneDropToBackground,
    handleDropToMoveZone,
    canAcceptCatalogDropToMoveZone,
    handleDropCatalogToMoveZone,
  };
}
