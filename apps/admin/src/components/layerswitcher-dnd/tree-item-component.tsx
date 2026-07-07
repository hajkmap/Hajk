import React from "react";
import {
  SimpleTreeItemWrapper,
  TreeItemComponentProps,
} from "dnd-kit-sortable-tree";
import { Box, Chip, FormControlLabel, Switch, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { TreeItemData } from "./types";
import { TreeItemActions } from "./tree-item-actions";
import GroupCompositionSummary from "../group-composition-summary";
import {
  DND_DRAG_HANDLE_SX,
  DND_ITEM_TITLE_SX,
  DND_TREE_ITEM_CARD_SX,
} from "./utils";

interface TreeItemComponentExtendedProps extends TreeItemComponentProps<TreeItemData> {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAdd?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  drawOrderIndex?: number;
  groupOrderIndex?: number;
  showListOrder?: boolean;
  showLayerPlacementStatus?: boolean;
  showGroupPlacementStatus?: boolean;
  onToggleVisibleAtStart?: (visible: boolean) => void;
  onToggleToggled?: (toggled: boolean) => void;
  onToggleExpanded?: (expanded: boolean) => void;
  removeTitle?: string;
  moveUpTitle?: string;
  moveDownTitle?: string;
}

export const TreeItemComponent = React.forwardRef<
  HTMLDivElement,
  TreeItemComponentExtendedProps
>((props, ref) => {
  const {
    item,
    onMoveUp,
    onMoveDown,
    onAdd,
    canMoveUp,
    canMoveDown,
    drawOrderIndex,
    groupOrderIndex,
    showListOrder = false,
    showLayerPlacementStatus,
    showGroupPlacementStatus,
    onToggleVisibleAtStart,
    onToggleToggled,
    onToggleExpanded,
    removeTitle,
    moveUpTitle,
    moveDownTitle,
  } = props;
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const isGroup = item.type === "group";
  const isLayer = item.type === "layer";
  const showLayerStatus = showLayerPlacementStatus && isLayer;
  const showGroupStatus = showGroupPlacementStatus && isGroup;

  return (
    <SimpleTreeItemWrapper
      {...props}
      ref={ref}
      manualDrag
      showDragHandle={false}
    >
      <Box
        sx={{
          ...DND_TREE_ITEM_CARD_SX,
          width: "100%",
          boxSizing: "border-box",
          background: isDarkMode ? "#1a1a1a" : "#fff",
          border: "1px solid #ddd",
          mb: 0.5,
        }}
      >
        <Box
          {...props.handleProps}
          sx={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}
        >
          <DragIndicator sx={DND_DRAG_HANDLE_SX} />
        </Box>

        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography
            fontWeight={isGroup ? 600 : 400}
            variant="body2"
            title={item.name}
            sx={{
              ...DND_ITEM_TITLE_SX,
              color: isGroup ? "primary.main" : "text.primary",
            }}
          >
            {item.name}
          </Typography>

          {showLayerStatus ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t("map.layerActive")}
              />
              {showListOrder && drawOrderIndex != null ? (
                <Chip
                  size="small"
                  variant="outlined"
                  color="primary"
                  label={t("map.drawOrderShort", { order: drawOrderIndex + 1 })}
                />
              ) : null}
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={item.visibleAtStart ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleVisibleAtStart?.(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Typography variant="caption">
                    {t("map.layerVisibleAtStart")}
                  </Typography>
                }
              />
            </Box>
          ) : null}

          {showGroupStatus ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              {item.layerCount !== undefined ||
              item.nestedGroupCount !== undefined ? (
                <GroupCompositionSummary
                  meta={{
                    layerCount: item.layerCount ?? 0,
                    nestedGroupCount: item.nestedGroupCount ?? 0,
                    toggleAllEnabled: item.toggled,
                  }}
                  compact
                  hideNestingLevel
                />
              ) : null}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                }}
              >
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t("map.groupActiveOnMap")}
              />
              {showListOrder && groupOrderIndex != null ? (
                <Chip
                  size="small"
                  variant="outlined"
                  color="primary"
                  label={t("map.groupSwitcherOrderShort", {
                    order: groupOrderIndex + 1,
                  })}
                />
              ) : null}
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={item.toggled ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleToggled?.(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Typography variant="caption">
                    {t("map.groupToggleAll")}
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={item.expanded ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleExpanded?.(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Typography variant="caption">
                    {t("map.groupExpandedAtStart")}
                  </Typography>
                }
              />
              </Box>
            </Box>
          ) : null}
        </Box>

        <TreeItemActions
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAdd={isGroup ? onAdd : undefined}
          onRemove={props.onRemove ? () => props.onRemove?.() : undefined}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          showAddSlot={Boolean(onAdd)}
          isDarkMode={isDarkMode}
          removeTitle={removeTitle}
          moveUpTitle={moveUpTitle}
          moveDownTitle={moveDownTitle}
        />
      </Box>
    </SimpleTreeItemWrapper>
  );
});

TreeItemComponent.displayName = "TreeItemComponent";
