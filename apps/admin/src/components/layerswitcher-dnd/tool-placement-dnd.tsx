import React, { useState, useMemo } from "react";
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
  useDraggable,
  pointerWithin,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Switch,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  Layers as LayersIcon,
  Search as SearchIcon,
  Bookmark as BookmarkIcon,
  Print as PrintIcon,
  Create as DrawIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  Directions as RouteIcon,
  Straighten as MeasureIcon,
  MyLocation as LocationIcon,
  FilterAlt as FilterIcon,
  ZoomIn as ZoomIcon,
  Fullscreen as FullscreenIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  MoreHoriz as MoreIcon,
  FormatShapes as SketchIcon,
  Description as DocumentIcon,
  AddLocation as AddLocationIcon,
  Tune as TuneIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Place as AnchorIcon,
  Panorama as PanoramaIcon,
  CompareArrows as CompareIcon,
  BarChart as AnalyticsIcon,
  Visibility as VisibilityIcon,
  PhotoCamera as CameraIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { TreeItem, TreeItems } from "dnd-kit-sortable-tree";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../store/use-app-state-store";
import { ItemType, TreeItemData, SourceItem, ID_DELIMITER } from "./types";
import { ToolPlacementWindow } from "./tool-placement-window";
import { ToolPlacement } from "./tool-placement-window";

// Map tool types to their corresponding icon components (lowercase keys to match backend)
const TOOL_ICON_MAP: Record<
  string,
  React.ComponentType<{ fontSize?: "small" | "inherit" | "medium" | "large" }>
> = {
  layerswitcher: LayersIcon,
  search: SearchIcon,
  bookmarks: BookmarkIcon,
  print: PrintIcon,
  draw: DrawIcon,
  edit: EditIcon,
  infoclick: InfoIcon,
  information: InfoIcon,
  informative: DocumentIcon,
  sharelink: ShareIcon,
  routing: RouteIcon,
  measure: MeasureIcon,
  location: LocationIcon,
  filter: FilterIcon,
  zoom: ZoomIcon,
  fullscreen: FullscreenIcon,
  help: HelpIcon,
  settings: SettingsIcon,
  sketch: SketchIcon,
  coordinates: AddLocationIcon,
  buffer: TuneIcon,
  anchor: AnchorIcon,
  streetview: PanoramaIcon,
  panorama: PanoramaIcon,
  compare: CompareIcon,
  analytics: AnalyticsIcon,
  documenthandler: DocumentIcon,
  fir: AnalyticsIcon,
  kir: AnalyticsIcon,
  fmeserver: BuildIcon,
  geosuiteexport: DownloadIcon,
  timeslider: TimelineIcon,
  export: DownloadIcon,
  import: UploadIcon,
  propertychecker: VisibilityIcon,
  collector: CameraIcon,
  vtsearch: SearchIcon,
};

// Helper to get icon component for a tool name
const getToolIconComponent = (
  toolName: string
): React.ComponentType<{
  fontSize?: "small" | "inherit" | "medium" | "large";
}> => {
  // Convert to lowercase to match the map keys
  return TOOL_ICON_MAP[toolName.toLowerCase()] ?? MoreIcon;
};

// Compact draggable item for grid layout
interface CompactDraggableItemProps {
  item: { id: string; name: string };
  type: ItemType;
  icon: React.ReactNode;
}

const CompactDraggableItem: React.FC<CompactDraggableItemProps> = ({
  item,
  type,
  icon,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${type}::${item.id}`,
    data: { type, item },
  });

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      elevation={1}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 2,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
        "&:hover": {
          backgroundColor: isDarkMode ? "#3a3a3a" : "#f5f5f5",
        },
      }}
    >
      {icon}
      <Typography
        variant="caption"
        noWrap
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.name}
      </Typography>
    </Paper>
  );
};

// Sortable item for items within dropzones
interface SortableZoneItemProps {
  id: string;
  name: string;
  onRemove?: () => void;
  isControlButton?: boolean;
  isWidget?: boolean;
}

const SortableZoneItem: React.FC<SortableZoneItemProps> = ({
  id,
  name,
  onRemove,
  isControlButton = false,
  isWidget = false,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = getToolIconComponent(name);

  if (isControlButton) {
    return (
      <Paper
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        elevation={1}
        sx={{
          width: 45,
          height: 45,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
          borderRadius: 1,
          color: isDarkMode ? "#fff" : "#333",
          cursor: "grab",
          position: "relative",
          "&:hover .remove-btn": {
            opacity: 1,
          },
        }}
        title={name}
      >
        <IconComponent fontSize="medium" />
        {onRemove && (
          <IconButton
            className="remove-btn"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 24,
              height: 24,
              opacity: 0,
              backgroundColor: "error.main",
              color: "#fff",
              "&:hover": { backgroundColor: "error.dark" },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Paper>
    );
  }

  if (isWidget) {
    return (
      <Paper
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        elevation={1}
        sx={{
          height: 70,
          py: 1,
          px: 1.5,
          mb: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
          cursor: "grab",
          position: "relative",
          "&:hover .remove-btn": {
            opacity: 1,
          },
        }}
      >
        <IconComponent fontSize="large" />
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
          }}
        >
          {name}
        </Typography>
        {onRemove && (
          <IconButton
            className="remove-btn"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{
              width: 28,
              height: 28,
              opacity: 0,
              ml: 0.5,
              color: "error.main",
              "&:hover": { color: "error.dark" },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      elevation={1}
      sx={{
        py: 1,
        px: 1.5,
        mb: 0.75,
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
        cursor: "grab",
        position: "relative",
        "&:hover .remove-btn": {
          opacity: 1,
        },
      }}
    >
      <IconComponent fontSize="medium" />
      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
        {name}
      </Typography>
      {onRemove && (
        <IconButton
          className="remove-btn"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            width: 28,
            height: 28,
            opacity: 0,
            ml: 0.5,
            color: "error.main",
            "&:hover": { color: "error.dark" },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </Paper>
  );
};

interface ToolPlacementDnDProps {
  /** Available tools to drag from source */
  tools: SourceItem[];
  /** Items in drawer zone */
  drawerItems: TreeItems<TreeItemData>;
  onDrawerItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Items in widget left zone */
  widgetLeftItems: TreeItems<TreeItemData>;
  onWidgetLeftItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Items in widget right zone */
  widgetRightItems: TreeItems<TreeItemData>;
  onWidgetRightItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Items in control button zone */
  controlButtonItems: TreeItems<TreeItemData>;
  onControlButtonItemsChange: (items: TreeItems<TreeItemData>) => void;
  /** Background image for the placement window */
  backgroundImage?: string;
}

export const ToolPlacementDnD: React.FC<ToolPlacementDnDProps> = ({
  tools,
  drawerItems,
  onDrawerItemsChange,
  widgetLeftItems,
  onWidgetLeftItemsChange,
  widgetRightItems,
  onWidgetRightItemsChange,
  controlButtonItems,
  onControlButtonItemsChange,
  backgroundImage,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const [search, setSearch] = useState("");
  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // const [hoveredZone, setHoveredZone] = useState<ToolPlacement | null>(null);
  const [hideBackground, setHiddenBackground] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Collect all added tool IDs from all zones
  const addedToolIds = useMemo(() => {
    const ids = new Set<string>();
    const collectIds = (items: TreeItems<TreeItemData>) => {
      items.forEach((item) => {
        ids.add(item.id.toString());
        if (item.children) collectIds(item.children);
      });
    };
    collectIds(drawerItems);
    collectIds(widgetLeftItems);
    collectIds(widgetRightItems);
    collectIds(controlButtonItems);
    return ids;
  }, [drawerItems, widgetLeftItems, widgetRightItems, controlButtonItems]);

  // Filter tools by search and exclude already added ones
  const filteredTools = useMemo(() => {
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) &&
        !addedToolIds.has(`tool${ID_DELIMITER}${tool.id}`)
    );
  }, [tools, search, addedToolIds]);

  const handleDragStart = (e: DragStartEvent) => {
    const activeId = e.active.id.toString();

    console.log("Drag started:", e);

    // Check if it's a source tool being dragged
    const data = e.active.data.current as
      | { type: ItemType; item: { id: string; name: string } }
      | undefined;
    if (data?.item) {
      setActiveDrag({
        id: activeId,
        name: data.item.name,
      });
      return;
    }

    // Check if it's an item from a zone being dragged
    const allZoneItems = [
      ...drawerItems,
      ...widgetLeftItems,
      ...widgetRightItems,
      ...controlButtonItems,
    ];
    const zoneItem = allZoneItems.find((item) => item.id === activeId);
    if (zoneItem) {
      setActiveDrag({
        id: activeId,
        name: zoneItem.name,
      });
    }
  };

  // const handleDragOver = (e: DragOverEvent) => {
  //   const overId = e.over?.id?.toString() ?? null;
  //   const targetZones: ToolPlacement[] = [
  //     "drawer",
  //     "widgetLeft",
  //     "widgetRight",
  //     "controlButton",
  //   ];

  //   if (targetZones.includes(overId as ToolPlacement)) {
  //     setHoveredZone(overId as ToolPlacement);
  //   } else {
  //     setHoveredZone(null);
  //   }
  // };

  // Helper to find which zone an item belongs to
  const findZoneForItem = (
    itemId: string
  ): {
    zone: ToolPlacement;
    items: TreeItems<TreeItemData>;
    onChange: (items: TreeItems<TreeItemData>) => void;
  } | null => {
    const containsId = (
      items: TreeItems<TreeItemData>,
      id: string
    ): boolean => {
      for (const it of items) {
        if (it.id === id) return true;
        if (it.children && containsId(it.children, id)) return true;
      }
      return false;
    };

    if (containsId(drawerItems, itemId)) {
      return {
        zone: "drawer",
        items: drawerItems,
        onChange: onDrawerItemsChange,
      };
    }
    if (containsId(widgetLeftItems, itemId)) {
      return {
        zone: "widgetLeft",
        items: widgetLeftItems,
        onChange: onWidgetLeftItemsChange,
      };
    }
    if (containsId(widgetRightItems, itemId)) {
      return {
        zone: "widgetRight",
        items: widgetRightItems,
        onChange: onWidgetRightItemsChange,
      };
    }
    if (containsId(controlButtonItems, itemId)) {
      return {
        zone: "controlButton",
        items: controlButtonItems,
        onChange: onControlButtonItemsChange,
      };
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Check if the active item is from a zone
    const activeZone = findZoneForItem(activeId);
    const overZone = findZoneForItem(overId);

    // Check if dropping on a zone container
    const targetZones: ToolPlacement[] = [
      "drawer",
      "widgetLeft",
      "widgetRight",
      "controlButton",
    ];
    const isDropOnZoneContainer = targetZones.includes(overId as ToolPlacement);

    // If active item is from a zone
    if (activeZone) {
      // Dropping on another item in the same zone - reorder
      if (overZone && activeZone.zone === overZone.zone) {
        const oldIndex = activeZone.items.findIndex((i) => i.id === activeId);
        const newIndex = activeZone.items.findIndex((i) => i.id === overId);
        if (oldIndex !== newIndex) {
          activeZone.onChange(
            arrayMove([...activeZone.items], oldIndex, newIndex)
          );
        }
        return;
      }

      // Dropping on own zone container - do nothing
      if (isDropOnZoneContainer && overId === activeZone.zone) {
        return;
      }

      // Dropping on a different zone (container or item in another zone)
      const targetZone: ToolPlacement | null = isDropOnZoneContainer
        ? (overId as ToolPlacement)
        : overZone?.zone ?? null;

      if (!targetZone) return;

      // Block adding to full widget zones (but allow if moving FROM that zone)
      if (
        targetZone === "widgetLeft" &&
        widgetLeftItems.length >= 3 &&
        activeZone.zone !== "widgetLeft"
      ) {
        return;
      }
      if (
        targetZone === "widgetRight" &&
        widgetRightItems.length >= 3 &&
        activeZone.zone !== "widgetRight"
      ) {
        return;
      }

      const itemToMove = activeZone.items.find((i) => i.id === activeId);
      if (!itemToMove) return;

      // Remove from old zone
      activeZone.onChange(activeZone.items.filter((i) => i.id !== activeId));

      // Add to new zone
      const getZoneData = (zone: ToolPlacement) => {
        switch (zone) {
          case "drawer":
            return { items: drawerItems, onChange: onDrawerItemsChange };
          case "widgetLeft":
            return {
              items: widgetLeftItems,
              onChange: onWidgetLeftItemsChange,
            };
          case "widgetRight":
            return {
              items: widgetRightItems,
              onChange: onWidgetRightItemsChange,
            };
          case "controlButton":
            return {
              items: controlButtonItems,
              onChange: onControlButtonItemsChange,
            };
        }
      };
      const target = getZoneData(targetZone);

      if (overZone) {
        // Insert at specific position
        const insertIndex = overZone.items.findIndex((i) => i.id === overId);
        const newItems = [...target.items];
        newItems.splice(insertIndex, 0, itemToMove);
        target.onChange(newItems);
      } else {
        target.onChange([...target.items, itemToMove]);
      }
      return;
    }

    // New item from source tools - only if dropping on a zone
    if (!isDropOnZoneContainer && !overZone) return;

    const targetZone: ToolPlacement = isDropOnZoneContainer
      ? (overId as ToolPlacement)
      : overZone!.zone;

    // Block adding new items to full widget zones
    if (targetZone === "widgetLeft" && widgetLeftItems.length >= 3) {
      return;
    }
    if (targetZone === "widgetRight" && widgetRightItems.length >= 3) {
      return;
    }

    const dragData = active.data.current as
      | { type: ItemType; item: { id: string; name: string } }
      | undefined;

    if (!dragData?.item) return;

    const newItem: TreeItem<TreeItemData> = {
      id: `tool${ID_DELIMITER}${dragData.item.id}`,
      name: dragData.item.name,
      type: "tool",
      canHaveChildren: false,
    };

    // Add to appropriate zone based on drop target
    switch (targetZone) {
      case "drawer":
        onDrawerItemsChange([...drawerItems, newItem]);
        break;
      case "widgetLeft":
        onWidgetLeftItemsChange([...widgetLeftItems, newItem]);
        break;
      case "widgetRight":
        onWidgetRightItemsChange([...widgetRightItems, newItem]);
        break;
      case "controlButton":
        onControlButtonItemsChange([...controlButtonItems, newItem]);
        break;
    }
  };

  // Helper to remove an item from a zone
  const removeFromZone = (itemId: string, zone: ToolPlacement) => {
    switch (zone) {
      case "drawer":
        onDrawerItemsChange(drawerItems.filter((i) => i.id !== itemId));
        break;
      case "widgetLeft":
        onWidgetLeftItemsChange(widgetLeftItems.filter((i) => i.id !== itemId));
        break;
      case "widgetRight":
        onWidgetRightItemsChange(
          widgetRightItems.filter((i) => i.id !== itemId)
        );
        break;
      case "controlButton":
        onControlButtonItemsChange(
          controlButtonItems.filter((i) => i.id !== itemId)
        );
        break;
    }
  };

  const renderSortableZoneItems = (
    items: TreeItems<TreeItemData>,
    zone: ToolPlacement
  ) => {
    const isControlButton = zone === "controlButton";
    const isWidget = zone === "widgetLeft" || zone === "widgetRight";
    const itemIds = items.map((item) => item.id.toString());
    return (
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <Box
          sx={{
            fontSize: 11,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: isControlButton ? "center" : "stretch",
            gap: isControlButton ? 0.5 : 0,
          }}
        >
          {items.map((item) => (
            <SortableZoneItem
              key={item.id}
              id={item.id.toString()}
              name={item.name}
              isControlButton={isControlButton}
              isWidget={isWidget}
              onRemove={() => removeFromZone(item.id.toString(), zone)}
            />
          ))}
        </Box>
      </SortableContext>
    );
  };

  console.log(widgetLeftItems.length);

  return (
    <Paper sx={{ p: 2, background: isDarkMode ? "#121212" : "#efefef" }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        // onDragOver={handleDragOver}
      >
        {/* Top: Visual placement window */}
        <ToolPlacementWindow
          height={650}
          backgroundImage={backgroundImage}
          drawerContent={renderSortableZoneItems(drawerItems, "drawer")}
          widgetLeftContent={renderSortableZoneItems(
            widgetLeftItems,
            "widgetLeft"
          )}
          widgetRightContent={renderSortableZoneItems(
            widgetRightItems,
            "widgetRight"
          )}
          controlButtonContent={renderSortableZoneItems(
            controlButtonItems,
            "controlButton"
          )}
          isWidgetLeftFull={widgetLeftItems.length >= 3}
          isWidgetRightFull={widgetRightItems.length >= 3}
          isWidgetLeftEmpty={widgetLeftItems.length === 0}
          isWidgetRightEmpty={widgetRightItems.length === 0}
          isControlButtonEmpty={controlButtonItems.length === 0}
          hideBackground={hideBackground}
        />

        {/* Below: Source tools list */}
        <Paper
          sx={{
            mt: 2,
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 1.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t("common.tools")}
              </Typography>
              <TextField
                size="small"
                sx={{ width: 250 }}
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
            <Box
              sx={{
                alignItems: "center",
                ml: "auto",
                display: "flex",
              }}
            >
              <Switch
                size="small"
                checked={hideBackground}
                onChange={(e) => setHiddenBackground(e.target.checked)}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 0.75,
            }}
          >
            {filteredTools.map((tool) => {
              const IconComponent = getToolIconComponent(tool.name);
              return (
                <CompactDraggableItem
                  key={tool.id}
                  item={tool}
                  type="tool"
                  icon={<IconComponent fontSize="small" />}
                />
              );
            })}
          </Box>
        </Paper>

        <DragOverlay>
          {activeDrag && (
            <Paper
              sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              {(() => {
                const OverlayIcon = getToolIconComponent(activeDrag.name);
                return <OverlayIcon fontSize="small" />;
              })()}
              <Typography>{activeDrag.name}</Typography>
            </Paper>
          )}
        </DragOverlay>
      </DndContext>
    </Paper>
  );
};

export default ToolPlacementDnD;
