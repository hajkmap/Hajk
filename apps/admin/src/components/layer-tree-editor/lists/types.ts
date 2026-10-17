export const GROUP_LAYER_TREE_ROOT_ID = "root";

export type GroupLayerNodeKind = "group" | "layer";

export interface GroupLayerNodeData {
  kind: GroupLayerNodeKind;
  sourceId: string;
  order?: number;
}

/**
 * Flat tree node for the map-layers editor.
 * Kept independent of @minoru/react-dnd-treeview so UI hooks and Tree JSX
 * can be type-checked in separate modules without collapsing to `error`.
 */
export interface GroupLayerTreeNode {
  id: string | number;
  parent: string | number;
  text: string;
  droppable?: boolean;
  data?: GroupLayerNodeData;
}

export const CATALOG_DRAG_TYPE = "GROUP_LAYER_CATALOG_ITEM";

/** Drag type for items parked in the Maplayers Move Zone. */
export const MOVE_ZONE_DRAG_TYPE = "GROUP_LAYER_MOVE_ZONE_ITEM";

export interface CatalogDragItem {
  kind: GroupLayerNodeKind;
  id: string;
  name: string;
}

/** A group or layer (with subtree) temporarily lifted out of the map-layers tree. */
export interface MoveZoneItemOrigin {
  /** Parent in Kartlager before the item was lifted (or root). */
  parentId: GroupLayerTreeNode["parent"];
  /** Sibling index under that parent before the item was lifted. */
  siblingIndex: number;
  /** Index in Bakgrund / Ritordning ordered list when parked from those tabs. */
  listIndex?: number;
}

export interface MoveZoneItem {
  /** Stable key for React lists / drag identity. */
  key: string;
  kind: GroupLayerNodeKind;
  sourceId: string;
  name: string;
  /** Flat subtree; root node has parent === GROUP_LAYER_TREE_ROOT_ID. */
  nodes: GroupLayerTreeNode[];
  /** Used to restore position when placing the item back from Flyttzon. */
  origin?: MoveZoneItemOrigin;
  /** Catalog drops were never placed in the tree. */
  fromCatalog?: boolean;
}

export interface LayerDisplaySettings {
  layerVisibleAtStart: boolean;
  layerInfoBox: string;
  drawOrder?: number;
}

export const DEFAULT_LAYER_DISPLAY_SETTINGS: LayerDisplaySettings = {
  layerVisibleAtStart: false,
  layerInfoBox: "",
  drawOrder: 1000,
};

export interface LayerFormValues {
  layerVisibleAtStart: boolean;
  layerInfoBox: string;
}
