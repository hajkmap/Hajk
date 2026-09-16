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
export interface MoveZoneItem {
  /** Stable key for React lists / drag identity. */
  key: string;
  kind: GroupLayerNodeKind;
  sourceId: string;
  name: string;
  /** Flat subtree; root node has parent === GROUP_LAYER_TREE_ROOT_ID. */
  nodes: GroupLayerTreeNode[];
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
  drawOrder?: number;
  visibleAtStart?: boolean;
  infobox?: string;
}

export interface ClientLayerSwitcherGroup {
  id: string;
  type?: string;
  name: string;
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
   * Interleaved Lagerordning sibling order (layers + nested groups).
   * Admin/API only — tools.options still uses layers[] + groups[].
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
