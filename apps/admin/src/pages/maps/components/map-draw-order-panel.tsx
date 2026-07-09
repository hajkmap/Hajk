import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { TreeItems } from "dnd-kit-sortable-tree";
import {
  Box,
  List,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import LayersIcon from "@mui/icons-material/Layers";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../../store/use-app-state-store";
import {
  DrawOrderCatalogItem,
  DrawOrderListPanel,
  DrawOrderMoveZone,
  DND_DRAG_HANDLE_SX,
  DND_ITEM_TITLE_SX,
  getDrawOrderActiveDragName,
  scrollDrawOrderItemIntoView,
  TreeItemData,
  useDrawOrderDndHandlers,
  isDrawOrderMoveZoneItemId,
} from "../../../components/layerswitcher-dnd";
import {
  drawOrderTreeToLayerIds,
  entityIdFromItemId,
  reorderDrawOrderByLayerIds,
} from "../map-group-placement-utils";

const DRAW_ORDER_DND_HEIGHT = {
  xs: 400,
  lg: "calc(100vh - 400px)",
} as const;

const RECENTLY_ADDED_HIGHLIGHT_MS = 4000;

type LeftCatalogTab = "moveZone" | "allLayers";

interface MapCatalogLayer {
  id: string;
  name: string;
}

interface MapDrawOrderPanelProps {
  catalogLayers: MapCatalogLayer[];
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
  onInsertLayer: (layer: MapCatalogLayer, insertIndex: number) => void;
  onRemoveLayer: (layerId: string) => void;
}

export default function MapDrawOrderPanel({
  catalogLayers,
  items,
  onItemsChange,
  onInsertLayer,
  onRemoveLayer,
}: MapDrawOrderPanelProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [search, setSearch] = useState("");
  const [leftCatalogTab, setLeftCatalogTab] =
    useState<LeftCatalogTab>("moveZone");
  const [moveZoneLayerIds, setMoveZoneLayerIds] = useState<string[]>([]);
  const [recentlyAddedLayerIds, setRecentlyAddedLayerIds] = useState<
    Set<string>
  >(() => new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recentHighlightTimeoutsRef = useRef<Map<string, number>>(new Map());

  const markRecentlyAdded = useCallback((layerId: string) => {
    setRecentlyAddedLayerIds((prev) => new Set(prev).add(layerId));

    const existingTimeout = recentHighlightTimeoutsRef.current.get(layerId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedLayerIds((prev) => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
      recentHighlightTimeoutsRef.current.delete(layerId);
    }, RECENTLY_ADDED_HIGHLIGHT_MS);

    recentHighlightTimeoutsRef.current.set(layerId, timeoutId);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const layerIds = useMemo(() => drawOrderTreeToLayerIds(items), [items]);

  const drawOrderIndexByLayerId = useMemo(() => {
    const map = new Map<string, number>();
    layerIds.forEach((id, index) => map.set(id, index + 1));
    return map;
  }, [layerIds]);

  const drawOrderLayerIds = useMemo(
    () => new Set(layerIds),
    [layerIds],
  );

  const moveZoneLayerIdSet = useMemo(
    () => new Set(moveZoneLayerIds),
    [moveZoneLayerIds],
  );

  const layerNameById = useMemo(() => {
    const map = new Map<string, string>();
    catalogLayers.forEach((layer) => map.set(layer.id, layer.name));
    items.forEach((item) => {
      map.set(entityIdFromItemId(item.id), item.name);
    });
    return map;
  }, [catalogLayers, items]);

  const filteredLayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogLayers
      .filter((layer) => !query || layer.name.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => {
        const aInDrawOrder = drawOrderLayerIds.has(a.id);
        const bInDrawOrder = drawOrderLayerIds.has(b.id);
        const aInMoveZone = moveZoneLayerIdSet.has(a.id);
        const bInMoveZone = moveZoneLayerIdSet.has(b.id);
        const catalogGroup = (inDrawOrder: boolean, inMoveZone: boolean) => {
          if (inDrawOrder) return 2;
          if (inMoveZone) return 1;
          return 0;
        };
        const aGroup = catalogGroup(aInDrawOrder, aInMoveZone);
        const bGroup = catalogGroup(bInDrawOrder, bInMoveZone);
        if (aGroup !== bGroup) {
          return aGroup - bGroup;
        }
        if (aInDrawOrder && bInDrawOrder) {
          const aIndex = drawOrderIndexByLayerId.get(a.id) ?? 0;
          const bIndex = drawOrderIndexByLayerId.get(b.id) ?? 0;
          return bIndex - aIndex;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [
    catalogLayers,
    search,
    drawOrderLayerIds,
    drawOrderIndexByLayerId,
    moveZoneLayerIdSet,
  ]);

  const {
    activeId,
    insertIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDrawOrderDndHandlers({
    layerIds,
    scrollRef,
    onReorder: (nextLayerIds) => {
      onItemsChange(reorderDrawOrderByLayerIds(items, nextLayerIds));
    },
    onInsertFromSource: (layerId, insertIndex) => {
      const layer = catalogLayers.find((entry) => entry.id === layerId);
      if (!layer) return;
      onInsertLayer(layer, insertIndex);
      setMoveZoneLayerIds((prev) => prev.filter((id) => id !== layerId));
      markRecentlyAdded(layerId);
    },
    onMoveToZone: (layerId) => {
      const nextLayerIds = layerIds.filter((id) => id !== layerId);
      onItemsChange(reorderDrawOrderByLayerIds(items, nextLayerIds));
      setMoveZoneLayerIds((prev) =>
        prev.includes(layerId) ? prev : [...prev, layerId],
      );
      setLeftCatalogTab("moveZone");
    },
    onInsertFromMoveZone: (layerId, insertIndex) => {
      const layer =
        catalogLayers.find((entry) => entry.id === layerId) ??
        (layerNameById.get(layerId)
          ? { id: layerId, name: layerNameById.get(layerId)! }
          : undefined);
      if (!layer) return;
      onInsertLayer(layer, insertIndex);
      setMoveZoneLayerIds((prev) => prev.filter((id) => id !== layerId));
      markRecentlyAdded(layerId);
    },
  });

  const activeDragName = getDrawOrderActiveDragName(activeId, layerNameById);

  const scrollToDrawOrderLayer = (layerId: string) => {
    scrollDrawOrderItemIntoView(layerId, scrollRef.current);
  };

  const addLayerToDrawOrderEnd = (layer: MapCatalogLayer) => {
    onInsertLayer(layer, layerIds.length);
    markRecentlyAdded(layer.id);
    window.setTimeout(() => scrollToDrawOrderLayer(layer.id), 50);
  };

  const handleRemoveLayer = (layerId: string) => {
    const timeoutId = recentHighlightTimeoutsRef.current.get(layerId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      recentHighlightTimeoutsRef.current.delete(layerId);
    }
    setRecentlyAddedLayerIds((prev) => {
      if (!prev.has(layerId)) return prev;
      const next = new Set(prev);
      next.delete(layerId);
      return next;
    });
    if (moveZoneLayerIds.includes(layerId)) {
      setMoveZoneLayerIds((prev) => prev.filter((id) => id !== layerId));
    }
    onRemoveLayer(layerId);
  };

  const moveZoneLayers = useMemo(
    () =>
      moveZoneLayerIds
        .map((id) => {
          const name = layerNameById.get(id);
          return name ? { id, name } : null;
        })
        .filter(
          (layer): layer is { id: string; name: string } => layer != null,
        ),
    [moveZoneLayerIds, layerNameById],
  );

  return (
    <Paper sx={{ p: 2, background: isDarkMode ? "#121212" : "#efefef" }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
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
                height: DRAW_ORDER_DND_HEIGHT,
                minHeight: DRAW_ORDER_DND_HEIGHT,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t("map.drawOrderLayersSource")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2, display: "block" }}
              >
                {leftCatalogTab === "moveZone"
                  ? t("map.drawOrderMoveZoneHelp")
                  : t("map.drawOrderCatalogHelp")}
              </Typography>

              <Tabs
                value={leftCatalogTab === "moveZone" ? 0 : 1}
                onChange={(_, index) =>
                  setLeftCatalogTab(index === 0 ? "moveZone" : "allLayers")
                }
                sx={{ mb: 2, minHeight: 36, flexShrink: 0 }}
              >
                <Tab
                  label={t("map.drawOrderMoveZone")}
                  sx={{ minHeight: 36, py: 0.5 }}
                />
                <Tab
                  label={t("map.drawOrderAllLayers")}
                  sx={{ minHeight: 36, py: 0.5 }}
                />
              </Tabs>

              {leftCatalogTab === "moveZone" ? (
                <DrawOrderMoveZone
                  layers={moveZoneLayers}
                  dropDisabled={Boolean(
                    activeId && isDrawOrderMoveZoneItemId(activeId),
                  )}
                />
              ) : (
                <>
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
                    {catalogLayers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("map.drawOrderNoCatalogLayers")}
                      </Typography>
                    ) : filteredLayers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("map.drawOrderNoSearchResults")}
                      </Typography>
                    ) : (
                      filteredLayers.map((layer) => (
                        <DrawOrderCatalogItem
                          key={layer.id}
                          layer={layer}
                          inDrawOrder={drawOrderLayerIds.has(layer.id)}
                          inMoveZone={moveZoneLayerIdSet.has(layer.id)}
                          drawOrderIndex={drawOrderIndexByLayerId.get(layer.id)}
                          onScrollToDrawOrder={
                            drawOrderLayerIds.has(layer.id)
                              ? () => scrollToDrawOrderLayer(layer.id)
                              : undefined
                          }
                          onRemoveFromDrawOrder={
                            drawOrderLayerIds.has(layer.id)
                              ? () => handleRemoveLayer(layer.id)
                              : undefined
                          }
                          onAddToDrawOrderEnd={
                            !drawOrderLayerIds.has(layer.id) &&
                            !moveZoneLayerIdSet.has(layer.id)
                              ? () => addLayerToDrawOrderEnd(layer)
                              : undefined
                          }
                        />
                      ))
                    )}
                  </List>
                </>
              )}
            </Paper>
          </Box>

          <Box sx={{ flex: { xs: "1 1 auto", lg: "1 1 0" }, minWidth: 0 }}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: DRAW_ORDER_DND_HEIGHT,
                minHeight: DRAW_ORDER_DND_HEIGHT,
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <LayersIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t("map.drawOrder")}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                {t("map.drawOrderLayersHelp")}
              </Typography>

              <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
                <DrawOrderListPanel
                  layerIds={layerIds}
                  layerNameById={layerNameById}
                  activeId={activeId}
                  insertIndex={insertIndex}
                  scrollRef={scrollRef}
                  emptyLabel={t("map.drawOrderDropEmpty")}
                  recentlyAddedLayerIds={recentlyAddedLayerIds}
                  onRemove={handleRemoveLayer}
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
