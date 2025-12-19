import React from "react";
import {
  SimpleTreeItemWrapper,
  TreeItemComponentProps,
} from "dnd-kit-sortable-tree";
import { Box, Typography, IconButton } from "@mui/material";
import {
  Close as CloseIcon,
  DragIndicator,
  Add as AddIcon,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { TreeItemData } from "./types";

interface TreeItemComponentExtendedProps
  extends TreeItemComponentProps<TreeItemData> {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAdd?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const TreeItemComponent = React.forwardRef<
  HTMLDivElement,
  TreeItemComponentExtendedProps
>((props, ref) => {
  const { item, onMoveUp, onMoveDown, onAdd, canMoveUp, canMoveDown } = props;
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { t } = useTranslation();

  const isGroup = item.type === "group";

  return (
    <SimpleTreeItemWrapper {...props} ref={ref}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          background: isDarkMode ? "#1a1a1a" : "#fff",
          border: "1px solid #ddd",
          borderRadius: 1,
        }}
      >
        <Box {...props.handleProps} sx={{ cursor: "grab" }}>
          <DragIndicator />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={isGroup ? 600 : 400}>{item.name}</Typography>
          {isGroup && (
            <Typography variant="caption" color="text.secondary">
              {t("common.group")}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          {onMoveUp && (
            <IconButton size="small" onClick={onMoveUp} disabled={!canMoveUp}>
              <ArrowUpward fontSize="small" />
            </IconButton>
          )}
          {onMoveDown && (
            <IconButton
              size="small"
              onClick={onMoveDown}
              disabled={!canMoveDown}
            >
              <ArrowDownward fontSize="small" />
            </IconButton>
          )}
          {isGroup && onAdd && (
            <IconButton size="small" onClick={onAdd}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {props.onRemove && (
            <IconButton size="small" onClick={() => props.onRemove?.()}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </SimpleTreeItemWrapper>
  );
});

TreeItemComponent.displayName = "TreeItemComponent";
