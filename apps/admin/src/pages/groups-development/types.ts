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

export interface CatalogDragItem {
  kind: GroupLayerNodeKind;
  id: string;
  name: string;
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
  toggled: true,
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
}

export const DEFAULT_LAYER_DISPLAY_SETTINGS: LayerDisplaySettings = {
  layerVisibleAtStart: false,
  layerInfoBox: "",
};

export interface LayerFormValues {
  layerVisibleAtStart: boolean;
  layerInfoBox: string;
}
