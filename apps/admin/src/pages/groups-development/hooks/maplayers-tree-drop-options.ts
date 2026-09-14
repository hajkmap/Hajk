import type { GroupLayerTreeNode } from "../types";

/** Local drop-options shape — avoids importing @minoru types into callers. */
export interface MapLayersTreeDropOptions {
  dropTargetId?: GroupLayerTreeNode["id"];
  dropTarget?: GroupLayerTreeNode;
  relativeIndex?: number;
  dragSourceId?: GroupLayerTreeNode["id"];
  monitor: {
    getItemType: () => string | symbol | null;
    getItem: () => unknown;
  };
}
