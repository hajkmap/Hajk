import React from "react";
import {
  SimpleTreeItemWrapper,
  TreeItemComponentProps,
} from "dnd-kit-sortable-tree";
import {
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { TreeItemData } from "./types";
import { TreeItemActions } from "./tree-item-actions";
import {
  DND_DRAG_HANDLE_SX,
  DND_ITEM_TITLE_SX,
  DND_TREE_ITEM_CARD_SX,
} from "./utils";

interface TreeItemComponentExtendedProps
  extends TreeItemComponentProps<TreeItemData> {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAdd?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  drawOrderIndex?: number;
  showLayerPlacementStatus?: boolean;
  onToggleVisibleAtStart?: (visible: boolean) => void;
  removeTitle?: string;
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
    showLayerPlacementStatus,
    onToggleVisibleAtStart,
    removeTitle,
  } = props;
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const isGroup = item.type === "group";
  const isLayer = item.type === "layer";
  const showLayerStatus = showLayerPlacementStatus && isLayer;

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
          background: isDarkMode ? "#1a1a1a" : "#fff",
          border: "1px solid #ddd",
        }}
      >
        <Box
          {...props.handleProps}
          sx={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}
        >
          <DragIndicator sx={DND_DRAG_HANDLE_SX} />
        </Box>

        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
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
              {drawOrderIndex != null ? (
                <Typography variant="caption" color="text.secondary">
                  {t("map.layerDrawOrder", { order: drawOrderIndex + 1 })}
                </Typography>
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
        </Box>

        <TreeItemActions
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAdd={isGroup ? onAdd : undefined}
          onRemove={props.onRemove ? () => props.onRemove?.() : undefined}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          showAddSlot
          isDarkMode={isDarkMode}
          removeTitle={removeTitle}
        />
      </Box>
    </SimpleTreeItemWrapper>
  );
});

TreeItemComponent.displayName = "TreeItemComponent";
