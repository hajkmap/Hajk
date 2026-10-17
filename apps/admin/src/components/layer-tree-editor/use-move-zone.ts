import { useEffect, useMemo, useState } from "react";

import type { MapBackgroundLayer } from "../../api/layer-tree";
import { CATALOG_DRAG_TYPE } from "./lists/types";
import {
  isMovable,
  LAYER_TREE_CATALOG_DRAG_TYPE,
  type LayerTreeCatalogItem,
  type LayerTreeFlatNode,
} from "./layer-tree-model";
import {
  draggedNodeId,
  EMPTY_MOVE_ZONE,
  loadMoveZone,
  moveInList,
  newMoveZoneKey,
  pruneMoveZone,
  saveMoveZone,
  TREE_ITEM_TYPE,
  type LayerTreeMoveZoneItem,
  type MoveZoneByTab,
} from "./layer-tree-move-zone";
import type { LayerTreeMapTab } from "./layer-tree-preview-frame";
import type { LayerTreeClickPick } from "./use-click-place";

/** What a zone item is to the panels that take it: its key and what it is. */
interface DroppedItem {
  key: string;
  kind: string;
  sourceId: string;
}

/** Lagerordning's list rows carry "layer:<id>" as their node ids. */
const listLayerId = (nodeId: string) => nodeId.replace(/^(group|layer):/, "");

interface UseMoveZoneOptions {
  /** Map mode, with a place for the zone; otherwise there is none. */
  enabled: boolean;
  /** The tree is loaded, so flagged nodes can be found again. */
  ready: boolean;
  mapName: string;
  tab: LayerTreeMapTab;
  nodes: LayerTreeFlatNode[];
  background: MapBackgroundLayer[];
  drawOrder: string[];
  /** Names of the layers in the draw order. */
  layerNames: Map<string, string>;
  disabled: boolean;
  onBackgroundChange: (background: MapBackgroundLayer[]) => void;
  onDrawOrderChange: (drawOrder: string[]) => void;
}

/**
 * The move zone's content per tab of the map's editor, kept in the browser
 * per map. Items stay where they lie, flagged, until they are dropped from
 * the zone; what is no longer where it was drops out of the zone.
 */
export function useMoveZone({
  enabled,
  ready,
  mapName,
  tab,
  nodes,
  background,
  drawOrder,
  layerNames,
  disabled,
  onBackgroundChange,
  onDrawOrderChange,
}: UseMoveZoneOptions) {
  const [loaded, setLoaded] = useState<{
    mapName: string;
    zones: MoveZoneByTab;
  } | null>(null);
  if (enabled && ready && loaded?.mapName !== mapName) {
    setLoaded({ mapName, zones: loadMoveZone(mapName, nodes) });
  }

  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const movable = useMemo(
    () => (node: LayerTreeFlatNode) =>
      isMovable(node, byId.get(node.parent), "map"),
    [byId],
  );
  const backgroundIds = useMemo(
    () => new Set(background.map((entry) => entry.layerId)),
    [background],
  );
  const drawOrderIds = useMemo(() => new Set(drawOrder), [drawOrder]);

  const stored =
    enabled && loaded?.mapName === mapName ? loaded.zones : EMPTY_MOVE_ZONE;
  const zones = useMemo(
    () =>
      pruneMoveZone(stored, { nodes, movable, backgroundIds, drawOrderIds }),
    [stored, nodes, movable, backgroundIds, drawOrderIds],
  );

  useEffect(() => {
    if (enabled && ready && loaded?.mapName === mapName) {
      saveMoveZone(mapName, zones, nodes);
    }
  }, [enabled, ready, loaded?.mapName, mapName, zones, nodes]);

  const update = (
    change: (items: LayerTreeMoveZoneItem[]) => LayerTreeMoveZoneItem[],
    forTab: LayerTreeMapTab = tab,
  ) =>
    setLoaded({
      mapName,
      zones: { ...zones, [forTab]: change(zones[forTab]) },
    });
  const remove = (key: string, forTab: LayerTreeMapTab = tab) =>
    update((items) => items.filter((item) => item.key !== key), forTab);

  const items = zones[tab];
  const placedKeys = new Set(
    nodes
      .filter((node) => movable(node))
      .map((node) => `${node.data.kind}:${node.data.sourceId}`),
  );

  const canAccept = (item: unknown, type: string | symbol | null) => {
    if (disabled) return false;
    if (type === TREE_ITEM_TYPE) {
      const id = draggedNodeId(item);
      if (tab === "layers") {
        const node = byId.get(id);
        return (
          node !== undefined &&
          movable(node) &&
          !items.some((entry) => entry.nodeId === id)
        );
      }
      const layerId = listLayerId(id);
      const list = tab === "background" ? backgroundIds : drawOrderIds;
      return (
        list.has(layerId) &&
        !items.some((entry) => entry.inList && entry.sourceId === layerId)
      );
    }
    if (type === LAYER_TREE_CATALOG_DRAG_TYPE && tab === "layers") {
      const { kind, id } = item as LayerTreeCatalogItem;
      return (
        !placedKeys.has(`${kind}:${id}`) &&
        !items.some(
          (entry) =>
            entry.nodeId === undefined &&
            entry.kind === kind &&
            entry.sourceId === id,
        )
      );
    }
    // The background tab's catalog drags as Lagerordning's catalog did.
    if (type === CATALOG_DRAG_TYPE && tab === "background") {
      const { kind, id } = item as { kind: string; id: string };
      return (
        kind === "layer" &&
        !backgroundIds.has(id) &&
        !items.some((entry) => !entry.inList && entry.sourceId === id)
      );
    }
    return false;
  };

  const accept = (item: unknown, type: string | symbol | null) => {
    if (!canAccept(item, type)) return;
    let entry: LayerTreeMoveZoneItem;
    if (type === TREE_ITEM_TYPE && tab === "layers") {
      const node = byId.get(draggedNodeId(item));
      if (!node) return;
      entry = {
        key: newMoveZoneKey(),
        kind: node.data.kind,
        sourceId: node.data.sourceId,
        name: node.text,
        nodeId: node.id,
      };
    } else if (type === TREE_ITEM_TYPE) {
      const layerId = listLayerId(draggedNodeId(item));
      entry = {
        key: newMoveZoneKey(),
        kind: "layer",
        sourceId: layerId,
        name:
          (tab === "background"
            ? background.find((row) => row.layerId === layerId)?.name
            : layerNames.get(layerId)) ?? layerId,
        inList: true,
      };
    } else {
      const { kind, id, name } = item as LayerTreeCatalogItem;
      entry = { key: newMoveZoneKey(), kind, sourceId: id, name };
    }
    update((current) => [...current, entry]);
  };

  /** The item in this tab's zone that a panel was handed. */
  const entryOf = (item: DroppedItem, forTab: LayerTreeMapTab) =>
    zones[forTab].find((entry) => entry.key === item.key);

  const backgroundDrop = {
    canAcceptMoveZoneItem: (item: DroppedItem) => {
      const entry = entryOf(item, "background");
      if (entry?.kind !== "layer" || disabled) return false;
      return entry.inList
        ? backgroundIds.has(entry.sourceId)
        : !backgroundIds.has(entry.sourceId);
    },
    onMoveZoneDrop: (item: DroppedItem, insertIndex?: number) => {
      const entry = entryOf(item, "background");
      if (!entry) return;
      const index = insertIndex ?? background.length;
      if (entry.inList) {
        const order = moveInList(
          background.map((row) => row.layerId),
          entry.sourceId,
          index,
        );
        onBackgroundChange(
          order.flatMap(
            (id) => background.find((row) => row.layerId === id) ?? [],
          ),
        );
      } else {
        const next = [...background];
        next.splice(index, 0, {
          layerId: entry.sourceId,
          name: entry.name,
          visibleAtStart: false,
          infobox: "",
        });
        onBackgroundChange(next);
      }
      remove(entry.key, "background");
    },
  };

  const drawOrderDrop = {
    canAcceptMoveZoneItem: (item: DroppedItem) => {
      const entry = entryOf(item, "drawOrder");
      return (
        !disabled && entry?.inList === true && drawOrderIds.has(entry.sourceId)
      );
    },
    onMoveZoneDrop: (item: DroppedItem, insertIndex?: number) => {
      const entry = entryOf(item, "drawOrder");
      if (!entry) return;
      onDrawOrderChange(
        moveInList(drawOrder, entry.sourceId, insertIndex ?? drawOrder.length),
      );
      remove(entry.key, "drawOrder");
    },
  };

  return {
    items,
    /** Kartlager: the nodes flagged as in the zone. */
    flaggedNodeIds: new Set(
      zones.layers.flatMap((entry) => entry.nodeId ?? []),
    ),
    /** Bakgrund / Ritordning: the layers flagged in that list. */
    flaggedBackgroundIds: new Set(
      zones.background.filter((entry) => entry.inList).map((e) => e.sourceId),
    ),
    flaggedDrawOrderIds: new Set(
      zones.drawOrder.filter((entry) => entry.inList).map((e) => e.sourceId),
    ),
    canAccept,
    accept,
    remove: (key: string) => remove(key),
    /** Kartlager: an item was dropped from the zone where it goes. */
    placed: (key: string) => remove(key, "layers"),
    /** Kartlager: items held from the zone were placed by click. */
    placedMany: (keys: string[]) =>
      update(
        (current) => current.filter((item) => !keys.includes(item.key)),
        "layers",
      ),
    /** Kartlager: click and place puts what is held in the zone. */
    hold: (pick: LayerTreeClickPick) => {
      const entries: LayerTreeMoveZoneItem[] =
        pick.source === "tree"
          ? pick.nodeIds.flatMap((id) => {
              const node = byId.get(id);
              return node &&
                movable(node) &&
                !zones.layers.some((entry) => entry.nodeId === id)
                ? [
                    {
                      key: newMoveZoneKey(),
                      kind: node.data.kind,
                      sourceId: node.data.sourceId,
                      name: node.text,
                      nodeId: id,
                    },
                  ]
                : [];
            })
          : pick.source === "catalog"
            ? pick.items
                .filter(
                  (item) =>
                    !placedKeys.has(`${item.kind}:${item.id}`) &&
                    !zones.layers.some(
                      (entry) =>
                        entry.nodeId === undefined &&
                        entry.kind === item.kind &&
                        entry.sourceId === item.id,
                    ),
                )
                .map((item) => ({
                  key: newMoveZoneKey(),
                  kind: item.kind,
                  sourceId: item.id,
                  name: item.name,
                }))
            : [];
      if (entries.length > 0) {
        update((current) => [...current, ...entries], "layers");
      }
    },
    backgroundDrop,
    drawOrderDrop,
  };
}
