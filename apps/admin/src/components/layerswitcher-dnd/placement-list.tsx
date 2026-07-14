import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import {
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  Switch,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, DragIndicator } from "@mui/icons-material";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { TreeItem, TreeItems } from "dnd-kit-sortable-tree";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import GroupCompositionSummary from "../group-composition-summary";
import type { TreeItemData, ItemType } from "./types";
import { ID_DELIMITER } from "./types";
import {
  DND_DRAG_HANDLE_SX,
  DND_ITEM_TITLE_SX,
  DND_TREE_ICON_BUTTON_SX,
  adjustDrawOrderInsertIndex,
  parseSourceId,
} from "./utils";

const PLACEMENT_LIST_PREFIX = "placement-list-";
const INSERTION_SHADOW_HEIGHT = 48;
const INSERTION_GAP = 8;

export const PLACEMENT_DROP_ZONE_ID = "placement-drop-zone";
export const PLACEMENT_EDGE_TOP_ID = "placement-edge-top";
export const PLACEMENT_EDGE_BOTTOM_ID = "placement-edge-bottom";

export const placementListDomId = (treeItemId: string) =>
  `${PLACEMENT_LIST_PREFIX}${treeItemId.replace(/:/g, "_")}`;

export const parsePlacementListDomId = (domId: string): string | null => {
  if (!domId.startsWith(PLACEMENT_LIST_PREFIX)) return null;
  return domId.slice(PLACEMENT_LIST_PREFIX.length).replace(/_/g, ":");
};

export const isValidPlacementDropTarget = (overId: string): boolean =>
  overId === PLACEMENT_DROP_ZONE_ID ||
  overId === PLACEMENT_EDGE_TOP_ID ||
  overId === PLACEMENT_EDGE_BOTTOM_ID ||
  overId.startsWith(PLACEMENT_LIST_PREFIX);

const isSourcePlacementDragId = (id: string) => {
  const parsed = parseSourceId(id);
  return parsed?.type === "layer" || parsed?.type === "group";
};

export type PlacementPreviewRow =
  | { type: "item"; treeItemId: string }
  | { type: "shadow" };

function getDraggedTreeItemId(activeId: string | null): string | null {
  if (!activeId) return null;
  const fromList = parsePlacementListDomId(activeId);
  if (fromList) return fromList;
  if (isSourcePlacementDragId(activeId)) {
    const parsed = parseSourceId(activeId);
    if (!parsed) return null;
    return `${parsed.type}${ID_DELIMITER}${parsed.id}`;
  }
  return null;
}

function resolveInsertIndex(
  overId: string,
  itemIds: string[],
  pointerY: number | null,
): number | null {
  if (overId === PLACEMENT_EDGE_TOP_ID) return 0;
  if (
    overId === PLACEMENT_EDGE_BOTTOM_ID ||
    overId === PLACEMENT_DROP_ZONE_ID
  ) {
    return itemIds.length;
  }
  const treeItemId = parsePlacementListDomId(overId);
  if (!treeItemId) return null;

  const targetIndex = itemIds.indexOf(treeItemId);
  if (targetIndex === -1) return null;

  const overElement = document.getElementById(overId);
  if (overElement && pointerY !== null) {
    const rect = overElement.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return pointerY < centerY ? targetIndex : targetIndex + 1;
  }

  return targetIndex + 1;
}

function computePlacementInsertIndex(
  overId: string,
  activeItemId: string | null,
  itemIds: string[],
  insertIndex: number | null,
  pointerY: number | null,
): number {
  if (insertIndex !== null) {
    return insertIndex;
  }

  const fallback = resolveInsertIndex(overId, itemIds, pointerY);
  if (fallback !== null) return fallback;

  const draggedTreeItemId = getDraggedTreeItemId(activeItemId);
  if (draggedTreeItemId) {
    const draggedIndex = itemIds.indexOf(draggedTreeItemId);
    if (draggedIndex !== -1) return draggedIndex;
  }

  return itemIds.length;
}

export function buildPlacementPreviewRows(
  itemIds: string[],
  activeId: string | null,
  insertIndex: number | null,
): PlacementPreviewRow[] {
  if (activeId === null || insertIndex === null) {
    return itemIds.map((treeItemId) => ({ type: "item", treeItemId }));
  }

  const draggedTreeItemId = getDraggedTreeItemId(activeId);
  const baseIds = draggedTreeItemId
    ? itemIds.filter((id) => id !== draggedTreeItemId)
    : itemIds;

  const shadowIndex = draggedTreeItemId
    ? adjustDrawOrderInsertIndex(itemIds, draggedTreeItemId, insertIndex)
    : Math.max(0, Math.min(insertIndex, itemIds.length));

  const rows: PlacementPreviewRow[] = [];
  baseIds.forEach((treeItemId, index) => {
    if (index === shadowIndex) {
      rows.push({ type: "shadow" });
    }
    rows.push({ type: "item", treeItemId });
  });
  if (shadowIndex === baseIds.length) {
    rows.push({ type: "shadow" });
  }

  return rows;
}

export function usePlacementDndHandlers({
  itemIds,
  onReorder,
  onInsertFromSource,
  scrollRef,
}: {
  itemIds: string[];
  onReorder: (itemIds: string[]) => void;
  onInsertFromSource: (type: ItemType, entityId: string, insertIndex: number) => void;
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
    const isPlacementDrag =
      currentActiveId.startsWith(PLACEMENT_LIST_PREFIX) ||
      isSourcePlacementDragId(currentActiveId);

    if (!isPlacementDrag || !isValidPlacementDropTarget(overId)) {
      setInsertIndex(null);
      return;
    }

    setInsertIndex(resolveInsertIndex(overId, itemIds, pointerY));

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

    if (!over || active.id === over.id) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (!isValidPlacementDropTarget(overIdStr)) {
      return;
    }

    if (isSourcePlacementDragId(activeIdStr)) {
      const parsed = parseSourceId(activeIdStr);
      if (parsed?.type !== "layer" && parsed?.type !== "group") {
        return;
      }
    } else if (!activeIdStr.startsWith(PLACEMENT_LIST_PREFIX)) {
      return;
    }

    const resolvedInsertIndex = computePlacementInsertIndex(
      overIdStr,
      activeIdStr,
      itemIds,
      currentInsertIndex,
      pointerY,
    );

    if (isSourcePlacementDragId(activeIdStr)) {
      const parsed = parseSourceId(activeIdStr);
      if (parsed?.type === "layer" || parsed?.type === "group") {
        onInsertFromSource(parsed.type, parsed.id, resolvedInsertIndex);
      }
      return;
    }

    const draggedTreeItemId = parsePlacementListDomId(activeIdStr);
    if (draggedTreeItemId) {
      const newIds = itemIds.filter((id) => id !== draggedTreeItemId);
      const adjustedIndex = adjustDrawOrderInsertIndex(
        itemIds,
        draggedTreeItemId,
        resolvedInsertIndex,
      );
      newIds.splice(adjustedIndex, 0, draggedTreeItemId);
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

const PlacementInsertionShadow: React.FC<{ itemName: string }> = ({
  itemName,
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
        animation: "placementShadowPulse 1.2s ease-in-out infinite",
        "@keyframes placementShadowPulse": {
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
        title={itemName}
        sx={{ ...DND_ITEM_TITLE_SX, fontStyle: "italic" }}
      >
        {itemName}
      </Typography>
    </Box>
  );
};

const PlacementEdgeDrop: React.FC<{
  id: string;
  active: boolean;
}> = ({ id, active }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        minHeight: active || isOver ? INSERTION_SHADOW_HEIGHT / 2 : 12,
        transition: "min-height 0.2s ease",
      }}
    />
  );
};

const PlacementListItem: React.FC<{
  item: TreeItem<TreeItemData>;
  isDragging: boolean;
  onRemove: () => void;
  onToggleVisibleAtStart?: (visible: boolean) => void;
  onToggleToggled?: (toggled: boolean) => void;
  onToggleExpanded?: (expanded: boolean) => void;
}> = ({
  item,
  isDragging,
  onRemove,
  onToggleVisibleAtStart,
  onToggleToggled,
  onToggleExpanded,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { t } = useTranslation();
  const itemDomId = placementListDomId(item.id.toString());
  const isGroup = item.type === "group";
  const isLayer = item.type === "layer";

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging: isDraggingFromKit,
  } = useDraggable({
    id: itemDomId,
    data: { type: "placement-item", treeItemId: item.id },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: itemDomId,
    data: { accepts: ["source-layer", "source-group", "placement-item"] },
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
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        cursor: showAsDragging ? "grabbing" : "grab",
        border: "1px solid #ddd",
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
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          title={item.name}
          sx={{
            ...DND_ITEM_TITLE_SX,
            fontWeight: isGroup ? 600 : 400,
            color: isGroup ? "primary.main" : "text.primary",
          }}
        >
          {item.name}
        </Typography>

        {isLayer ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mt: 0.5,
            }}
          >
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={t("map.layerActive")}
            />
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  size="small"
                  checked={item.visibleAtStart ?? false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleVisibleAtStart?.(e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label={
                <Typography variant="caption">
                  {t("map.layerVisibleAtStart")}
                </Typography>
              }
            />
          </Box>
        ) : null}

        {isGroup ? (
          <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {item.layerCount !== undefined ||
            item.nestedGroupCount !== undefined ? (
                <GroupCompositionSummary
                  meta={{
                    layerCount: item.layerCount ?? 0,
                    nestedGroupCount: item.nestedGroupCount ?? 0,
                    toggleAllEnabled: item.toggled,
                  }}
                  compact
                />
            ) : null}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t("map.groupActiveOnMap")}
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={item.toggled ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleToggled?.(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Typography variant="caption">
                    {t("map.groupToggleAll")}
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={item.expanded ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleExpanded?.(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Typography variant="caption">
                    {t("map.groupExpandedAtStart")}
                  </Typography>
                }
              />
            </Box>
          </Box>
        ) : null}
      </Box>

      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
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
    </ListItem>
  );
};

const PlacementDropZone: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { setNodeRef, isOver } = useDroppable({
    id: PLACEMENT_DROP_ZONE_ID,
    data: { accepts: ["source-layer", "source-group", "placement-item"] },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 0,
        height: "100%",
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

export interface PlacementListPanelProps {
  items: TreeItems<TreeItemData>;
  itemById: Map<string, TreeItem<TreeItemData>>;
  itemNameByTreeItemId: Map<string, string>;
  activeId: string | null;
  insertIndex: number | null;
  onRemove: (treeItemId: string) => void;
  onToggleVisibleAtStart: (treeItemId: string, visible: boolean) => void;
  onToggleToggled: (treeItemId: string, toggled: boolean) => void;
  onToggleExpanded: (treeItemId: string, expanded: boolean) => void;
  emptyLabel: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function PlacementListPanel({
  items,
  itemById,
  itemNameByTreeItemId,
  activeId,
  insertIndex,
  onRemove,
  onToggleVisibleAtStart,
  onToggleToggled,
  onToggleExpanded,
  emptyLabel,
  scrollRef,
}: PlacementListPanelProps) {
  const itemIds = useMemo(
    () => items.map((item) => item.id.toString()),
    [items],
  );

  const previewRows = useMemo(
    () => buildPlacementPreviewRows(itemIds, activeId, insertIndex),
    [itemIds, activeId, insertIndex],
  );

  const shadowItemName = getPlacementActiveDragName(
    activeId,
    itemNameByTreeItemId,
  );
  const draggedTreeItemId = getDraggedTreeItemId(activeId);

  const edgeTopActive = insertIndex === 0;
  const edgeBottomActive =
    insertIndex !== null && insertIndex === itemIds.length;

  return (
    <PlacementDropZone>
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
        {items.length === 0 ? (
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
            {activeId && insertIndex === 0 && shadowItemName ? (
              <Box sx={{ width: "100%" }}>
                <PlacementInsertionShadow itemName={shadowItemName} />
              </Box>
            ) : null}
            <Typography variant="body2" textAlign="center">
              {emptyLabel}
            </Typography>
          </Box>
        ) : (
          <List sx={{ position: "relative", width: "100%", p: 0 }}>
            <PlacementEdgeDrop
              id={PLACEMENT_EDGE_TOP_ID}
              active={edgeTopActive}
            />
            {previewRows.map((row, rowIndex) => {
              if (row.type === "shadow") {
                if (!shadowItemName) return null;
                return (
                  <PlacementInsertionShadow
                    key={`shadow-${rowIndex}`}
                    itemName={shadowItemName}
                  />
                );
              }

              const item = itemById.get(row.treeItemId);
              if (!item) return null;

              return (
                <PlacementListItem
                  key={placementListDomId(row.treeItemId)}
                  item={item}
                  isDragging={row.treeItemId === draggedTreeItemId}
                  onRemove={() => onRemove(row.treeItemId)}
                  onToggleVisibleAtStart={(visible) =>
                    onToggleVisibleAtStart(row.treeItemId, visible)
                  }
                  onToggleToggled={(toggled) =>
                    onToggleToggled(row.treeItemId, toggled)
                  }
                  onToggleExpanded={(expanded) =>
                    onToggleExpanded(row.treeItemId, expanded)
                  }
                />
              );
            })}
            <PlacementEdgeDrop
              id={PLACEMENT_EDGE_BOTTOM_ID}
              active={edgeBottomActive}
            />
          </List>
        )}
      </Box>
    </PlacementDropZone>
  );
}

export function getPlacementActiveDragName(
  activeId: string | null,
  itemNameByTreeItemId: Map<string, string>,
): string | null {
  const treeItemId = getDraggedTreeItemId(activeId);
  return treeItemId ? (itemNameByTreeItemId.get(treeItemId) ?? null) : null;
}
