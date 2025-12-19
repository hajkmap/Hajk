import React from "react";
import { SortableTree, TreeItems } from "dnd-kit-sortable-tree";

import { TreeItemData } from "./types";
import { TreeDropZone } from "./tree-drop-zone";
import { TreeItemComponent } from "./tree-item-component";
import {
  enforceItemRules,
  moveItemUp,
  moveItemDown,
  canItemMoveUp,
  canItemMoveDown,
} from "./utils";

interface SortableDropZoneProps {
  id: string;
  title?: string;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  onAddToGroup?: (groupId: string) => void;
  minHeight?: number;
}

export const SortableDropZone: React.FC<SortableDropZoneProps> = ({
  id,
  title,
  items,
  onItemsChange,
  onAddToGroup,
  minHeight,
}) => {
  const handleMoveUp = (itemId: string) => {
    onItemsChange(enforceItemRules(moveItemUp(items, itemId)));
  };

  const handleMoveDown = (itemId: string) => {
    onItemsChange(enforceItemRules(moveItemDown(items, itemId)));
  };

  return (
    <TreeDropZone id={id} title={title} minHeight={minHeight}>
      <SortableTree
        items={items}
        onItemsChanged={(newItems) => onItemsChange(enforceItemRules(newItems))}
        TreeItemComponent={(treeItemProps) => {
          const itemId = treeItemProps.item.id.toString();
          const isGroup = treeItemProps.item.type === "group";

          return (
            <TreeItemComponent
              {...treeItemProps}
              onMoveUp={() => handleMoveUp(itemId)}
              onMoveDown={() => handleMoveDown(itemId)}
              onAdd={
                isGroup && onAddToGroup ? () => onAddToGroup(itemId) : undefined
              }
              canMoveUp={canItemMoveUp(items, itemId)}
              canMoveDown={canItemMoveDown(items, itemId)}
            />
          );
        }}
        keepGhostInPlace
      />
    </TreeDropZone>
  );
};
