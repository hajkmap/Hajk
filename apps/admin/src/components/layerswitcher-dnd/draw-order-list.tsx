import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, DragIndicator } from "@mui/icons-material";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import {
  DND_ITEM_TITLE_FULL_SX,
  DND_TREE_ICON_BUTTON_SX,
  adjustDrawOrderInsertIndex,
  parseSourceId,
} from "./utils";

const isSourceLayerDragId = (id: string) => {
  const parsed = parseSourceId(id);
  return parsed?.type === "layer";
};

const INSERTION_SHADOW_HEIGHT = 48;
const INSERTION_GAP = 8;

const getDrawOrderItemBackground = (
  isRecentlyAdded: boolean,
  isDarkMode: boolean,
) => {
  if (!isRecentlyAdded) {
    return isDarkMode ? "#1a1a1a" : "#fff";
  }
  return isDarkMode ? "rgba(76, 175, 80, 0.14)" : "rgba(76, 175, 80, 0.1)";
};

const getDrawOrderItemBorderColor = (
  isRecentlyAdded: boolean,
  isDarkMode: boolean,
) => {
  if (!isRecentlyAdded) {
    return "#ddd";
  }
  return isDarkMode ? "rgba(76, 175, 80, 0.35)" : "rgba(76, 175, 80, 0.28)";
};

export const DRAW_ORDER_DROP_ZONE_ID = "draw-order-drop-zone";
export const DRAW_ORDER_MOVE_ZONE_ID = "draw-order-move-zone";
export const DRAW_ORDER_EDGE_TOP_ID = "draw-order-edge-top";
export const DRAW_ORDER_EDGE_BOTTOM_ID = "draw-order-edge-bottom";
export const drawOrderItemId = (layerId: string) => `draw-order-${layerId}`;
export const drawOrderMoveZoneItemId = (layerId: string) =>
  `draw-order-move-zone-${layerId}`;

export const isDrawOrderMoveZoneItemId = (id: string) =>
  id.startsWith("draw-order-move-zone-");

export function scrollDrawOrderItemIntoView(
  layerId: string,
  scrollContainer: HTMLElement | null,
): void {
  const itemEl = document.getElementById(drawOrderItemId(layerId));
  if (!itemEl || !scrollContainer) return;

  const containerRect = scrollContainer.getBoundingClientRect();
  const itemRect = itemEl.getBoundingClientRect();
  const isVisible =
    itemRect.top >= containerRect.top &&
    itemRect.bottom <= containerRect.bottom;

  if (!isVisible) {
    const targetScroll =
      itemRect.top -
      containerRect.top +
      scrollContainer.scrollTop -
      containerRect.height / 2 +
      itemRect.height / 2;
    scrollContainer.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  }

  itemEl.style.transition = "box-shadow 0.2s ease";
  itemEl.style.boxShadow = "0 0 0 2px rgba(76, 175, 80, 0.8)";
  window.setTimeout(() => {
    itemEl.style.boxShadow = "";
  }, 1200);
}

export const isValidDrawOrderDropTarget = (overId: string): boolean =>
  overId === DRAW_ORDER_DROP_ZONE_ID ||
  overId === DRAW_ORDER_EDGE_TOP_ID ||
  overId === DRAW_ORDER_EDGE_BOTTOM_ID ||
  (overId.startsWith("draw-order-") && !isDrawOrderMoveZoneItemId(overId));

/** @deprecated Use insertIndex from useDrawOrderDndHandlers */
export type DrawOrderDragOver = {
  layerId: string;
  position: "above" | "below";
} | null;

export type DrawOrderPreviewRow =
  | { type: "item"; layerId: string }
  | { type: "shadow" };

function getDraggedLayerId(activeId: string | null): string | null {
  if (!activeId) return null;
  if (isDrawOrderMoveZoneItemId(activeId)) {
    return activeId.replace("draw-order-move-zone-", "");
  }
  if (activeId.startsWith("draw-order-")) {
    return activeId.replace("draw-order-", "");
  }
  if (isSourceLayerDragId(activeId)) {
    return parseSourceId(activeId)?.id ?? null;
  }
  return null;
}

function resolveInsertIndex(
  overId: string,
  layerIds: string[],
  pointerY: number | null,
): number | null {
  if (overId === DRAW_ORDER_EDGE_TOP_ID) return 0;
  if (
    overId === DRAW_ORDER_EDGE_BOTTOM_ID ||
    overId === DRAW_ORDER_DROP_ZONE_ID
  ) {
    return layerIds.length;
  }
  if (!overId.startsWith("draw-order-") || isDrawOrderMoveZoneItemId(overId)) {
    return null;
  }

  const targetLayerId = overId.replace("draw-order-", "");
  const targetIndex = layerIds.indexOf(targetLayerId);
  if (targetIndex === -1) return null;

  const overElement = document.getElementById(overId);
  if (overElement && pointerY !== null) {
    const rect = overElement.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return pointerY < centerY ? targetIndex : targetIndex + 1;
  }

  return targetIndex + 1;
}

function computeDrawOrderInsertIndex(
  overId: string,
  activeItemId: string | null,
  layerIds: string[],
  insertIndex: number | null,
  pointerY: number | null,
): number {
  if (insertIndex !== null) {
    return insertIndex;
  }

  const fallback = resolveInsertIndex(overId, layerIds, pointerY);
  if (fallback !== null) return fallback;

  if (activeItemId && isDrawOrderMoveZoneItemId(activeItemId)) {
    return layerIds.length;
  }

  if (
    activeItemId?.startsWith("draw-order-") &&
    !isDrawOrderMoveZoneItemId(activeItemId)
  ) {
    const draggedLayerId = activeItemId.replace("draw-order-", "");
    const draggedIndex = layerIds.indexOf(draggedLayerId);
    if (draggedIndex !== -1) return draggedIndex;
  }

  return layerIds.length;
}

export function buildDrawOrderPreviewRows(
  layerIds: string[],
  activeId: string | null,
  insertIndex: number | null,
): DrawOrderPreviewRow[] {
  if (activeId === null || insertIndex === null) {
    return layerIds.map((layerId) => ({ type: "item", layerId }));
  }

  const draggedLayerId = getDraggedLayerId(activeId);
  const baseIds = draggedLayerId
    ? layerIds.filter((id) => id !== draggedLayerId)
    : layerIds;

  const shadowIndex = draggedLayerId
    ? adjustDrawOrderInsertIndex(layerIds, draggedLayerId, insertIndex)
    : Math.max(0, Math.min(insertIndex, layerIds.length));

  const rows: DrawOrderPreviewRow[] = [];
  baseIds.forEach((layerId, index) => {
    if (index === shadowIndex) {
      rows.push({ type: "shadow" });
    }
    rows.push({ type: "item", layerId });
  });
  if (shadowIndex === baseIds.length) {
    rows.push({ type: "shadow" });
  }

  return rows;
}

export function useDrawOrderDndHandlers({
  layerIds,
  onReorder,
  onInsertFromSource,
  onMoveToZone,
  onInsertFromMoveZone,
  scrollRef,
}: {
  layerIds: string[];
  onReorder: (layerIds: string[]) => void;
  onInsertFromSource: (layerId: string, insertIndex: number) => void;
  onMoveToZone: (layerId: string) => void;
  onInsertFromMoveZone: (layerId: string, insertIndex: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const pointerYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeId) return;
    const trackPointer = (e: PointerEvent) => {
      pointerYRef.current = e.clientY;
    };
    window.addEventListener("pointermove", trackPointer);
    return () => window.removeEventListener("pointermove", trackPointer);
  }, [activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
    setInsertIndex(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const pointerY = pointerYRef.current;
    const over = event.over;

    if (!over) {
      setInsertIndex(null);
      return;
    }

    const overId = over.id.toString();
    const currentActiveId = event.active.id.toString();
    const isDrawOrderDrag =
      currentActiveId.startsWith("draw-order-") ||
      isDrawOrderMoveZoneItemId(currentActiveId) ||
      isSourceLayerDragId(currentActiveId);

    if (overId === DRAW_ORDER_MOVE_ZONE_ID) {
      setInsertIndex(null);
      return;
    }

    if (!isDrawOrderDrag || !isValidDrawOrderDropTarget(overId)) {
      setInsertIndex(null);
      return;
    }

    setInsertIndex(resolveInsertIndex(overId, layerIds, pointerY));

    if (scrollRef.current && pointerY !== null) {
      const rect = scrollRef.current.getBoundingClientRect();
      const scrollThreshold = 50;
      const scrollSpeed = 10;
      if (pointerY < rect.top + scrollThreshold) {
        scrollRef.current.scrollBy({ top: -scrollSpeed, behavior: "smooth" });
      } else if (pointerY > rect.bottom - scrollThreshold) {
        scrollRef.current.scrollBy({ top: scrollSpeed, behavior: "smooth" });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const pointerY = pointerYRef.current;
    const currentInsertIndex = insertIndex;
    setActiveId(null);
    setInsertIndex(null);
    pointerYRef.current = null;

    if (!over) {
      if (
        isDrawOrderMoveZoneItemId(active.id.toString()) &&
        currentInsertIndex !== null
      ) {
        const layerId = active.id
          .toString()
          .replace("draw-order-move-zone-", "");
        onInsertFromMoveZone(layerId, currentInsertIndex);
      }
      return;
    }

    if (active.id === over.id) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (overIdStr === DRAW_ORDER_MOVE_ZONE_ID) {
      if (
        activeIdStr.startsWith("draw-order-") &&
        !isDrawOrderMoveZoneItemId(activeIdStr)
      ) {
        onMoveToZone(activeIdStr.replace("draw-order-", ""));
      }
      return;
    }

    if (!isValidDrawOrderDropTarget(overIdStr)) {
      return;
    }

    if (isDrawOrderMoveZoneItemId(activeIdStr)) {
      const layerId = activeIdStr.replace("draw-order-move-zone-", "");
      const resolvedInsertIndex = computeDrawOrderInsertIndex(
        overIdStr,
        activeIdStr,
        layerIds,
        currentInsertIndex,
        pointerY,
      );
      onInsertFromMoveZone(layerId, resolvedInsertIndex);
      return;
    }

    if (isSourceLayerDragId(activeIdStr)) {
      const parsed = parseSourceId(activeIdStr);
      if (parsed?.type !== "layer") {
        return;
      }
    } else if (
      !activeIdStr.startsWith("draw-order-") ||
      isDrawOrderMoveZoneItemId(activeIdStr)
    ) {
      return;
    }

    const resolvedInsertIndex = computeDrawOrderInsertIndex(
      overIdStr,
      activeIdStr,
      layerIds,
      currentInsertIndex,
      pointerY,
    );

    if (isSourceLayerDragId(activeIdStr)) {
      const parsed = parseSourceId(activeIdStr);
      if (parsed?.type === "layer") {
        onInsertFromSource(parsed.id, resolvedInsertIndex);
      }
      return;
    }

    if (activeIdStr.startsWith("draw-order-")) {
      const draggedLayerId = activeIdStr.replace("draw-order-", "");
      const newIds = layerIds.filter((id) => id !== draggedLayerId);
      const adjustedIndex = adjustDrawOrderInsertIndex(
        layerIds,
        draggedLayerId,
        resolvedInsertIndex,
      );
      newIds.splice(adjustedIndex, 0, draggedLayerId);
      onReorder(newIds);
    }
  };

  return {
    activeId,
    insertIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}

const DrawOrderInsertionShadow: React.FC<{ layerName: string }> = ({
  layerName,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  return (
    <Box
      sx={{
        height: INSERTION_SHADOW_HEIGHT,
        mb: `${INSERTION_GAP}px`,
        px: 1,
        py: 0.75,
        borderRadius: 2,
        border: "2px dashed",
        borderColor: "primary.main",
        backgroundColor: isDarkMode
          ? "rgba(66, 165, 245, 0.14)"
          : "rgba(25, 118, 210, 0.1)",
        boxShadow: isDarkMode
          ? "0 0 0 1px rgba(66, 165, 245, 0.25)"
          : "0 0 0 1px rgba(25, 118, 210, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        boxSizing: "border-box",
        transition: "height 0.2s ease, margin 0.2s ease, opacity 0.15s ease",
        animation: "drawOrderShadowPulse 1.2s ease-in-out infinite",
        "@keyframes drawOrderShadowPulse": {
          "0%, 100%": { opacity: 0.72 },
          "50%": { opacity: 1 },
        },
      }}
    >
      <DragIndicator
        fontSize="small"
        sx={{ color: "primary.main", flexShrink: 0 }}
      />
      <Typography
        variant="body2"
        color="primary"
        title={layerName}
        sx={{ ...DND_ITEM_TITLE_FULL_SX, fontStyle: "italic" }}
      >
        {layerName}
      </Typography>
    </Box>
  );
};

const DrawOrderEdgeDrop: React.FC<{
  id: string;
  active: boolean;
}> = ({ id, active }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        minHeight: active || isOver ? INSERTION_SHADOW_HEIGHT / 2 : 24,
        transition: "min-height 0.2s ease",
      }}
    />
  );
};

const DrawOrderListItem: React.FC<{
  layerId: string;
  layerName: string;
  orderIndex: number;
  isDragging: boolean;
  isRecentlyAdded: boolean;
  onRemove: () => void;
}> = ({
  layerId,
  layerName,
  orderIndex,
  isDragging,
  isRecentlyAdded,
  onRemove,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { t } = useTranslation();
  const itemDomId = drawOrderItemId(layerId);

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging: isDraggingFromKit,
  } = useDraggable({
    id: itemDomId,
    data: { type: "draw-order-item", layerId, index: orderIndex },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: itemDomId,
    data: {
      accepts: ["source-layer", "draw-order-item", "draw-order-move-zone-item"],
    },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const showAsDragging = isDragging || isDraggingFromKit;

  return (
    <ListItem
      id={itemDomId}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: getDrawOrderItemBackground(isRecentlyAdded, isDarkMode),
        cursor: showAsDragging ? "grabbing" : "grab",
        border: "1px solid",
        borderColor: getDrawOrderItemBorderColor(isRecentlyAdded, isDarkMode),
        borderRadius: 2,
        mb: 0.5,
        px: 1,
        py: 0.75,
        opacity: showAsDragging ? 0 : 1,
        transform: showAsDragging ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 0.2s ease, opacity 0.2s ease, margin 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 0.5,
        boxShadow: showAsDragging ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
        pointerEvents: showAsDragging ? "none" : "auto",
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicator
        fontSize="small"
        sx={{ color: "text.secondary", flexShrink: 0, mt: 0.25 }}
      />
      <Chip
        size="small"
        color="primary"
        variant="outlined"
        sx={{ flexShrink: 0, mt: 0.125 }}
        label={t("map.drawOrderLayerPlacedAt", { order: orderIndex + 1 })}
      />
      <Typography variant="body2" title={layerName} sx={DND_ITEM_TITLE_FULL_SX}>
        {layerName}
      </Typography>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          ...DND_TREE_ICON_BUTTON_SX,
          ml: "auto",
          mt: 0.125,
          flexShrink: 0,
          "&:hover": {
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
          },
        }}
        title={t("map.drawOrderRemoveLayer")}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </ListItem>
  );
};

const DrawOrderDropZone: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { setNodeRef, isOver } = useDroppable({
    id: DRAW_ORDER_DROP_ZONE_ID,
    data: {
      accepts: ["source-layer", "draw-order-item", "draw-order-move-zone-item"],
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        p: 1,
        boxSizing: "border-box",
        backgroundColor: isOver
          ? isDarkMode
            ? "#1e293b"
            : "#e3f2fd"
          : isDarkMode
            ? "#121212"
            : "#fafafa",
        border: isOver ? "2px dashed" : "1px solid",
        borderColor: isOver ? "primary.main" : "#ddd",
        borderRadius: 2,
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
  );
};

export interface DrawOrderListPanelProps {
  layerIds: string[];
  layerNameById: Map<string, string>;
  activeId: string | null;
  insertIndex: number | null;
  onRemove: (layerId: string) => void;
  emptyLabel: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  recentlyAddedLayerIds?: ReadonlySet<string>;
}

export function DrawOrderListPanel({
  layerIds,
  layerNameById,
  activeId,
  insertIndex,
  onRemove,
  emptyLabel,
  scrollRef,
  recentlyAddedLayerIds,
}: DrawOrderListPanelProps) {
  const previewRows = useMemo(
    () => buildDrawOrderPreviewRows(layerIds, activeId, insertIndex),
    [layerIds, activeId, insertIndex],
  );

  const shadowLayerName = getDrawOrderActiveDragName(activeId, layerNameById);
  const draggedLayerId = getDraggedLayerId(activeId);

  const edgeTopActive = insertIndex === 0;
  const edgeBottomActive =
    insertIndex !== null && insertIndex === layerIds.length;

  return (
    <DrawOrderDropZone>
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {layerIds.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minHeight: 120,
              color: "text.secondary",
              p: 2,
              flexDirection: "column",
              gap: 1,
            }}
          >
            {activeId && insertIndex === 0 && shadowLayerName ? (
              <Box sx={{ width: "100%" }}>
                <DrawOrderInsertionShadow layerName={shadowLayerName} />
              </Box>
            ) : null}
            <Typography variant="body2" textAlign="center">
              {emptyLabel}
            </Typography>
          </Box>
        ) : (
          <List
            sx={{
              position: "relative",
              width: "100%",
              p: 0,
              transition: "padding 0.2s ease",
            }}
          >
            <DrawOrderEdgeDrop
              id={DRAW_ORDER_EDGE_TOP_ID}
              active={edgeTopActive}
            />
            {previewRows.map((row, rowIndex) => {
              if (row.type === "shadow") {
                if (!shadowLayerName) return null;
                return (
                  <DrawOrderInsertionShadow
                    key={`shadow-${rowIndex}`}
                    layerName={shadowLayerName}
                  />
                );
              }

              const name = layerNameById.get(row.layerId);
              if (!name) return null;

              return (
                <DrawOrderListItem
                  key={drawOrderItemId(row.layerId)}
                  layerId={row.layerId}
                  layerName={name}
                  orderIndex={layerIds.indexOf(row.layerId)}
                  isDragging={row.layerId === draggedLayerId}
                  isRecentlyAdded={recentlyAddedLayerIds?.has(row.layerId) ?? false}
                  onRemove={() => onRemove(row.layerId)}
                />
              );
            })}
            <DrawOrderEdgeDrop
              id={DRAW_ORDER_EDGE_BOTTOM_ID}
              active={edgeBottomActive}
            />
          </List>
        )}
      </Box>
    </DrawOrderDropZone>
  );
}

export function getDrawOrderActiveDragName(
  activeId: string | null,
  layerNameById: Map<string, string>,
): string | null {
  if (!activeId) return null;
  const draggedLayerId = getDraggedLayerId(activeId);
  return draggedLayerId
    ? (layerNameById.get(draggedLayerId) ?? null)
    : null;
}
