import { ItemTypes } from "@minoru/react-dnd-treeview";

import { MOVE_ZONE_DRAG_TYPE } from "./lists/types";
import {
  nodePathKeys,
  type LayerTreeFlatNode,
  type LayerTreeItemKind,
} from "./layer-tree-model";
import type { LayerTreeMapTab } from "./layer-tree-preview-frame";

// The move zone, as in Lagerordning, for moving things far in a long tree or
// list: drop something in the zone, scroll, and drop it from the zone where
// it should go. What is in the zone stays where it lies, flagged, until it is
// dropped somewhere else, so nothing goes missing if it's left there.

/** The drag type Lagerordning's background and draw order panels take. */
export { MOVE_ZONE_DRAG_TYPE };

/** Rows dragged from a tree or a list (they are trees too). */
export const TREE_ITEM_TYPE =
  (ItemTypes as { TREE_ITEM?: string | symbol }).TREE_ITEM ?? "TREE_ITEM";

/** The node id of a dragged tree row, as text. */
export function draggedNodeId(item: unknown): string {
  const id = (item as { id?: unknown } | null)?.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

export interface LayerTreeMoveZoneItem {
  key: string;
  kind: LayerTreeItemKind;
  sourceId: string;
  name: string;
  /** Kartlager: the node in the tree it is flagged on. */
  nodeId?: string;
  /** Bakgrund / Ritordning: the layer is in that list, flagged there. */
  inList?: boolean;
  // Neither: from the catalog, not placed yet.
}

export type MoveZoneByTab = Record<LayerTreeMapTab, LayerTreeMoveZoneItem[]>;

export const EMPTY_MOVE_ZONE: MoveZoneByTab = {
  layers: [],
  background: [],
  drawOrder: [],
};

let lastKey = 0;
export const newMoveZoneKey = () => `mz${Date.now()}-${++lastKey}`;

/** What is in the zone and still where it was, or from the catalog. */
export function pruneMoveZone(
  zones: MoveZoneByTab,
  state: {
    nodes: LayerTreeFlatNode[];
    movable: (node: LayerTreeFlatNode) => boolean;
    backgroundIds: ReadonlySet<string>;
    drawOrderIds: ReadonlySet<string>;
  },
): MoveZoneByTab {
  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  // Catalog items placed meanwhile, e.g. from the catalog itself.
  const placed = new Set(
    state.nodes
      .filter((node) => state.movable(node))
      .map((node) => `${node.data.kind}:${node.data.sourceId}`),
  );
  const keep = (
    items: LayerTreeMoveZoneItem[],
    inList: ReadonlySet<string> | null,
  ) => {
    const next = items.filter((item) => {
      if (item.nodeId !== undefined) {
        const node = byId.get(item.nodeId);
        return node !== undefined && state.movable(node);
      }
      if (inList) {
        return item.inList
          ? inList.has(item.sourceId)
          : !inList.has(item.sourceId);
      }
      return !placed.has(`${item.kind}:${item.sourceId}`);
    });
    return next.length === items.length ? items : next;
  };
  const layers = keep(zones.layers, null);
  const background = keep(zones.background, state.backgroundIds);
  const drawOrder = keep(zones.drawOrder, state.drawOrderIds);
  return layers === zones.layers &&
    background === zones.background &&
    drawOrder === zones.drawOrder
    ? zones
    : { layers, background, drawOrder };
}

// Stored per map; tree items by their path, as node ids change between visits.

type StoredItem = Omit<LayerTreeMoveZoneItem, "nodeId"> & { path?: string };

const storageKey = (mapName: string) =>
  `hajk.admin.layerTree.moveZone.${mapName}`;

const isStoredItem = (value: unknown): value is StoredItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.key === "string" &&
    (item.kind === "group" || item.kind === "layer") &&
    typeof item.sourceId === "string" &&
    typeof item.name === "string"
  );
};

export function loadMoveZone(
  mapName: string,
  nodes: LayerTreeFlatNode[],
): MoveZoneByTab {
  try {
    const raw = window.localStorage.getItem(storageKey(mapName));
    if (!raw) return EMPTY_MOVE_ZONE;
    const stored = JSON.parse(raw) as Partial<Record<LayerTreeMapTab, unknown>>;
    const byPath = new Map(
      [...nodePathKeys(nodes)].map(([nodeId, path]) => [path, nodeId]),
    );
    const read = (tab: LayerTreeMapTab) =>
      (Array.isArray(stored[tab]) ? stored[tab] : [])
        .filter(isStoredItem)
        .flatMap(({ path, ...item }): LayerTreeMoveZoneItem[] => {
          if (path === undefined) return [item];
          const nodeId = byPath.get(path);
          return nodeId ? [{ ...item, nodeId }] : [];
        });
    return {
      layers: read("layers"),
      background: read("background"),
      drawOrder: read("drawOrder"),
    };
  } catch {
    return EMPTY_MOVE_ZONE;
  }
}

export function saveMoveZone(
  mapName: string,
  zones: MoveZoneByTab,
  nodes: LayerTreeFlatNode[],
) {
  const paths = nodePathKeys(nodes);
  const toStored = (items: LayerTreeMoveZoneItem[]): StoredItem[] =>
    items.map(({ nodeId, ...item }) =>
      nodeId === undefined ? item : { ...item, path: paths.get(nodeId) },
    );
  try {
    const key = storageKey(mapName);
    if (
      zones.layers.length + zones.background.length + zones.drawOrder.length ===
      0
    ) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(
      key,
      JSON.stringify({
        layers: toStored(zones.layers),
        background: toStored(zones.background),
        drawOrder: toStored(zones.drawOrder),
      }),
    );
  } catch {
    // Private mode or full storage: the zone still works on this page.
  }
}

/** Moves `id` in an ordered list to before position `index`. */
export function moveInList(ids: string[], id: string, index: number): string[] {
  const was = ids.indexOf(id);
  if (was < 0) return ids;
  const next = ids.filter((other) => other !== id);
  next.splice(was < index ? index - 1 : index, 0, id);
  return next;
}
