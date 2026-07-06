import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Box, Chip, ListItem, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { ItemType } from "./types";
import { createSourceId, DND_ITEM_TITLE_SX } from "./utils";
import GroupCompositionSummary from "../group-composition-summary";
import type { GroupCatalogMeta } from "../pages/groups/utils/group-composition-stats";

interface DraggableSourceItemProps {
  item: { id: string; name: string };
  type: ItemType;
  showInactiveStatus?: boolean;
  groupMeta?: GroupCatalogMeta;
}

export const DraggableSourceItem: React.FC<DraggableSourceItemProps> = ({
  item,
  type,
  showInactiveStatus = false,
  groupMeta,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: createSourceId(type, item.id),
    data: { type, item },
  });

  return (
    <ListItem
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: "grab",
        mb: 1,
        px: 2,
        py: 1.5,
        border: "1px solid #ddd",
        borderRadius: 2,
        background: isDarkMode ? "#1a1a1a" : "#fff",
        opacity: isDragging ? 0.5 : 1,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <DragIndicator sx={{ mr: 1, mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" title={item.name} sx={DND_ITEM_TITLE_SX}>
          {item.name}
        </Typography>
        {showInactiveStatus && type === "layer" ? (
          <Chip
            size="small"
            variant="outlined"
            sx={{ mt: 0.5 }}
            label={t("map.layerInactive")}
          />
        ) : null}
        {type === "group" && groupMeta ? (
          <GroupCompositionSummary meta={groupMeta} compact />
        ) : null}
      </Box>
    </ListItem>
  );
};
