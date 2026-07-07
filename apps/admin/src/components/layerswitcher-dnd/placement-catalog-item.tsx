import { useDraggable } from "@dnd-kit/core";
import {
  Box,
  Chip,
  IconButton,
  ListItem,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import GroupCompositionSummary from "../group-composition-summary";
import type { GroupCatalogMeta } from "../../pages/groups/utils/group-composition-stats";
import type { ItemType } from "./types";
import { createSourceId, DND_ITEM_TITLE_SX, DND_TREE_ICON_BUTTON_SX } from "./utils";

interface PlacementCatalogItemProps {
  item: { id: string; name: string };
  type: ItemType;
  inPlacement: boolean;
  groupMeta?: GroupCatalogMeta;
  onRemoveFromPlacement?: () => void;
}

export function PlacementCatalogItem({
  item,
  type,
  inPlacement,
  groupMeta,
  onRemoveFromPlacement,
}: PlacementCatalogItemProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: createSourceId(type, item.id),
    data: { type, item },
  });

  const placedLabel =
    type === "layer"
      ? t("map.placementLayerPlaced")
      : t("map.placementGroupPlaced");
  const notPlacedLabel =
    type === "layer"
      ? t("map.placementLayerNotPlaced")
      : t("map.placementGroupNotPlaced");

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
        opacity: isDragging ? 0 : 1,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicator sx={{ mt: 0.25, flexShrink: 0, color: "text.secondary" }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          title={item.name}
          sx={{
            ...DND_ITEM_TITLE_SX,
            fontWeight: type === "group" ? 600 : 400,
            color: type === "group" ? "primary.main" : "text.primary",
          }}
        >
          {item.name}
        </Typography>
        {type === "group" && groupMeta ? (
          <GroupCompositionSummary meta={groupMeta} compact />
        ) : null}
        <Chip
          size="small"
          color={inPlacement ? "primary" : "default"}
          variant="outlined"
          sx={{ mt: 0.5 }}
          label={inPlacement ? placedLabel : notPlacedLabel}
        />
      </Box>
      {inPlacement && onRemoveFromPlacement ? (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromPlacement();
          }}
          sx={{
            ...DND_TREE_ICON_BUTTON_SX,
            flexShrink: 0,
            "&:hover": {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
            },
          }}
          title={t("map.placementRemoveItem")}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
    </ListItem>
  );
}
