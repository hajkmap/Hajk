import React from "react";
import { TreeItems } from "dnd-kit-sortable-tree";

export type ItemType = "group" | "layer" | "tool";

export interface SourceItem {
  id: string;
  name: string;
}

export interface TreeItemData {
  id: string;
  name: string;
  type: ItemType;
  /** Layer placement: visible in map on load (client config). */
  visibleAtStart?: boolean;
}

export interface DropZoneConfig {
  id: string;
  title: string;
  titleIcon?: React.ReactNode;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Show remove button on placed items (returns them to the source list). */
  enableRemove?: boolean;
  /** Layer rows: active chip, draw order, visible-at-start toggle. */
  showLayerPlacementStatus?: boolean;
}

export interface LayerSwitcherDnDProps {
  layers?: SourceItem[];
  groups?: SourceItem[];
  tools?: SourceItem[];
  dropZones: DropZoneConfig[];
  /** Show "inactive" chip on layers still available in the source list. */
  showSourceLayerStatus?: boolean;
}

// Use a delimiter unlikely to appear in IDs
export const ID_DELIMITER = "::";

export const ITEM_CAPABILITIES: Record<ItemType, { canHaveChildren: boolean }> =
  {
    group: { canHaveChildren: true },
    layer: { canHaveChildren: false },
    tool: { canHaveChildren: false },
  };
