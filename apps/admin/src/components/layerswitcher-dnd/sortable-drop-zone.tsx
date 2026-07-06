import React from "react";
import { Box } from "@mui/material";
import { SortableTree, TreeItems } from "dnd-kit-sortable-tree";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { TreeItemData } from "./types";
import { TreeDropZone } from "./tree-drop-zone";
import { TreeItemComponent } from "./tree-item-component";
import {
  enforceZoneRules,
  moveItemUp,
  moveItemDown,
  canItemMoveUp,
  canItemMoveDown,
  removeItemFromTree,
  updateItemInTree,
  getSortableTreePanelSx,
} from "./utils";
import type { ItemType } from "./types";

interface SortableDropZoneProps {
  id: string;
  title?: string;
  titleIcon?: React.ReactNode;
  helpText?: string;
  clientBucketLabel?: string;
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  acceptedItemTypes?: ItemType[];
  allowNesting?: boolean;
  onAddToGroup?: (groupId: string) => void;
  minHeight?: number;
  enableRemove?: boolean;
  showLayerPlacementStatus?: boolean;
  showGroupPlacementStatus?: boolean;
}

export const SortableDropZone: React.FC<SortableDropZoneProps> = ({
  id,
  title,
  titleIcon,
  helpText,
  clientBucketLabel,
  items,
  onItemsChange,
  acceptedItemTypes,
  allowNesting,
  onAddToGroup,
  minHeight,
  enableRemove = true,
  showLayerPlacementStatus = false,
  showGroupPlacementStatus = false,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const applyZoneRules = (nextItems: TreeItems<TreeItemData>) =>
    onItemsChange(
      enforceZoneRules(nextItems, { acceptedItemTypes, allowNesting }),
    );

  const handleMoveUp = (itemId: string) => {
    applyZoneRules(moveItemUp(items, itemId));
  };

  const handleMoveDown = (itemId: string) => {
    applyZoneRules(moveItemDown(items, itemId));
  };

  const handleRemove = (itemId: string) => {
    applyZoneRules(removeItemFromTree(items, itemId));
  };

  const handleToggleVisibleAtStart = (itemId: string, visible: boolean) => {
    applyZoneRules(
      updateItemInTree(items, itemId, (item) => ({
        ...item,
        visibleAtStart: visible,
      })),
    );
  };

  const handleToggleToggled = (itemId: string, toggled: boolean) => {
    applyZoneRules(
      updateItemInTree(items, itemId, (item) => ({
        ...item,
        toggled,
      })),
    );
  };

  const handleToggleExpanded = (itemId: string, expanded: boolean) => {
    applyZoneRules(
      updateItemInTree(items, itemId, (item) => ({
        ...item,
        expanded,
      })),
    );
  };

  const layerDrawOrderById = new Map(
    items
      .filter((item) => item.type === "layer")
      .map((item, index) => [item.id.toString(), index]),
  );

  const topLevelIndexById = new Map(
    items.map((item, index) => [item.id.toString(), index]),
  );

  return (
    <TreeDropZone
      id={id}
      title={title}
      titleIcon={titleIcon}
      helpText={helpText}
      clientBucketLabel={clientBucketLabel}
      minHeight={minHeight}
    >
      <Box
        sx={{
          ...getSortableTreePanelSx(isDarkMode),
          ...(allowNesting === false
            ? {
                "& .dnd-sortable-tree_simple_tree-item-collapse_button": {
                  display: "none",
                },
              }
            : {}),
        }}
      >
        <SortableTree
          items={items}
          onItemsChanged={(newItems) => applyZoneRules(newItems)}
          keepGhostInPlace
          indentationWidth={allowNesting === false ? 0 : 20}
          canRootHaveChildren={allowNesting === false ? false : undefined}
          TreeItemComponent={(treeItemProps) => {
            const itemId = treeItemProps.item.id.toString();
            const isGroup = treeItemProps.item.type === "group";

            return (
              <TreeItemComponent
                {...treeItemProps}
                onMoveUp={() => handleMoveUp(itemId)}
                onMoveDown={() => handleMoveDown(itemId)}
                onAdd={
                  isGroup && onAddToGroup
                    ? () => onAddToGroup(itemId)
                    : undefined
                }
                onRemove={
                  enableRemove
                    ? () => handleRemove(itemId)
                    : treeItemProps.onRemove
                }
                canMoveUp={canItemMoveUp(items, itemId)}
                canMoveDown={canItemMoveDown(items, itemId)}
                drawOrderIndex={
                  showLayerPlacementStatus &&
                  treeItemProps.item.type === "layer"
                    ? layerDrawOrderById.get(itemId)
                    : topLevelIndexById.get(itemId)
                }
                showLayerPlacementStatus={showLayerPlacementStatus}
                showGroupPlacementStatus={showGroupPlacementStatus}
                onToggleVisibleAtStart={(visible) =>
                  handleToggleVisibleAtStart(itemId, visible)
                }
                onToggleToggled={(toggled) =>
                  handleToggleToggled(itemId, toggled)
                }
                onToggleExpanded={(expanded) =>
                  handleToggleExpanded(itemId, expanded)
                }
                removeTitle={t("map.removeFromMap")}
              />
            );
          }}
        />
      </Box>
    </TreeDropZone>
  );
};
