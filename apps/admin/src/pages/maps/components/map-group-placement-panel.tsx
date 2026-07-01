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
import {
  Box,
  List,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import CollectionsIcon from "@mui/icons-material/Collections";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../../store/use-app-state-store";
import {
  DraggableSourceItem,
  SortableDropZone,
  TreeItemData,
  ID_DELIMITER,
  collectItemIds,
  enforceZoneRules,
  DND_ITEM_TITLE_SX,
} from "../../../components/layerswitcher-dnd";

interface MapGroupPlacementPanelProps {
  catalogGroups: { id: string; name: string }[];
  items: TreeItems<TreeItemData>;
  onItemsChange: (items: TreeItems<TreeItemData>) => void;
}

const GROUP_ZONE_RULES = {
  acceptedItemTypes: ["group"] as const,
  allowNesting: false,
};

export default function MapGroupPlacementPanel({
  catalogGroups,
  items,
  onItemsChange,
}: MapGroupPlacementPanelProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [search, setSearch] = useState("");
  const [activeDragName, setActiveDragName] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const placedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    collectItemIds(items, ids);
    return ids;
  }, [items]);

  const availableGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogGroups
      .filter(
        (group) =>
          !placedGroupIds.has(`group${ID_DELIMITER}${group.id}`) &&
          (!query || group.name.toLowerCase().includes(query)),
      )
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [catalogGroups, placedGroupIds, search]);

  const applyGroupRules = (nextItems: TreeItems<TreeItemData>) =>
    onItemsChange(enforceZoneRules(nextItems, GROUP_ZONE_RULES));

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { item: { name: string } }
      | undefined;
    setActiveDragName(data?.item.name ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragName(null);
    const { over } = event;
    if (!over) return;

    const dragData = event.active.data.current as
      | { item: { id: string; name: string } }
      | undefined;
    if (!dragData?.item) return;

    const source = catalogGroups.find((g) => g.id === dragData.item.id);
    if (!source) return;

    const newItem: TreeItem<TreeItemData> = {
      id: `group${ID_DELIMITER}${source.id}`,
      name: source.name,
      type: "group",
      canHaveChildren: false,
      toggled: false,
      expanded: false,
    };

    const targetId = over.id.toString();

    if (targetId === "map-groups") {
      applyGroupRules([...items, newItem]);
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
                {t("map.groupPlacement.availableGroups")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2, display: "block" }}
              >
                {t("map.groupPlacement.availableGroupsHelp")}
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
                {availableGroups.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("map.groupPlacement.noAvailableGroups")}
                  </Typography>
                ) : (
                  availableGroups.map((group) => (
                    <DraggableSourceItem
                      key={group.id}
                      item={group}
                      type="group"
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
                id="map-groups"
                title={t("map.groupPlacement.onMap.title")}
                helpText={t("map.groupPlacement.onMap.help")}
                clientBucketLabel={t("map.groupPlacement.onMap.clientBucket")}
                titleIcon={<CollectionsIcon />}
                items={items}
                onItemsChange={applyGroupRules}
                acceptedItemTypes={[...GROUP_ZONE_RULES.acceptedItemTypes]}
                allowNesting={GROUP_ZONE_RULES.allowNesting}
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
