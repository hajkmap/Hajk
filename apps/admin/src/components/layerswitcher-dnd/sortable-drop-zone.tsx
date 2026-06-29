import React from "react";
import { Box } from "@mui/material";
import { SortableTree, TreeItems } from "dnd-kit-sortable-tree";
import { useTranslation } from "react-i18next";

import { TreeItemData } from "./types";
import { TreeDropZone } from "./tree-drop-zone";
import { TreeItemComponent } from "./tree-item-component";
import {
  enforceItemRules,
  moveItemUp,
  moveItemDown,
  canItemMoveUp,
  canItemMoveDown,
  removeItemFromTree,
  updateItemInTree,
  DND_TREE_SORTABLE_OVERRIDES_SX,
} from "./utils";

interface SortableDropZoneProps {
  id: string;
  title?: string;
  titleIcon?: React.ReactNode;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  onAddToGroup?: (groupId: string) => void;
  minHeight?: number;
  enableRemove?: boolean;
  showLayerPlacementStatus?: boolean;
}

export const SortableDropZone: React.FC<SortableDropZoneProps> = ({
  id,
  title,
  titleIcon,
  items,
  onItemsChange,
  onAddToGroup,
  minHeight,
  enableRemove = true,
  showLayerPlacementStatus = false,
}) => {
  const { t } = useTranslation();

  const handleMoveUp = (itemId: string) => {
    onItemsChange(enforceItemRules(moveItemUp(items, itemId)));
  };

  const handleMoveDown = (itemId: string) => {
    onItemsChange(enforceItemRules(moveItemDown(items, itemId)));
  };

  const handleRemove = (itemId: string) => {
    onItemsChange(enforceItemRules(removeItemFromTree(items, itemId)));
  };

  const handleToggleVisibleAtStart = (itemId: string, visible: boolean) => {
    onItemsChange(
      enforceItemRules(
        updateItemInTree(items, itemId, (item) => ({
          ...item,
          visibleAtStart: visible,
        })),
      ),
    );
  };

  const topLevelIndexById = new Map(
    items.map((item, index) => [item.id.toString(), index]),
  );

  return (
    <TreeDropZone id={id} title={title} titleIcon={titleIcon} minHeight={minHeight}>
      <Box sx={DND_TREE_SORTABLE_OVERRIDES_SX}>
        <SortableTree
          items={items}
          onItemsChanged={(newItems) =>
            onItemsChange(enforceItemRules(newItems))
          }
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
                onRemove={
                  enableRemove
                    ? () => handleRemove(itemId)
                    : treeItemProps.onRemove
                }
                canMoveUp={canItemMoveUp(items, itemId)}
                canMoveDown={canItemMoveDown(items, itemId)}
                drawOrderIndex={topLevelIndexById.get(itemId)}
                showLayerPlacementStatus={showLayerPlacementStatus}
                onToggleVisibleAtStart={(visible) =>
                  handleToggleVisibleAtStart(itemId, visible)
                }
                removeTitle={t("map.removeFromMap")}
              />
            );
          }}
          keepGhostInPlace
        />
      </Box>
    </TreeDropZone>
  );
};
