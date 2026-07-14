import { Box, Button, Typography } from "@mui/material";
import { useDrop } from "react-dnd";

import type { CatalogDragItem } from "../types";
import { CATALOG_DRAG_TYPE } from "../types";

interface GroupLayerTreeDropZoneProps {
  children?: React.ReactNode;
  emptyLabel?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onCatalogDrop: (item: CatalogDragItem) => void;
  canAcceptCatalogItem?: (item: CatalogDragItem) => boolean;
}

export default function GroupLayerTreeDropZone({
  children,
  emptyLabel,
  emptyActionLabel,
  onEmptyAction,
  onCatalogDrop,
  canAcceptCatalogItem = () => true,
}: GroupLayerTreeDropZoneProps) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: CATALOG_DRAG_TYPE,
      canDrop: (item: CatalogDragItem) => canAcceptCatalogItem(item),
      drop: (item: CatalogDragItem) => {
        onCatalogDrop(item);
        return { dropped: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [canAcceptCatalogItem, onCatalogDrop],
  );

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        ref={(node) => {
          dropRef(node as HTMLDivElement | null);
        }}
        sx={{
          flex: 1,
          minHeight: 240,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
          backgroundColor:
            isOver && canDrop ? "action.hover" : "transparent",
          outline: isOver && canDrop ? "2px dashed" : "none",
          outlineColor: "primary.main",
          outlineOffset: -4,
        }}
      >
        {emptyLabel ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              p: 2,
              pointerEvents: "none",
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              {emptyLabel}
            </Typography>
            {emptyActionLabel && onEmptyAction ? (
              <Button
                variant="outlined"
                size="small"
                onClick={onEmptyAction}
                sx={{ pointerEvents: "auto" }}
              >
                {emptyActionLabel}
              </Button>
            ) : null}
          </Box>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}
