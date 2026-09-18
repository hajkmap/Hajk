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

/** How the user places items into the map-layers tree. */
export type MapLayersInteractionMode = "drag" | "click";

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

/** Items currently held in click-and-drop mode (supports multi-select via Ctrl). */
export type MapLayersClickPick =
  | { source: "catalog"; items: CatalogDragItem[] }
  | {
      source: "tree";
      nodes: { nodeId: GroupLayerTreeNode["id"]; name: string }[];
    }
  | { source: "moveZone"; items: MoveZoneItem[] };

export interface GroupMetadataSettings {
  title: string;
  description: string;
  owner: string;
  url: string;
  urlTitle: string;
  urlOpenData: string;
}

export interface GroupDisplaySettings {
  toggled: boolean;
  expanded: boolean;
  exclusive: boolean;
  infoDocument: boolean;
  metadata: GroupMetadataSettings;
}

export const DEFAULT_GROUP_METADATA: GroupMetadataSettings = {
  title: "",
  description: "",
  owner: "",
  url: "",
  urlTitle: "",
  urlOpenData: "",
};

export const DEFAULT_GROUP_DISPLAY_SETTINGS: GroupDisplaySettings = {
  toggled: false,
  expanded: false,
  exclusive: false,
  infoDocument: false,
  metadata: DEFAULT_GROUP_METADATA,
};

export interface GroupFormValues {
  name: string;
  toggled: boolean;
  expanded: boolean;
  exclusive: boolean;
  infoDocument: boolean;
  metadata: GroupMetadataSettings;
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

/** Nested group shape for Maplayers / layerswitcher (catalog layer ids). */
export interface ClientLayerSwitcherLayerRef {
  id: string;
  /**
   * Sibling position among this group's mixed children (layers + nested groups).
   * Used instead of a separate layerSwitcherTree in Tool.options.
   */
  index?: number;
  drawOrder?: number;
  visibleAtStart?: boolean;
  infobox?: string;
}

export interface ClientLayerSwitcherGroup {
  id: string;
  type?: string;
  name: string;
  /** Sibling position among parent's mixed children (layers + nested groups). */
  index?: number;
  toggled?: boolean;
  expanded?: boolean;
  exclusive?: boolean;
  parent?: string;
  infogroupvisible?: boolean;
  infogrouptitle?: string;
  infogrouptext?: string;
  infogroupurl?: string;
  infogroupurltext?: string;
  infogroupopendatalink?: string;
  infogroupowner?: string;
  layers?: ClientLayerSwitcherLayerRef[];
  groups?: ClientLayerSwitcherGroup[];
  /**
   * @deprecated Prefer `index` on layers/groups. Kept for older map API payloads.
   */
  layerSwitcherTree?: (
    | { type: "layer"; id: string }
    | { type: "group"; id: string }
  )[];
}

/** Unsaved Maplayers + Background state (GroupsOnMaps / BACKGROUND instances). */
export interface LayerSwitcherDraft {
  groups: ClientLayerSwitcherGroup[];
  baselayers: {
    layerId: string;
    visibleAtStart?: boolean;
    zIndex?: number;
    infobox?: string;
  }[];
}

/** Alias used by the map-layers editor draft plumbing. */
export type MapLayersDraft = LayerSwitcherDraft;
