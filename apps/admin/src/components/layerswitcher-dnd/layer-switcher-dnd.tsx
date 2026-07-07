import React, { useState, useMemo } from "react";
import { TreeItem } from "dnd-kit-sortable-tree";
import {
  Tabs,
  Tab,
  Typography,
  TextField,
  List,
  Paper,
  Box,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import {
  ItemType,
  TreeItemData,
  LayerSwitcherDnDProps,
  ID_DELIMITER,
  ITEM_CAPABILITIES,
} from "./types";
import {
  parseSourceId,
  enforceZoneRules,
  collectItemIds,
  findGroupInTree,
  insertIntoGroup,
  zoneAcceptsItemType,
  isValidExternalDropTarget,
} from "./utils";
import { DraggableSourceItem } from "./draggable-source-item";
import { DND_ITEM_TITLE_SX } from "./utils";
import { SortableDropZone } from "./sortable-drop-zone";

export const LayerSwitcherDnD: React.FC<LayerSwitcherDnDProps> = ({
  layers = [],
  groups = [],
  tools = [],
  dropZones,
  showSourceLayerStatus = false,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const [leftTab, setLeftTab] = useState(0);
  const [search, setSearch] = useState("");
  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    name: string;
    type: ItemType;
  } | null>(null);

  // Determine which tabs to show based on passed props
  const availableTabs = useMemo(() => {
    const tabs: { type: ItemType; label: string }[] = [];
    if (layers.length > 0) tabs.push({ type: "layer", label: "common.layers" });
    if (groups.length > 0) tabs.push({ type: "group", label: "common.groups" });
    if (tools.length > 0) tabs.push({ type: "tool", label: "common.tools" });
    return tabs;
  }, [layers.length, groups.length, tools.length]);

  // Get the current tab's item type
  const currentTabType = availableTabs[leftTab]?.type;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Collect all added item IDs from all drop zones
  const addedItemIds = useMemo(() => {
    const ids = new Set<string>();
    dropZones.forEach((zone) => collectItemIds(zone.items, ids));
    return ids;
  }, [dropZones]);

  const filterBySearch = <T extends { id: string; name: string }>(
    data: T[],
    type: ItemType,
  ) =>
    data.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) &&
        !addedItemIds.has(`${type}${ID_DELIMITER}${i.id}`),
    );

  const filteredLayers = filterBySearch(layers, "layer");
  const filteredGroups = filterBySearch(groups, "group");
  const filteredTools = filterBySearch(tools, "tool");

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as
      | { type: ItemType; item: { id: string; name: string } }
      | undefined;
    if (data?.type && data?.item) {
      setActiveDrag({
        id: e.active.id.toString(),
        name: data.item.name,
        type: data.type,
      });
    } else {
      setActiveDrag({
        id: e.active.id.toString(),
        name: e.active.id.toString(),
        type: "layer",
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over || active.id === over.id) {
      return;
    }

    const dragData = active.data.current as
      | { type: ItemType; item: { id: string; name: string } }
      | undefined;

    let itemType: ItemType;
    let source: { id: string; name: string } | undefined;

    if (dragData?.type && dragData?.item) {
      itemType = dragData.type;
      source = dragData.item;
    } else {
      const parsed = parseSourceId(active.id.toString());
      if (!parsed) return;

      itemType = parsed.type;
      const id = parsed.id;

      source =
        itemType === "layer"
          ? layers.find((l) => l.id === id)
          : itemType === "group"
            ? groups.find((g) => g.id === id)
            : tools.find((t) => t.id === id);
    }

    if (!source) return;

    const newItemId = `${itemType}${ID_DELIMITER}${source.id}`;

    // Check each drop zone — only accept configured item types.
    for (const zone of dropZones) {
      if (!zoneAcceptsItemType(zone, itemType)) {
        continue;
      }

      const targetId = over.id.toString();
      if (!isValidExternalDropTarget(targetId, zone)) {
        continue;
      }

      if (collectItemIds(zone.items).has(newItemId)) {
        return;
      }

      const newItem: TreeItem<TreeItemData> = {
        id: newItemId,
        name: source.name,
        type: itemType,
        children:
          zone.allowNesting !== false &&
          ITEM_CAPABILITIES[itemType].canHaveChildren
            ? []
            : undefined,
        canHaveChildren:
          zone.allowNesting === false
            ? false
            : ITEM_CAPABILITIES[itemType].canHaveChildren,
        ...(itemType === "layer" ? { visibleAtStart: false } : {}),
      };

      // Dropped on this zone's root
      if (targetId === zone.id) {
        zone.onItemsChange(
          enforceZoneRules([...zone.items, newItem], {
            acceptedItemTypes: zone.acceptedItemTypes,
            allowNesting: zone.allowNesting,
          }),
        );
        return;
      }

      // Nested drop — only when the zone allows nesting and target is a group.
      if (zone.allowNesting === false) {
        continue;
      }

      const targetGroup = findGroupInTree(zone.items, targetId);
      if (targetGroup) {
        zone.onItemsChange(
          enforceZoneRules(insertIntoGroup(zone.items, targetId, newItem), {
            acceptedItemTypes: zone.acceptedItemTypes,
            allowNesting: zone.allowNesting,
          }),
        );
        return;
      }
    }
  };

  const handleAddToGroup = (groupId: string) => {
    console.log("Add to group:", groupId);
    // TODO: Implement add to group dialog
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
              {availableTabs.length > 1 && (
                <Tabs
                  value={leftTab}
                  onChange={(_, v: number) => setLeftTab(v)}
                >
                  {availableTabs.map((tab) => (
                    <Tab key={tab.type} label={t(tab.label)} />
                  ))}
                </Tabs>
              )}

              <TextField
                size="small"
                fullWidth
                sx={{ my: 2, flexShrink: 0, minWidth: 0 }}
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <List
                sx={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                {currentTabType === "layer" &&
                  filteredLayers.map((i) => (
                    <DraggableSourceItem
                      key={i.id}
                      item={i}
                      type="layer"
                      showInactiveStatus={showSourceLayerStatus}
                    />
                  ))}
                {currentTabType === "group" &&
                  filteredGroups.map((i) => (
                    <DraggableSourceItem key={i.id} item={i} type="group" />
                  ))}
                {currentTabType === "tool" &&
                  filteredTools.map((i) => (
                    <DraggableSourceItem key={i.id} item={i} type="tool" />
                  ))}
              </List>
            </Paper>
          </Box>

          <Box sx={{ flex: { xs: "1 1 auto", lg: "1 1 0" }, minWidth: 0 }}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: 630,
                overflowY: "auto",
              }}
            >
              {dropZones.map((zone) => (
                <SortableDropZone
                  key={zone.id}
                  id={zone.id}
                  title={zone.title}
                  titleIcon={zone.titleIcon}
                  helpText={zone.helpText}
                  clientBucketLabel={zone.clientBucketLabel}
                  items={zone.items}
                  onItemsChange={zone.onItemsChange}
                  acceptedItemTypes={zone.acceptedItemTypes}
                  allowNesting={zone.allowNesting}
                  onAddToGroup={handleAddToGroup}
                  minHeight={dropZones.length === 1 ? 598 : undefined}
                  enableRemove={zone.enableRemove ?? true}
                  showLayerPlacementStatus={zone.showLayerPlacementStatus}
                />
              ))}
            </Paper>
          </Box>
        </Box>

        <DragOverlay>
          {activeDrag && (
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
              <Typography title={activeDrag.name} sx={DND_ITEM_TITLE_SX}>
                {activeDrag.name}
              </Typography>
            </Paper>
          )}
        </DragOverlay>
      </DndContext>
    </Paper>
  );
};
