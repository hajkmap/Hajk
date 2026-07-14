import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { TreeItems } from "dnd-kit-sortable-tree";
import { Box, Chip, List, Paper, TextField, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import MapIcon from "@mui/icons-material/Map";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../../store/use-app-state-store";
import {
  DND_DRAG_HANDLE_SX,
  DND_ITEM_TITLE_SX,
  PlacementCatalogItem,
  PlacementListPanel,
  TreeItemData,
  ID_DELIMITER,
  getPlacementActiveDragName,
  updateItemInTree,
  usePlacementDndHandlers,
} from "../../../components/layerswitcher-dnd";
import {
  groupToCatalogMeta,
  type GroupCatalogMeta,
} from "../../groups/utils/group-composition-stats";
import {
  createGroupTreeItem,
  extractGroupItems,
  extractLayerItems,
  insertItemInPlacement,
  mergeMapContentLayersAndGroups,
  placementTreeToItemIds,
  removeItemFromPlacement,
  reorderPlacementByItemIds,
} from "../map-group-placement-utils";

interface MapCatalogGroup {
  id: string;
  name: string;
  layerCount?: number;
  nestedGroupCount?: number;
}

interface MapGroupPlacementPanelProps {
  catalogGroups: MapCatalogGroup[];
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
}

const MAP_CONTENT_DND_HEIGHT = {
  xs: "clamp(360px, calc(100vh - 260px), 640px)",
  lg: "clamp(640px, calc(100vh - 400px), 800px)",
} as const;

export default function MapGroupPlacementPanel({
  catalogGroups,
  items,
  onItemsChange,
}: MapGroupPlacementPanelProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const layerItems = useMemo(() => extractLayerItems(items), [items]);
  const groupItems = useMemo(() => extractGroupItems(items), [items]);

  const applyGroupPlacementChange = (nextGroups: TreeItems<TreeItemData>) => {
    onItemsChange(mergeMapContentLayersAndGroups(layerItems, nextGroups));
  };

  const placedGroupIds = useMemo(
    () => new Set(groupItems.map((item) => item.id.toString())),
    [groupItems],
  );

  const groupById = useMemo(
    () => new Map(groupItems.map((item) => [item.id.toString(), item])),
    [groupItems],
  );

  const placementNameByTreeItemId = useMemo(() => {
    const map = new Map<string, string>();
    groupItems.forEach((item) => map.set(item.id.toString(), item.name));
    catalogGroups.forEach((group) => {
      map.set(`group${ID_DELIMITER}${group.id}`, group.name);
    });
    return map;
  }, [groupItems, catalogGroups]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogGroups
      .filter((group) => !query || group.name.toLowerCase().includes(query))
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [catalogGroups, search]);

  const groupItemIds = useMemo(
    () => placementTreeToItemIds(groupItems),
    [groupItems],
  );

  const {
    activeId,
    insertIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = usePlacementDndHandlers({
    itemIds: groupItemIds,
    scrollRef,
    onReorder: (nextItemIds) => {
      applyGroupPlacementChange(
        reorderPlacementByItemIds(groupItems, nextItemIds),
      );
    },
    onInsertFromSource: (type, entityId, insertIndex) => {
      if (type !== "group") return;

      const group = catalogGroups.find((entry) => entry.id === entityId);
      if (!group) return;
      applyGroupPlacementChange(
        insertItemInPlacement(
          groupItems,
          createGroupTreeItem(group),
          insertIndex,
        ),
      );
    },
  });

  const activeDragName = getPlacementActiveDragName(
    activeId,
    placementNameByTreeItemId,
  );

  const handleRemove = (treeItemId: string) => {
    applyGroupPlacementChange(removeItemFromPlacement(groupItems, treeItemId));
  };

  const handleToggleToggled = (treeItemId: string, toggled: boolean) => {
    applyGroupPlacementChange(
      updateItemInTree(groupItems, treeItemId, (item) => ({
        ...item,
        toggled,
      })),
    );
  };

  const handleToggleExpanded = (treeItemId: string, expanded: boolean) => {
    applyGroupPlacementChange(
      updateItemInTree(groupItems, treeItemId, (item) => ({
        ...item,
        expanded,
      })),
    );
  };

  return (
    <Paper sx={{ p: 2, background: isDarkMode ? "#121212" : "#efefef" }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              flex: { xs: "1 1 auto", lg: "0 0 33.333%" },
              maxWidth: { lg: "33.333%" },
              minWidth: 0,
            }}
          >
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: MAP_CONTENT_DND_HEIGHT,
                minHeight: MAP_CONTENT_DND_HEIGHT,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t("map.groupPlacement.availableGroups")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2, display: "block" }}
              >
                {t("map.placementGroupsCatalogHelp")}
              </Typography>

              <TextField
                size="small"
                fullWidth
                sx={{ mb: 2, flexShrink: 0 }}
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <List
                sx={{
                  overflowY: "auto",
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                {catalogGroups.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("map.placementNoCatalogGroups")}
                  </Typography>
                ) : filteredGroups.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("map.placementNoSearchResults")}
                  </Typography>
                ) : (
                  filteredGroups.map((group) => {
                    const treeItemId = `group${ID_DELIMITER}${group.id}`;
                    const inPlacement = placedGroupIds.has(treeItemId);
                    return (
                      <PlacementCatalogItem
                        key={group.id}
                        item={group}
                        type="group"
                        inPlacement={inPlacement}
                        groupMeta={
                          groupToCatalogMeta(group) satisfies GroupCatalogMeta
                        }
                        onRemoveFromPlacement={
                          inPlacement
                            ? () => handleRemove(treeItemId)
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </List>
            </Paper>
          </Box>

          <Box sx={{ flex: { xs: "1 1 auto", lg: "1 1 0" }, minWidth: 0 }}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: MAP_CONTENT_DND_HEIGHT,
                minHeight: MAP_CONTENT_DND_HEIGHT,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <MapIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t("map.groupPlacement.onMap.title")}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={t("map.groupPlacement.onMap.clientBucket")}
                  sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                {t("map.placementGroupsOnMapHelp")}
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <PlacementListPanel
                  items={groupItems}
                  itemById={groupById}
                  itemNameByTreeItemId={placementNameByTreeItemId}
                  activeId={activeId}
                  insertIndex={insertIndex}
                  scrollRef={scrollRef}
                  emptyLabel={t("map.placementGroupsDropEmpty")}
                  onRemove={handleRemove}
                  onToggleVisibleAtStart={() => {}}
                  onToggleToggled={handleToggleToggled}
                  onToggleExpanded={handleToggleExpanded}
                />
              </Box>
            </Paper>
          </Box>
        </Box>

        <DragOverlay>
          {activeDragName ? (
            <Paper
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                maxWidth: "100%",
                background: isDarkMode ? "#1a1a1a" : "#fff",
                opacity: 0.55,
                boxShadow: 3,
              }}
            >
              <DragIndicator sx={{ ...DND_DRAG_HANDLE_SX, mt: 0.25 }} />
              <Typography title={activeDragName} sx={DND_ITEM_TITLE_SX}>
                {activeDragName}
              </Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Paper>
  );
}
