import React, { useState, useMemo } from "react";
import { TreeItem } from "dnd-kit-sortable-tree";
import {
  Tabs,
  Tab,
  Typography,
  TextField,
  List,
  Grid2 as Grid,
  Paper,
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
  enforceItemRules,
  collectItemIds,
  findGroupInTree,
  insertIntoGroup,
} from "./utils";
import { DraggableSourceItem } from "./draggable-source-item";
import { SortableDropZone } from "./sortable-drop-zone";

export const LayerSwitcherDnD: React.FC<LayerSwitcherDnDProps> = ({
  layers = [],
  groups = [],
  tools = [],
  dropZones,
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Collect all added item IDs from all drop zones
  const addedItemIds = useMemo(() => {
    const ids = new Set<string>();
    dropZones.forEach((zone) => collectItemIds(zone.items, ids));
    return ids;
  }, [dropZones]);

  const filterBySearch = <T extends { id: string; name: string }>(
    data: T[],
    type: ItemType
  ) =>
    data.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) &&
        !addedItemIds.has(`${type}${ID_DELIMITER}${i.id}`)
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

    const newItem: TreeItem<TreeItemData> = {
      id: `${itemType}${ID_DELIMITER}${source.id}`,
      name: source.name,
      type: itemType,
      children: ITEM_CAPABILITIES[itemType].canHaveChildren ? [] : undefined,
      canHaveChildren: ITEM_CAPABILITIES[itemType].canHaveChildren,
    };

    const targetId = over.id.toString();

    // Check each drop zone
    for (const zone of dropZones) {
      // Check if dropped on this zone's root
      if (targetId === zone.id) {
        zone.onItemsChange(enforceItemRules([...zone.items, newItem]));
        return;
      }

      // Check if dropped on a group within this zone
      const targetGroup = findGroupInTree(zone.items, targetId);
      if (targetGroup) {
        zone.onItemsChange(
          enforceItemRules(insertIntoGroup(zone.items, targetId, newItem))
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
        <Grid container spacing={3}>
          <Grid size={4}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                maxHeight: 630,
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
                sx={{ my: 2, flexShrink: 0 }}
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <List sx={{ overflowY: "auto", overflowX: "hidden", flex: 1 }}>
                {currentTabType === "layer" &&
                  filteredLayers.map((i) => (
                    <DraggableSourceItem key={i.id} item={i} type="layer" />
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
          </Grid>

          <Grid size={8}>
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
                  items={zone.items}
                  onItemsChange={zone.onItemsChange}
                  onAddToGroup={handleAddToGroup}
                  minHeight={dropZones.length === 1 ? 598 : undefined}
                />
              ))}
            </Paper>
          </Grid>
        </Grid>

        <DragOverlay>
          {activeDrag && (
            <Paper
              sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <DragIndicator />
              <Typography>{activeDrag.name}</Typography>
            </Paper>
          )}
        </DragOverlay>
      </DndContext>
    </Paper>
  );
};
