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
  handleClickPlaceToRootStart: () => void;
  handleClickPlaceRootEdgeHover: (
    edge: "start" | "end" | null,
  ) => void;
  handleClickPlaceRootEndHover: (hovering: boolean) => void;
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
    nodeId: string;
    lineDepth: number;
    position: "before" | "after";
  } | null;
}
