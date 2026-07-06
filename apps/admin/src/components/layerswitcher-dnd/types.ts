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
  /** Layer placement: visible in map on load (client layersConfig). */
  visibleAtStart?: boolean;
  /** Group map placement: toggled on in the layer switcher at start. */
  toggled?: boolean;
  /** Group map placement: expanded in the layer switcher at start. */
  expanded?: boolean;
  layerCount?: number;
  nestedGroupCount?: number;
  /** Catalog composition depth — source list only. */
  nestingLevel?: number;
}

export interface DropZoneConfig {
  id: string;
  title: string;
  titleIcon?: React.ReactNode;
  /** Short explanation shown under the zone title. */
  helpText?: string;
  /** Client config target label (e.g. layersConfig, LayerSwitcher groups). */
  clientBucketLabel?: string;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Item types allowed in this zone; defaults to all types present in the source panel. */
  acceptedItemTypes?: ItemType[];
  /** When false, nested items are flattened to the zone root (direct map layers). */
  allowNesting?: boolean;
  /** Show remove button on placed items (returns them to the source list). */
  enableRemove?: boolean;
  /** Layer rows: active chip, draw order, visible-at-start toggle. */
  showLayerPlacementStatus?: boolean;
  /** Group map placement rows: toggled + expanded at start. */
  showGroupPlacementStatus?: boolean;
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
