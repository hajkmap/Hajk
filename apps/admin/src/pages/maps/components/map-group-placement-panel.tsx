import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TreeItem, TreeItems } from "dnd-kit-sortable-tree";
import { Box, List, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import MapIcon from "@mui/icons-material/Map";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../../store/use-app-state-store";
import {
  DraggableSourceItem,
  SortableDropZone,
  TreeItemData,
  ID_DELIMITER,
  enforceZoneRules,
  DND_ITEM_TITLE_SX,
  ItemType,
} from "../../../components/layerswitcher-dnd";
import {
  groupToCatalogMeta,
  type GroupCatalogMeta,
} from "../../groups/utils/group-composition-stats";
import { collectPlacedItemIds } from "../map-group-placement-utils";

interface MapCatalogLayer {
  id: string;
  name: string;
}

interface MapCatalogGroup {
  id: string;
  name: string;
  layerCount?: number;
  nestedGroupCount?: number;
}

interface MapGroupPlacementPanelProps {
  catalogLayers: MapCatalogLayer[];
  catalogGroups: MapCatalogGroup[];
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
}

const CONTENT_ZONE_RULES = {
  acceptedItemTypes: ["layer", "group"] as const,
  allowNesting: false,
};

export default function MapGroupPlacementPanel({
  catalogLayers,
  catalogGroups,
  items,
  onItemsChange,
}: MapGroupPlacementPanelProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [leftTab, setLeftTab] = useState(0);
  const [search, setSearch] = useState("");
  const [activeDragName, setActiveDragName] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const placedItemIds = useMemo(() => collectPlacedItemIds(items), [items]);

  const availableLayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogLayers
      .filter(
        (layer) =>
          !placedItemIds.has(`layer${ID_DELIMITER}${layer.id}`) &&
          (!query || layer.name.toLowerCase().includes(query)),
      )
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [catalogLayers, placedItemIds, search]);

  const availableGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogGroups
      .filter(
        (group) =>
          !placedItemIds.has(`group${ID_DELIMITER}${group.id}`) &&
          (!query || group.name.toLowerCase().includes(query)),
      )
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [catalogGroups, placedItemIds, search]);

  const applyContentRules = (nextItems: TreeItems<TreeItemData>) =>
    onItemsChange(
      enforceZoneRules(nextItems, CONTENT_ZONE_RULES) as TreeItems<TreeItemData>,
    );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { item: { name: string } }
      | undefined;
    setActiveDragName(data?.item.name ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragName(null);
    const { over } = event;
    if (!over || over.id.toString() !== "map-content") return;

    const dragData = event.active.data.current as
      | { type: ItemType; item: { id: string; name: string } }
      | undefined;
    if (!dragData?.item || !dragData.type) return;

    if (dragData.type === "layer") {
      const source = catalogLayers.find((layer) => layer.id === dragData.item.id);
      if (!source) return;

      const newItem: TreeItem<TreeItemData> = {
        id: `layer${ID_DELIMITER}${source.id}`,
        name: source.name,
        type: "layer",
        canHaveChildren: false,
        visibleAtStart: false,
      };
      applyContentRules([...items, newItem]);
      return;
    }

    if (dragData.type === "group") {
      const source = catalogGroups.find((group) => group.id === dragData.item.id);
      if (!source) return;

      const newItem: TreeItem<TreeItemData> = {
        id: `group${ID_DELIMITER}${source.id}`,
        name: source.name,
        type: "group",
        canHaveChildren: false,
        toggled: true,
        expanded: false,
        layerCount: source.layerCount,
        nestedGroupCount: source.nestedGroupCount,
      };
      applyContentRules([...items, newItem]);
    }
  };

  return (
    <Paper sx={{ p: 2, background: isDarkMode ? "#121212" : "#efefef" }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
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
                maxHeight: 630,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t("map.groupPlacement.availableContent")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2, display: "block" }}
              >
                {t("map.groupPlacement.availableContentHelp")}
              </Typography>

              <Tabs
                value={leftTab}
                onChange={(_, value) => setLeftTab(value)}
                sx={{ mb: 2, minHeight: 36, flexShrink: 0 }}
              >
                <Tab
                  label={t("common.layers")}
                  sx={{ minHeight: 36, py: 0.5 }}
                />
                <Tab
                  label={t("common.layerGroups")}
                  sx={{ minHeight: 36, py: 0.5 }}
                />
              </Tabs>

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
                {leftTab === 0 ? (
                  availableLayers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("map.groupPlacement.noAvailableLayers")}
                    </Typography>
                  ) : (
                    availableLayers.map((layer) => (
                      <DraggableSourceItem
                        key={layer.id}
                        item={layer}
                        type="layer"
                        showInactiveStatus
                      />
                    ))
                  )
                ) : availableGroups.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("map.groupPlacement.noAvailableGroups")}
                  </Typography>
                ) : (
                  availableGroups.map((group) => (
                    <DraggableSourceItem
                      key={group.id}
                      item={group}
                      type="group"
                      groupMeta={
                        groupToCatalogMeta(group) satisfies GroupCatalogMeta
                      }
                    />
                  ))
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
                maxHeight: 630,
                overflowY: "auto",
              }}
            >
              <SortableDropZone
                id="map-content"
                title={t("map.groupPlacement.onMap.title")}
                helpText={t("map.groupPlacement.onMap.help")}
                clientBucketLabel={t("map.groupPlacement.onMap.clientBucket")}
                titleIcon={<MapIcon />}
                items={items}
                onItemsChange={applyContentRules}
                acceptedItemTypes={[...CONTENT_ZONE_RULES.acceptedItemTypes]}
                allowNesting={CONTENT_ZONE_RULES.allowNesting}
                showLayerPlacementStatus
                showGroupPlacementStatus
                minHeight={598}
              />
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
              }}
            >
              <DragIndicator sx={{ mt: 0.25, flexShrink: 0 }} />
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
