import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Box, ListItem, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { DND_ITEM_TITLE_FULL_SX } from "./utils";
import { DRAW_ORDER_MOVE_ZONE_ID, drawOrderMoveZoneItemId } from "./draw-order-list";

interface MoveZoneLayer {
  id: string;
  name: string;
}

interface DrawOrderMoveZoneProps {
  layers: MoveZoneLayer[];
  dropDisabled?: boolean;
}

function DrawOrderMoveZoneItem({
  layerId,
  layerName,
}: {
  layerId: string;
  layerName: string;
}) {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: drawOrderMoveZoneItemId(layerId),
    data: { type: "draw-order-move-zone-item", layerId },
  });

  return (
    <ListItem
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: "grab",
        px: 2,
        py: 1.5,
        border: "1px solid",
        borderColor: isDarkMode ? "rgba(255, 152, 0, 0.4)" : "rgba(255, 152, 0, 0.35)",
        borderRadius: 2,
        background: isDarkMode
          ? "rgba(255, 152, 0, 0.14)"
          : "rgba(255, 152, 0, 0.1)",
        opacity: isDragging ? 0 : 1,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        flexShrink: 0,
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicator
        fontSize="small"
        sx={{ color: "text.secondary", flexShrink: 0, mt: 0.25 }}
      />
      <Typography variant="body2" title={layerName} sx={DND_ITEM_TITLE_FULL_SX}>
        {layerName}
      </Typography>
    </ListItem>
  );
}

export function DrawOrderMoveZone({
  layers,
  dropDisabled = false,
}: DrawOrderMoveZoneProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { setNodeRef, isOver } = useDroppable({
    id: DRAW_ORDER_MOVE_ZONE_ID,
    disabled: dropDisabled,
    data: { accepts: ["draw-order-item"] },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1.5,
        boxSizing: "border-box",
        border: "2px dashed",
        borderColor: isOver
          ? "primary.main"
          : isDarkMode
            ? "#444"
            : "#ccc",
        borderRadius: 2,
        backgroundColor: isOver
          ? isDarkMode
            ? "rgba(25, 118, 210, 0.12)"
            : "rgba(25, 118, 210, 0.08)"
          : isDarkMode
            ? "#121212"
            : "#fafafa",
        transition: "all 0.2s ease",
      }}
    >
      {layers.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t("map.drawOrderMoveZoneEmpty")}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {layers.map((layer) => (
            <DrawOrderMoveZoneItem
              key={layer.id}
              layerId={layer.id}
              layerName={layer.name}
            />
          ))}
          <Box sx={{ flexShrink: 0, minHeight: 48 }} aria-hidden />
        </Box>
      )}
    </Box>
  );
}
