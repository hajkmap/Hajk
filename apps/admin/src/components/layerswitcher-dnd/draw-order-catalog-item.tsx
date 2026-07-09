import { useDraggable } from "@dnd-kit/core";
import { Box, Chip, IconButton, ListItem, Typography } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import {
  createSourceId,
  DND_ITEM_TITLE_FULL_SX,
} from "./utils";

const CATALOG_ACTION_BUTTON_SX = {
  p: 0.5,
  width: 36,
  height: 36,
} as const;

const CATALOG_ACTION_ICON_SX = { fontSize: 22 } as const;

const CATALOG_ACTIONS_BOX_SX = {
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  gap: 0.5,
  width: 36,
  height: 76,
  alignItems: "center",
  justifyContent: "center",
} as const;

const CATALOG_LEAD_SLOT_SX = {
  width: 32,
  height: 24,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-start",
  mt: 0.25,
  position: "relative",
} as const;

const getCatalogItemBackground = (
  inMoveZone: boolean,
  inDrawOrder: boolean,
  isDarkMode: boolean,
) => {
  if (inMoveZone) {
    return isDarkMode ? "rgba(255, 152, 0, 0.14)" : "rgba(255, 152, 0, 0.1)";
  }
  if (!inDrawOrder) {
    return isDarkMode ? "#1a1a1a" : "#fff";
  }
  return isDarkMode ? "rgba(76, 175, 80, 0.14)" : "rgba(76, 175, 80, 0.1)";
};

const getCatalogItemBorderColor = (
  inMoveZone: boolean,
  inDrawOrder: boolean,
  isDarkMode: boolean,
) => {
  if (inMoveZone) {
    return isDarkMode ? "rgba(255, 152, 0, 0.4)" : "rgba(255, 152, 0, 0.35)";
  }
  if (!inDrawOrder) {
    return "#ddd";
  }
  return isDarkMode ? "rgba(76, 175, 80, 0.35)" : "rgba(76, 175, 80, 0.28)";
};

interface DrawOrderCatalogItemProps {
  layer: { id: string; name: string };
  inDrawOrder: boolean;
  inMoveZone?: boolean;
  drawOrderIndex?: number;
  onScrollToDrawOrder?: () => void;
  onRemoveFromDrawOrder?: () => void;
  onAddToDrawOrderEnd?: () => void;
}

export function DrawOrderCatalogItem({
  layer,
  inDrawOrder,
  inMoveZone = false,
  drawOrderIndex,
  onScrollToDrawOrder,
  onRemoveFromDrawOrder,
  onAddToDrawOrderEnd,
}: DrawOrderCatalogItemProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: createSourceId("layer", layer.id),
    data: { type: "layer", item: layer },
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
        border: "1px solid",
        borderColor: getCatalogItemBorderColor(inMoveZone, inDrawOrder, isDarkMode),
        borderRadius: 2,
        background: getCatalogItemBackground(inMoveZone, inDrawOrder, isDarkMode),
        opacity: isDragging ? 0 : 1,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        "&:active": { cursor: "grabbing" },
        "&.catalog-item-placed .catalog-order-badge": {
          opacity: 1,
          transition: "opacity 0.15s ease",
        },
        "&.catalog-item-placed .catalog-drag-handle": {
          opacity: 0,
          position: "absolute",
          transition: "opacity 0.15s ease",
          color: "text.secondary",
        },
        "&.catalog-item-placed:hover .catalog-order-badge": {
          opacity: 0,
        },
        "&.catalog-item-placed:hover .catalog-drag-handle": {
          opacity: 1,
        },
        "&:not(.catalog-item-placed) .catalog-drag-handle": {
          opacity: 1,
          color: "text.secondary",
        },
      }}
      className={inDrawOrder ? "catalog-item-placed" : undefined}
    >
      <Box sx={CATALOG_LEAD_SLOT_SX}>
        {inDrawOrder && drawOrderIndex != null ? (
          <Chip
            className="catalog-order-badge"
            size="small"
            color="primary"
            variant="outlined"
            label={t("map.drawOrderLayerPlacedAt", { order: drawOrderIndex })}
            sx={{
              minWidth: 28,
              height: 24,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        ) : null}
        <DragIndicator className="catalog-drag-handle" fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" title={layer.name} sx={DND_ITEM_TITLE_FULL_SX}>
          {layer.name}
        </Typography>
        {!inDrawOrder ? (
          <Chip
            size="small"
            variant="outlined"
            color={inMoveZone ? "warning" : "default"}
            sx={{ mt: 0.5 }}
            label={
              inMoveZone
                ? t("map.drawOrderLayerInMoveZone")
                : t("map.drawOrderLayerNotPlaced")
            }
          />
        ) : null}
      </Box>
      <Box sx={CATALOG_ACTIONS_BOX_SX}>
        {inDrawOrder ? (
          <>
            {onScrollToDrawOrder ? (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onScrollToDrawOrder();
                }}
                sx={{
                  ...CATALOG_ACTION_BUTTON_SX,
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                  },
                }}
                title={t("map.drawOrderScrollToLayer")}
                aria-label={t("map.drawOrderScrollToLayer")}
              >
                <MyLocationIcon sx={CATALOG_ACTION_ICON_SX} />
              </IconButton>
            ) : null}
            {onRemoveFromDrawOrder ? (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromDrawOrder();
                }}
                sx={{
                  ...CATALOG_ACTION_BUTTON_SX,
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                  },
                }}
                title={t("map.drawOrderRemoveLayer")}
                aria-label={t("map.drawOrderRemoveLayer")}
              >
                <DeleteOutlineIcon sx={CATALOG_ACTION_ICON_SX} />
              </IconButton>
            ) : null}
          </>
        ) : onAddToDrawOrderEnd && !inMoveZone ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onAddToDrawOrderEnd();
            }}
            sx={{
              ...CATALOG_ACTION_BUTTON_SX,
              "&:hover": {
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              },
            }}
            title={t("map.drawOrderAddToEnd")}
            aria-label={t("map.drawOrderAddToEnd")}
          >
            <PlaylistAddIcon sx={CATALOG_ACTION_ICON_SX} />
          </IconButton>
        ) : null}
      </Box>
    </ListItem>
  );
}
