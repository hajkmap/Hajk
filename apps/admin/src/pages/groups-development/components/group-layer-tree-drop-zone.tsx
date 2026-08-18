import { Box, Button, Typography } from "@mui/material";
import { ItemTypes } from "@minoru/react-dnd-treeview";
import { useDrop } from "react-dnd";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MoveZoneItem,
} from "../types";
import { CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE } from "../types";

const TREE_ITEM_TYPE =
  (ItemTypes as { TREE_ITEM?: string | symbol }).TREE_ITEM ?? "TREE_ITEM";

interface GroupLayerTreeDropZoneProps {
  children?: React.ReactNode;
  emptyLabel?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onCatalogDrop: (item: CatalogDragItem) => void;
  canAcceptCatalogItem?: (item: CatalogDragItem) => boolean;
  onMoveZoneDrop?: (item: MoveZoneItem) => void;
  canAcceptMoveZoneItem?: (item: MoveZoneItem) => boolean;
  onTreeDropToRoot?: (nodeId: GroupLayerTreeNode["id"]) => void;
}

export default function GroupLayerTreeDropZone({
  children,
  emptyLabel,
  emptyActionLabel,
  onEmptyAction,
  onCatalogDrop,
  canAcceptCatalogItem = () => true,
  onMoveZoneDrop,
  canAcceptMoveZoneItem = () => true,
  onTreeDropToRoot,
}: GroupLayerTreeDropZoneProps) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE, TREE_ITEM_TYPE],
      canDrop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => {
        const type = monitor.getItemType();
        if (type === TREE_ITEM_TYPE) {
          const node = item as GroupLayerTreeNode;
          return (
            onTreeDropToRoot != null &&
            node?.id != null &&
            node.data?.kind === "group"
          );
        }
        if (type === MOVE_ZONE_DRAG_TYPE) {
          return canAcceptMoveZoneItem(item as MoveZoneItem);
        }
        return canAcceptCatalogItem(item as CatalogDragItem);
      },
      drop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => {
        if (monitor.didDrop()) {
          return;
        }
        const type = monitor.getItemType();
        if (type === TREE_ITEM_TYPE) {
          const node = item as GroupLayerTreeNode;
          if (node?.id != null) {
            onTreeDropToRoot?.(node.id);
          }
          return { dropped: true };
        }
        if (type === MOVE_ZONE_DRAG_TYPE) {
          onMoveZoneDrop?.(item as MoveZoneItem);
          return { dropped: true };
        }
        onCatalogDrop(item as CatalogDragItem);
        return { dropped: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [
      canAcceptCatalogItem,
      canAcceptMoveZoneItem,
      onCatalogDrop,
      onMoveZoneDrop,
      onTreeDropToRoot,
    ],
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
          backgroundColor: isOver && canDrop ? "action.hover" : "transparent",
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
