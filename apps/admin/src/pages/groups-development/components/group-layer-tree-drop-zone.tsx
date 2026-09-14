import { useState } from "react";
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
  /** Defaults to groups only (Maplayers). Bakgrund passes layers. */
  canAcceptTreeItemToRoot?: (node: GroupLayerTreeNode) => boolean;
  /** Click-and-drop: place the held item on the root / empty padding. */
  onClickPlace?: () => void;
  clickPlaceActive?: boolean;
  onClickPlaceHoverChange?: (hovering: boolean) => void;
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
  canAcceptTreeItemToRoot = (node) => node.data?.kind === "group",
  onClickPlace,
  clickPlaceActive = false,
  onClickPlaceHoverChange,
}: GroupLayerTreeDropZoneProps) {
  const [clickPlaceHover, setClickPlaceHover] = useState(false);
  const [clickPlaceActiveSnapshot, setClickPlaceActiveSnapshot] =
    useState(clickPlaceActive);

  // Drop clears the pick while the pointer may still be on the pad; without
  // resetting, the next pick would show the dashed box immediately.
  if (clickPlaceActive !== clickPlaceActiveSnapshot) {
    setClickPlaceActiveSnapshot(clickPlaceActive);
    setClickPlaceHover(false);
  }
  const canAccept = (
    item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
    type: string | symbol | null,
  ) => {
    if (type === TREE_ITEM_TYPE) {
      const node = item as GroupLayerTreeNode;
      return (
        onTreeDropToRoot != null &&
        node?.id != null &&
        canAcceptTreeItemToRoot(node)
      );
    }
    if (type === MOVE_ZONE_DRAG_TYPE) {
      return canAcceptMoveZoneItem(item as MoveZoneItem);
    }
    return canAcceptCatalogItem(item as CatalogDragItem);
  };

  const performDrop = (
    item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
    type: string | symbol | null,
  ) => {
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
  };

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE, TREE_ITEM_TYPE],
      canDrop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => {
        // Only the empty padding of this zone (not nested tree rows).
        if (!monitor.isOver({ shallow: true })) {
          return false;
        }
        return canAccept(item, monitor.getItemType());
      },
      drop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => {
        if (monitor.didDrop() || !monitor.isOver({ shallow: true })) {
          return;
        }
        return performDrop(item, monitor.getItemType());
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [
      canAcceptCatalogItem,
      canAcceptMoveZoneItem,
      canAcceptTreeItemToRoot,
      onCatalogDrop,
      onMoveZoneDrop,
      onTreeDropToRoot,
    ],
  );

  // Dedicated bottom pad — needed when the tree fills the zone so there is
  // no empty parent padding to hover (shallow root drop + click-place).
  const [{ isOverPad, canDropPad }, padDropRef] = useDrop(
    () => ({
      accept: [CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE, TREE_ITEM_TYPE],
      canDrop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => canAccept(item, monitor.getItemType()),
      drop: (
        item: CatalogDragItem | MoveZoneItem | GroupLayerTreeNode,
        monitor,
      ) => {
        if (monitor.didDrop()) {
          return;
        }
        return performDrop(item, monitor.getItemType());
      },
      collect: (monitor) => ({
        isOverPad: monitor.isOver({ shallow: true }),
        canDropPad: monitor.canDrop(),
      }),
    }),
    [
      canAcceptCatalogItem,
      canAcceptMoveZoneItem,
      canAcceptTreeItemToRoot,
      onCatalogDrop,
      onMoveZoneDrop,
      onTreeDropToRoot,
    ],
  );

  const setPadHover = (hovering: boolean) => {
    setClickPlaceHover(hovering);
    onClickPlaceHoverChange?.(hovering);
  };

  const showDropBox =
    (isOver && canDrop) ||
    (isOverPad && canDropPad) ||
    (clickPlaceActive && clickPlaceHover);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        // Air around the dashed drop box so it is not flush with the panel.
        p: "2px",
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
          backgroundColor: showDropBox ? "action.hover" : "transparent",
          outline: showDropBox ? "2px dashed" : "none",
          outlineColor: "primary.main",
          outlineOffset: -2,
          cursor: clickPlaceActive ? "pointer" : undefined,
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
        <Box
          ref={(node) => {
            padDropRef(node as HTMLDivElement | null);
          }}
          onMouseEnter={() => {
            if (clickPlaceActive) {
              setPadHover(true);
            }
          }}
          onMouseLeave={() => {
            if (clickPlaceActive) {
              setPadHover(false);
            }
          }}
          onClick={(event) => {
            if (!clickPlaceActive || onClickPlace == null) {
              return;
            }
            event.stopPropagation();
            onClickPlace();
          }}
          sx={{
            flex: 1,
            // Always keep a tiny hit strip under the list (grows with free space).
            minHeight: "2px",
            cursor: clickPlaceActive ? "pointer" : undefined,
          }}
        />
      </Box>
    </Box>
  );
}
