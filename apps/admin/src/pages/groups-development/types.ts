import type { NodeModel } from "@minoru/react-dnd-treeview";

export const GROUP_LAYER_TREE_ROOT_ID = "root";

export type GroupLayerNodeKind = "group" | "layer";

export interface GroupLayerNodeData {
  kind: GroupLayerNodeKind;
  sourceId: string;
  order?: number;
}

export type GroupLayerTreeNode = NodeModel<GroupLayerNodeData>;

export const CATALOG_DRAG_TYPE = "GROUP_LAYER_CATALOG_ITEM";

/** Drag type for items parked in the Kartlager Flyttzon. */
export const MOVE_ZONE_DRAG_TYPE = "GROUP_LAYER_MOVE_ZONE_ITEM";

export interface CatalogDragItem {
  kind: GroupLayerNodeKind;
  id: string;
  name: string;
}

/** A group or layer (with subtree) temporarily lifted out of Kartlager. */
export interface MoveZoneItem {
  /** Stable key for React lists / drag identity. */
  key: string;
  kind: GroupLayerNodeKind;
  sourceId: string;
  name: string;
  /** Flat subtree; root node has parent === GROUP_LAYER_TREE_ROOT_ID. */
  nodes: GroupLayerTreeNode[];
}

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
  exclusiveGroup: boolean;
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
  exclusiveGroup: false,
  infoDocument: false,
  metadata: DEFAULT_GROUP_METADATA,
};

export interface GroupFormValues {
  name: string;
  toggled: boolean;
  expanded: boolean;
  exclusiveGroup: boolean;
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

/** Nested group shape for Kartlager / layerswitcher (catalog layer ids). */
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
  exclusiveGroup?: boolean;
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
}

/** Unsaved Kartlager + Bakgrund state (GroupsOnMaps / BACKGROUND instances). */
export interface LayerSwitcherDraft {
  groups: ClientLayerSwitcherGroup[];
  baselayers: {
    layerId: string;
    visibleAtStart?: boolean;
    zIndex?: number;
    infobox?: string;
  }[];
}

/** @deprecated Use LayerSwitcherDraft */
export type KartlagerDraft = LayerSwitcherDraft;
