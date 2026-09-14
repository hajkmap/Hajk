import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MapLayersClickPick,
  MapLayersInteractionMode,
  MoveZoneItem,
} from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";
import {
  filterTreeSelectionRoots,
  getTreeNodeDepth,
  canMoveTreeNodesToClickTarget,
  isValidClickPlaceParentId,
  moveTreeNodesToClickTarget,
  moveTreeNodesToDestination,
  resolveClickPlaceDestination,
  resolveClickPlaceRootDestination,
  type ClickPlaceDestination,
  type ClickPlaceRootEdge,
} from "../utils/click-place";
import { isLayerStillInMapLayersTree } from "../utils/maplayers-editor";
import {
  applyMapLayersSiblingOrder,
  buildChildrenByParentId,
  createTreeNodeFromCatalogItem,
  extractSubtreeForMoveZone,
  getDescendantIds,
  insertCatalogItemIntoTree,
  insertMoveZoneSubtreeIntoTree,
  sortSiblingNodes,
} from "../utils/tree-model";
import type {
  UseMapLayersClickPlaceParams,
  UseMapLayersClickPlaceResult,
} from "./use-maplayers-click-place-types";

export type {
  UseMapLayersClickPlaceParams,
  UseMapLayersClickPlaceResult,
} from "./use-maplayers-click-place-types";

export function useMapLayersClickPlace({
  treeData,
  setTreeData,
  moveZoneItems,
  setMoveZoneItems,
  setVisibleIds,
  backgroundMode,
  drawOrderMode,
  openNodeIds,
  visibleNodeIds,
}: UseMapLayersClickPlaceParams): UseMapLayersClickPlaceResult {
  const [interactionMode, setInteractionMode] =
    useState<MapLayersInteractionMode>("drag");
  const [clickPick, setClickPick] = useState<MapLayersClickPick | null>(null);
  const [hoveredSubtreeRootId, setHoveredSubtreeRootId] = useState<
    GroupLayerTreeNode["id"] | null
  >(null);
  const [rootEdgeHover, setRootEdgeHover] = useState<ClickPlaceRootEdge | null>(
    null,
  );

  const clickMode =
    interactionMode === "click" && !backgroundMode && !drawOrderMode;

  useEffect(() => {
    if (backgroundMode || drawOrderMode) {
      return;
    }

    const isAltKey = (event: KeyboardEvent) =>
      event.key === "Alt" ||
      event.code === "AltLeft" ||
      event.code === "AltRight";

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isAltKey(event) || event.repeat) {
        return;
      }
      // Keep Alt from focusing the browser menu while placing layers.
      event.preventDefault();
      setClickPick(null);
      setInteractionMode((current) => (current === "click" ? "drag" : "click"));
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [backgroundMode, drawOrderMode]);

  useEffect(() => {
    if (!clickMode || clickPick == null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClickPick(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clickMode, clickPick]);

  const handleInteractionModeChange = useCallback(
    (mode: MapLayersInteractionMode) => {
      setInteractionMode(mode);
      setClickPick(null);
    },
    [],
  );

  const clearClickPickAndResetToDrag = useCallback(() => {
    setClickPick(null);
    setInteractionMode("drag");
  }, []);

  const handleCatalogClickPick = useCallback(
    (item: CatalogDragItem, additive: boolean) => {
      setClickPick((current) => {
        if (additive && current?.source === "catalog") {
          const exists = current.items.some(
            (entry) => entry.kind === item.kind && entry.id === item.id,
          );
          const items = exists
            ? current.items.filter(
                (entry) => !(entry.kind === item.kind && entry.id === item.id),
              )
            : [...current.items, item];
          return items.length === 0 ? null : { source: "catalog", items };
        }

        if (
          !additive &&
          current?.source === "catalog" &&
          current.items.length === 1 &&
          current.items[0]?.kind === item.kind &&
          current.items[0]?.id === item.id
        ) {
          return null;
        }

        return { source: "catalog", items: [item] };
      });
    },
    [],
  );

  const placeClickPickOnTreeTarget = useCallback(
    (targetId: GroupLayerTreeNode["id"]) => {
      if (clickPick == null) {
        return false;
      }

      if (clickPick.source === "catalog") {
        const destination = resolveClickPlaceDestination(
          treeData,
          targetId,
          openNodeIds,
        );
        if (!destination) {
          return false;
        }
        let next = treeData;
        let placed = false;
        // Insert in reverse at the same index so the first clicked item ends on top.
        for (const item of [...clickPick.items].reverse()) {
          const inserted = insertCatalogItemIntoTree(next, item, {
            dropTargetId: destination.parentId,
            relativeIndex: destination.index,
          });
          if (inserted) {
            next = inserted;
            placed = true;
          }
        }
        if (!placed) {
          return false;
        }
        setTreeData(applyMapLayersSiblingOrder(next));
        setClickPick(null);
        return true;
      }

      if (clickPick.source === "moveZone") {
        const destination = resolveClickPlaceDestination(
          treeData,
          targetId,
          openNodeIds,
        );
        if (!destination) {
          return false;
        }
        let next = treeData;
        let nextMoveZone = moveZoneItems;
        let placed = false;
        for (const item of [...clickPick.items].reverse()) {
          if (
            item.kind === "layer" &&
            isLayerStillInMapLayersTree(next, item.sourceId)
          ) {
            nextMoveZone = nextMoveZone.filter(
              (entry) => entry.key !== item.key,
            );
            placed = true;
            continue;
          }
          const inserted = insertMoveZoneSubtreeIntoTree(next, item.nodes, {
            dropTargetId: destination.parentId,
            relativeIndex: destination.index,
          });
          if (inserted) {
            next = inserted;
            nextMoveZone = nextMoveZone.filter(
              (entry) => entry.key !== item.key,
            );
            placed = true;
          }
        }
        if (!placed) {
          return false;
        }
        setTreeData(applyMapLayersSiblingOrder(next));
        setMoveZoneItems(nextMoveZone);
        setClickPick(null);
        return true;
      }

      const orderedNodeIds = clickPick.nodes.map((node) => node.nodeId);
      const rootIdSet = new Set(
        filterTreeSelectionRoots(treeData, orderedNodeIds).map((id) =>
          String(id),
        ),
      );
      const rootIds = orderedNodeIds.filter((id) => rootIdSet.has(String(id)));
      // Don't place onto a selected node or its descendant.
      const selected = new Set(rootIds.map((id) => String(id)));
      if (selected.has(String(targetId))) {
        return false;
      }
      for (const rootId of rootIds) {
        if (getDescendantIds(treeData, rootId).has(targetId)) {
          return false;
        }
      }

      const next = moveTreeNodesToClickTarget(
        treeData,
        rootIds,
        targetId,
        openNodeIds,
      );
      if (!next) {
        return false;
      }
      setTreeData(applyMapLayersSiblingOrder(next));
      setClickPick(null);
      return true;
    },
    [
      clickPick,
      moveZoneItems,
      openNodeIds,
      setMoveZoneItems,
      setTreeData,
      treeData,
    ],
  );

  const handleTreeClickInteract = useCallback(
    (nodeId: GroupLayerTreeNode["id"], additive: boolean) => {
      if (!clickMode) {
        return;
      }

      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node) {
        return;
      }

      if (additive) {
        setClickPick((current) => {
          if (current?.source === "tree") {
            const exists = current.nodes.some(
              (entry) => entry.nodeId === nodeId,
            );
            const nodes = exists
              ? current.nodes.filter((entry) => entry.nodeId !== nodeId)
              : [...current.nodes, { nodeId, name: node.text }];
            return nodes.length === 0 ? null : { source: "tree", nodes };
          }
          return {
            source: "tree",
            nodes: [{ nodeId, name: node.text }],
          };
        });
        return;
      }

      if (clickPick != null) {
        if (
          clickPick.source === "tree" &&
          clickPick.nodes.length === 1 &&
          clickPick.nodes[0]?.nodeId === nodeId
        ) {
          setClickPick(null);
          return;
        }
        // Clicking a selected item without Ctrl keeps selection (no place on self).
        if (
          clickPick.source === "tree" &&
          clickPick.nodes.some((entry) => entry.nodeId === nodeId)
        ) {
          return;
        }
        placeClickPickOnTreeTarget(nodeId);
        return;
      }

      setClickPick({
        source: "tree",
        nodes: [{ nodeId, name: node.text }],
      });
    },
    [clickMode, clickPick, placeClickPickOnTreeTarget, treeData],
  );

  const placeClickPickAtDestination = useCallback(
    (destination: ClickPlaceDestination) => {
      if (clickPick == null) {
        return false;
      }

      if (clickPick.source === "catalog") {
        const canPlace = clickPick.items.every((item) =>
          isValidClickPlaceParentId(treeData, destination.parentId, item.kind),
        );
        if (!canPlace) {
          return false;
        }
        let next = treeData;
        let placed = false;
        for (const item of [...clickPick.items].reverse()) {
          const inserted = insertCatalogItemIntoTree(next, item, {
            dropTargetId: destination.parentId,
            relativeIndex: destination.index,
          });
          if (inserted) {
            next = inserted;
            placed = true;
          }
        }
        if (!placed) {
          return false;
        }
        setTreeData(applyMapLayersSiblingOrder(next));
        setClickPick(null);
        setRootEdgeHover(null);
        return true;
      }

      if (clickPick.source === "moveZone") {
        const canPlace = clickPick.items.every((item) => {
          if (
            item.kind === "layer" &&
            isLayerStillInMapLayersTree(treeData, item.sourceId)
          ) {
            return false;
          }
          return isValidClickPlaceParentId(
            treeData,
            destination.parentId,
            item.kind,
          );
        });
        if (!canPlace) {
          return false;
        }
        let next = treeData;
        let nextMoveZone = moveZoneItems;
        let placed = false;
        for (const item of [...clickPick.items].reverse()) {
          if (
            item.kind === "layer" &&
            isLayerStillInMapLayersTree(next, item.sourceId)
          ) {
            nextMoveZone = nextMoveZone.filter(
              (entry) => entry.key !== item.key,
            );
            placed = true;
            continue;
          }
          const inserted = insertMoveZoneSubtreeIntoTree(next, item.nodes, {
            dropTargetId: destination.parentId,
            relativeIndex: destination.index,
          });
          if (inserted) {
            next = inserted;
            nextMoveZone = nextMoveZone.filter(
              (entry) => entry.key !== item.key,
            );
            placed = true;
          }
        }
        if (!placed) {
          return false;
        }
        setTreeData(applyMapLayersSiblingOrder(next));
        setMoveZoneItems(nextMoveZone);
        setClickPick(null);
        setRootEdgeHover(null);
        return true;
      }

      const orderedNodeIds = clickPick.nodes.map((node) => node.nodeId);
      const rootIdSet = new Set(
        filterTreeSelectionRoots(treeData, orderedNodeIds).map((id) =>
          String(id),
        ),
      );
      const rootIds = orderedNodeIds.filter((id) => rootIdSet.has(String(id)));
      const next = moveTreeNodesToDestination(treeData, rootIds, destination);
      if (!next) {
        return false;
      }
      setTreeData(applyMapLayersSiblingOrder(next));
      setClickPick(null);
      setRootEdgeHover(null);
      return true;
    },
    [clickPick, moveZoneItems, setMoveZoneItems, setTreeData, treeData],
  );

  const handleClickPlaceToRootStart = useCallback(() => {
    placeClickPickAtDestination(
      resolveClickPlaceRootDestination(treeData, "start"),
    );
  }, [placeClickPickAtDestination, treeData]);

  const handleClickPlaceToRoot = useCallback(() => {
    placeClickPickAtDestination(
      resolveClickPlaceRootDestination(treeData, "end"),
    );
  }, [placeClickPickAtDestination, treeData]);

  const handleClickPlaceRootEdgeHover = useCallback(
    (edge: ClickPlaceRootEdge | null) => {
      setRootEdgeHover(edge === "start" ? "start" : null);
      if (edge === "start") {
        setHoveredSubtreeRootId(null);
      }
    },
    [],
  );

  const handleClickPlaceRootEndHover = useCallback((hovering: boolean) => {
    if (hovering) {
      setRootEdgeHover(null);
      setHoveredSubtreeRootId(null);
    }
  }, []);

  const handleClickPlaceToMoveZone = useCallback(() => {
    if (clickPick == null) {
      return;
    }
    if (clickPick.source === "moveZone") {
      setClickPick(null);
      return;
    }
    if (clickPick.source === "catalog") {
      const stamp = Date.now();
      const moveItems: MoveZoneItem[] = clickPick.items.map(
        (catalogItem, index) => {
          const node = createTreeNodeFromCatalogItem(
            catalogItem,
            GROUP_LAYER_TREE_ROOT_ID,
            0,
          );
          return {
            key: `${catalogItem.kind}:${catalogItem.id}:${stamp}:${index}`,
            kind: catalogItem.kind,
            sourceId: catalogItem.id,
            name: catalogItem.name,
            nodes: [node],
          };
        },
      );
      setMoveZoneItems((items) => [...items, ...moveItems]);
      setClickPick(null);
      return;
    }

    const rootIds = filterTreeSelectionRoots(
      treeData,
      clickPick.nodes.map((node) => node.nodeId),
    );
    let nextTree = treeData;
    const moveItems: MoveZoneItem[] = [];
    const removedIds = new Set<string>();
    const stamp = Date.now();

    for (const [index, nodeId] of rootIds.entries()) {
      const extracted = extractSubtreeForMoveZone(nextTree, nodeId);
      if (!extracted) {
        continue;
      }
      const root = extracted.subtree.find(
        (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
      );
      if (!root?.data) {
        continue;
      }
      moveItems.push({
        key: `${root.data.kind}:${root.data.sourceId}:${stamp}:${index}`,
        kind: root.data.kind,
        sourceId: root.data.sourceId,
        name: root.text,
        nodes: extracted.subtree,
      });
      for (const node of extracted.subtree) {
        removedIds.add(String(node.id));
      }
      nextTree = extracted.remainingTree;
    }

    if (moveItems.length === 0) {
      return;
    }

    setTreeData(nextTree);
    setMoveZoneItems((items) => [...items, ...moveItems]);
    setVisibleIds((visible) => {
      const next = new Set(visible);
      for (const id of removedIds) {
        next.delete(id);
      }
      return next;
    });
    setClickPick(null);
  }, [clickPick, setMoveZoneItems, setTreeData, setVisibleIds, treeData]);

  const handleMoveZoneClickPick = useCallback(
    (item: MoveZoneItem, additive: boolean) => {
      setClickPick((current) => {
        if (additive && current?.source === "moveZone") {
          const exists = current.items.some((entry) => entry.key === item.key);
          const items = exists
            ? current.items.filter((entry) => entry.key !== item.key)
            : [...current.items, item];
          return items.length === 0 ? null : { source: "moveZone", items };
        }

        if (
          !additive &&
          current?.source === "moveZone" &&
          current.items.length === 1 &&
          current.items[0]?.key === item.key
        ) {
          return null;
        }

        return { source: "moveZone", items: [item] };
      });
    },
    [],
  );

  const clickPickCount = useMemo(() => {
    if (clickPick == null) {
      return 0;
    }
    if (clickPick.source === "catalog" || clickPick.source === "moveZone") {
      return clickPick.items.length;
    }
    return clickPick.nodes.length;
  }, [clickPick]);

  const clickPickLabel = useMemo(() => {
    if (clickPick == null) {
      return null;
    }
    const names =
      clickPick.source === "catalog"
        ? clickPick.items.map((item) => item.name)
        : clickPick.source === "moveZone"
          ? clickPick.items.map((item) => item.name)
          : clickPick.nodes.map((node) => node.name);
    return names[0] ?? null;
  }, [clickPick]);

  const clickPickedRootIds = useMemo(() => {
    if (clickPick?.source !== "tree") {
      return null;
    }
    return filterTreeSelectionRoots(
      treeData,
      clickPick.nodes.map((node) => node.nodeId),
    );
  }, [clickPick, treeData]);

  const clickPickedSubtreeIds = useMemo(() => {
    if (clickPickedRootIds == null) {
      return null;
    }
    const ids = new Set<string>();
    for (const rootId of clickPickedRootIds) {
      ids.add(String(rootId));
      for (const id of getDescendantIds(treeData, rootId)) {
        ids.add(String(id));
      }
    }
    return ids;
  }, [clickPickedRootIds, treeData]);

  const canClickPlaceToRoot = useMemo(() => {
    if (clickPick == null) {
      return false;
    }
    if (clickPick.source === "catalog") {
      return clickPick.items.every((item) => item.kind === "group");
    }
    if (clickPick.source === "moveZone") {
      return clickPick.items.every((item) => item.kind === "group");
    }
    const rootIds = filterTreeSelectionRoots(
      treeData,
      clickPick.nodes.map((node) => node.nodeId),
    );
    if (rootIds.length === 0) {
      return false;
    }
    return rootIds.every((id) => {
      const node = treeData.find((entry) => entry.id === id);
      return node?.data?.kind === "group";
    });
  }, [clickPick, treeData]);

  const clickPickEdgeById = useMemo(() => {
    if (clickPickedRootIds == null || clickPickedSubtreeIds == null) {
      return null;
    }

    const orderedVisible: string[] = [];
    const walk = (parentId: GroupLayerTreeNode["parent"]) => {
      const children = treeData
        .filter((node) => node.parent === parentId)
        .slice()
        .sort(sortSiblingNodes);
      for (const child of children) {
        const id = String(child.id);
        if (visibleNodeIds && !visibleNodeIds.has(id)) {
          continue;
        }
        if (clickPickedSubtreeIds.has(id)) {
          orderedVisible.push(id);
        }
        if (child.data?.kind !== "group") {
          continue;
        }
        const isOpen = openNodeIds == null || openNodeIds.has(id);
        if (isOpen) {
          walk(child.id);
        }
      }
    };
    walk(GROUP_LAYER_TREE_ROOT_ID);

    const edges = new Map<string, "only" | "start" | "middle" | "end">();
    for (const rootId of clickPickedRootIds) {
      const subtree = new Set<string>([String(rootId)]);
      for (const id of getDescendantIds(treeData, rootId)) {
        subtree.add(String(id));
      }
      const ordered = orderedVisible.filter((id) => subtree.has(id));
      ordered.forEach((id, index) => {
        if (ordered.length === 1) {
          edges.set(id, "only");
        } else if (index === 0) {
          edges.set(id, "start");
        } else if (index === ordered.length - 1) {
          edges.set(id, "end");
        } else {
          edges.set(id, "middle");
        }
      });
    }
    return edges;
  }, [
    clickPickedRootIds,
    clickPickedSubtreeIds,
    openNodeIds,
    treeData,
    visibleNodeIds,
  ]);

  const hoveredSubtreeIds = useMemo(() => {
    if (hoveredSubtreeRootId == null) {
      return null;
    }
    const childrenByParent = buildChildrenByParentId(treeData);
    const ids = new Set<string>([String(hoveredSubtreeRootId)]);
    const hoveredNode = treeData.find(
      (entry) => entry.id === hoveredSubtreeRootId,
    );
    // Groups highlight their whole subtree; layers highlight only themselves.
    if (hoveredNode?.data?.kind === "group") {
      for (const id of getDescendantIds(
        treeData,
        hoveredSubtreeRootId,
        childrenByParent,
      )) {
        ids.add(String(id));
      }
    }
    return ids;
  }, [hoveredSubtreeRootId, treeData]);

  const handleMapLayersNodeHover = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setRootEdgeHover(null);
      setHoveredSubtreeRootId((current) =>
        current === nodeId ? current : nodeId,
      );
    },
    [],
  );

  const handleMapLayersTreeMouseLeave = useCallback(() => {
    setHoveredSubtreeRootId(null);
    // Keep root-end hover when the pointer moves into drop-zone padding.
  }, []);

  const canClickPlaceOnTarget = useCallback(
    (targetId: GroupLayerTreeNode["id"]) => {
      if (clickPick == null) {
        return false;
      }
      const target = treeData.find((node) => node.id === targetId);
      if (!target?.data) {
        return false;
      }

      if (clickPick.source === "catalog") {
        const destination = resolveClickPlaceDestination(
          treeData,
          targetId,
          openNodeIds,
        );
        if (!destination) {
          return false;
        }
        return clickPick.items.some((item) =>
          isValidClickPlaceParentId(treeData, destination.parentId, item.kind),
        );
      }

      if (clickPick.source === "moveZone") {
        const destination = resolveClickPlaceDestination(
          treeData,
          targetId,
          openNodeIds,
        );
        if (!destination) {
          return false;
        }
        return clickPick.items.some((item) => {
          if (
            item.kind === "layer" &&
            isLayerStillInMapLayersTree(treeData, item.sourceId)
          ) {
            return false;
          }
          return isValidClickPlaceParentId(
            treeData,
            destination.parentId,
            item.kind,
          );
        });
      }

      const rootIds = filterTreeSelectionRoots(
        treeData,
        clickPick.nodes.map((node) => node.nodeId),
      );
      const selected = new Set(rootIds.map((id) => String(id)));
      if (selected.has(String(targetId))) {
        return false;
      }
      for (const rootId of rootIds) {
        if (getDescendantIds(treeData, rootId).has(targetId)) {
          return false;
        }
      }
      return canMoveTreeNodesToClickTarget(
        treeData,
        rootIds,
        targetId,
        openNodeIds,
      );
    },
    [clickPick, openNodeIds, treeData],
  );

  const rootEdgeNodes = useMemo(() => {
    const roots = treeData
      .filter((node) => node.parent === GROUP_LAYER_TREE_ROOT_ID)
      .slice()
      .sort(sortSiblingNodes)
      .filter((node) => !visibleNodeIds || visibleNodeIds.has(String(node.id)));
    return {
      firstId: roots[0] != null ? String(roots[0].id) : null,
    };
  }, [treeData, visibleNodeIds]);

  /** Blue drop line + optional group highlight while holding a click-pick. */
  const clickPlaceIndicator = useMemo(() => {
    if (!clickMode || clickPick == null) {
      return null;
    }

    if (
      rootEdgeHover === "start" &&
      canClickPlaceToRoot &&
      rootEdgeNodes.firstId != null
    ) {
      return {
        nodeId: rootEdgeNodes.firstId,
        lineDepth: 0,
        position: "before" as const,
      };
    }

    if (
      hoveredSubtreeRootId == null ||
      !canClickPlaceOnTarget(hoveredSubtreeRootId)
    ) {
      return null;
    }

    const destination = resolveClickPlaceDestination(
      treeData,
      hoveredSubtreeRootId,
      openNodeIds,
    );
    if (!destination) {
      return null;
    }

    if (destination.nestsIntoGroup) {
      return {
        nodeId: String(hoveredSubtreeRootId),
        lineDepth: getTreeNodeDepth(treeData, hoveredSubtreeRootId) + 1,
        position: "after" as const,
      };
    }

    return {
      nodeId: String(hoveredSubtreeRootId),
      lineDepth: getTreeNodeDepth(treeData, hoveredSubtreeRootId),
      position: "after" as const,
    };
  }, [
    canClickPlaceOnTarget,
    canClickPlaceToRoot,
    clickMode,
    clickPick,
    hoveredSubtreeRootId,
    openNodeIds,
    rootEdgeHover,
    rootEdgeNodes.firstId,
    treeData,
  ]);

  return {
    interactionMode,
    clickPick,
    setClickPick,
    clickMode,
    handleInteractionModeChange,
    clearClickPickAndResetToDrag,
    handleCatalogClickPick,
    handleTreeClickInteract,
    handleClickPlaceToRoot,
    handleClickPlaceToRootStart,
    handleClickPlaceRootEdgeHover,
    handleClickPlaceRootEndHover,
    handleClickPlaceToMoveZone,
    handleMoveZoneClickPick,
    clickPickCount,
    clickPickLabel,
    clickPickedSubtreeIds,
    canClickPlaceToRoot,
    clickPickEdgeById,
    hoveredSubtreeIds,
    handleMapLayersNodeHover,
    handleMapLayersTreeMouseLeave,
    clickPlaceIndicator,
  };
}
