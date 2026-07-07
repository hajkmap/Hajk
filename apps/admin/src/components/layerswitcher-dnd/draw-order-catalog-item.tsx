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
import { createSourceId, DND_ITEM_TITLE_SX, DND_TREE_ICON_BUTTON_SX } from "./utils";

interface DrawOrderCatalogItemProps {
  layer: { id: string; name: string };
  inDrawOrder: boolean;
  onRemoveFromDrawOrder?: () => void;
}

export function DrawOrderCatalogItem({
  layer,
  inDrawOrder,
  onRemoveFromDrawOrder,
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
        <Typography variant="body2" title={layer.name} sx={DND_ITEM_TITLE_SX}>
          {layer.name}
        </Typography>
        {inDrawOrder ? (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mt: 0.5 }}
            label={t("map.drawOrderLayerPlaced")}
          />
        ) : (
          <Chip
            size="small"
            variant="outlined"
            sx={{ mt: 0.5 }}
            label={t("map.drawOrderLayerNotPlaced")}
          />
        )}
      </Box>
      {inDrawOrder && onRemoveFromDrawOrder ? (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromDrawOrder();
          }}
          sx={{
            ...DND_TREE_ICON_BUTTON_SX,
            flexShrink: 0,
            "&:hover": {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
            },
          }}
          title={t("map.drawOrderRemoveLayer")}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
    </ListItem>
  );
}
