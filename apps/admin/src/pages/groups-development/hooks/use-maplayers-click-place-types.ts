import type { Dispatch, SetStateAction } from "react";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MapLayersClickPick,
  MapLayersInteractionMode,
  MoveZoneItem,
} from "../types";

export interface UseMapLayersClickPlaceParams {
  treeData: GroupLayerTreeNode[];
  setTreeData: Dispatch<SetStateAction<GroupLayerTreeNode[]>>;
  moveZoneItems: MoveZoneItem[];
  setMoveZoneItems: Dispatch<SetStateAction<MoveZoneItem[]>>;
  setVisibleIds: Dispatch<SetStateAction<Set<string>>>;
  backgroundMode: boolean;
  drawOrderMode: boolean;
  openNodeIds: Set<string> | null;
  visibleNodeIds: Set<string> | null;
}

export interface UseMapLayersClickPlaceResult {
  interactionMode: MapLayersInteractionMode;
  clickPick: MapLayersClickPick | null;
  setClickPick: Dispatch<SetStateAction<MapLayersClickPick | null>>;
  clickMode: boolean;
  handleInteractionModeChange: (mode: MapLayersInteractionMode) => void;
  clearClickPickAndResetToDrag: () => void;
  handleCatalogClickPick: (item: CatalogDragItem, additive: boolean) => void;
  handleTreeClickInteract: (
    nodeId: GroupLayerTreeNode["id"],
    additive: boolean,
  ) => void;
  handleClickPlaceToRoot: () => void;
  handleClickPlaceToMoveZone: () => void;
  handleMoveZoneClickPick: (item: MoveZoneItem, additive: boolean) => void;
  clickPickCount: number;
  clickPickLabel: string | null;
  clickPickedSubtreeIds: Set<string> | null;
  canClickPlaceToRoot: boolean;
  clickPickEdgeById: Map<
    string,
    "only" | "start" | "middle" | "end"
  > | null;
  hoveredSubtreeIds: Set<string> | null;
  handleMapLayersNodeHover: (nodeId: GroupLayerTreeNode["id"]) => void;
  handleMapLayersTreeMouseLeave: () => void;
  clickPlaceIndicator: {
    afterNodeId: string;
    lineDepth: number;
  } | null;
}
