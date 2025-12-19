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
}

export interface DropZoneConfig {
  id: string;
  title: string;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
}

export interface LayerSwitcherDnDProps {
  layers?: SourceItem[];
  groups?: SourceItem[];
  tools?: SourceItem[];
  dropZones: DropZoneConfig[];
}

// Use a delimiter unlikely to appear in IDs
export const ID_DELIMITER = "::";

export const ITEM_CAPABILITIES: Record<ItemType, { canHaveChildren: boolean }> =
  {
    group: { canHaveChildren: true },
    layer: { canHaveChildren: false },
    tool: { canHaveChildren: false },
  };
