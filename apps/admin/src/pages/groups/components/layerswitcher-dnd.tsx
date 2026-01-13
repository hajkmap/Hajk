import React, { useState, useMemo, useEffect } from "react";
import {
  SimpleTreeItemWrapper,
  SortableTree,
  TreeItemComponentProps,
  TreeItems,
  TreeItem,
} from "dnd-kit-sortable-tree";
import {
  Tabs,
  Tab,
  Typography,
  TextField,
  List,
  ListItem,
  Grid2 as Grid,
  Paper,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  DragIndicator,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { useLayers } from "../../../api/layers";
import { useGroups } from "../../../api/groups";
import useAppStateStore from "../../../store/use-app-state-store";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

interface TreeItemData {
  id: string;
  name: string;
  type: "group" | "layer";
}

const DraggableSourceItem: React.FC<{
  item: { id: string; name: string };
  type: "group" | "layer";
}> = ({ item, type }) => {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `source-${type}-${item.id}`,
    data: {
      type,
      item,
    },
  });

  return (
    <ListItem
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        cursor: "grab",
        border: "1px solid #ddd",
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        opacity: isDragging ? 0.5 : 1,
        transition: "opacity 0.2s ease",
        position: "relative",
        "&:hover": {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <DragIndicator sx={{ mr: 1, color: "text.secondary" }} />
      <Typography variant="body2">{item.name}</Typography>
    </ListItem>
  );
};

const TreeItemComponent = React.forwardRef<
  HTMLDivElement,
  TreeItemComponentProps<TreeItemData> & {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onAdd?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
  }
>((props, ref) => {
  const {
    item,
    isOver,
    isOverParent,
    onMoveUp,
    onMoveDown,
    onAdd,
    canMoveUp,
    canMoveDown,
  } = props;
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const isGroup = item.type === "group";
  const { t } = useTranslation();
  const handleRemove = React.useCallback(() => {
    if (props.onRemove) {
      props.onRemove();
    }
  }, [props]);

  const isTargetGroup = isGroup && isOverParent;
  const isReorderTarget = isOver && !isOverParent;

  return (
    <SimpleTreeItemWrapper {...props} ref={ref}>
      {isReorderTarget && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: isDarkMode ? "#42a5f5" : "#1976d2",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: `0 0 4px ${isDarkMode ? "#42a5f5" : "#1976d2"}`,
          }}
        />
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          backgroundColor: isTargetGroup
            ? isDarkMode
              ? "rgba(66, 165, 245, 0.2)"
              : "rgba(25, 118, 210, 0.12)"
            : isReorderTarget
            ? isDarkMode
              ? "rgba(66, 165, 245, 0.1)"
              : "rgba(25, 118, 210, 0.06)"
            : isDarkMode
            ? "#1a1a1a"
            : "#fff",
          border:
            isTargetGroup || isReorderTarget
              ? `2px solid ${isDarkMode ? "#42a5f5" : "#1976d2"}`
              : "1px solid #ddd",
          borderRadius: 1,
          mb: 0.5,
          minHeight: 48,
          position: "relative",
          transition: "all 0.2s ease",
          boxShadow: isTargetGroup
            ? `0 0 8px ${
                isDarkMode
                  ? "rgba(66, 165, 245, 0.4)"
                  : "rgba(25, 118, 210, 0.3)"
              }`
            : "none",
          "& > *": {
            position: "relative",
            zIndex: 2,
          },
        }}
      >
        <Box
          {...(props.handleProps as Record<string, unknown>)}
          sx={{
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            pointerEvents: "auto",
            "&:active": {
              cursor: "grabbing",
            },
          }}
        >
          <DragIndicator sx={{ color: "text.secondary" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            fontWeight={isGroup ? 600 : 400}
            sx={{
              color: isGroup ? "primary.main" : "text.primary",
            }}
          >
            {item.name ?? ""}
          </Typography>
          {isGroup && (
            <Typography variant="caption" color="text.secondary">
              {t("common.group")}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            position: "relative",
            zIndex: 10,
            pointerEvents: "auto",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {onMoveUp && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={canMoveUp === false}
              sx={{
                "&:hover": {
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                },
                opacity: canMoveUp === false ? 0.3 : 1,
                position: "relative",
                zIndex: 11,
              }}
              title={t("common.moveUp")}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}
          {onMoveDown && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={canMoveDown === false}
              sx={{
                "&:hover": {
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                },
                opacity: canMoveDown === false ? 0.3 : 1,
                position: "relative",
                zIndex: 11,
              }}
              title={t("common.moveDown")}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          )}
          {isGroup && onAdd && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                },
                position: "relative",
                zIndex: 11,
              }}
              title={t("common.addToGroup")}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {props.onRemove && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              sx={{
                "&:hover": {
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                },
                position: "relative",
                zIndex: 11,
              }}
              title={t("common.delete")}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      {isReorderTarget && (
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: isDarkMode ? "#42a5f5" : "#1976d2",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: `0 0 4px ${isDarkMode ? "#42a5f5" : "#1976d2"}`,
          }}
        />
      )}
    </SimpleTreeItemWrapper>
  );
});

TreeItemComponent.displayName = "TreeItemComponent";

const enforceLayerRules = (
  treeItems: TreeItems<TreeItemData>
): TreeItems<TreeItemData> => {
  return treeItems.map((item) => {
    const updatedItem: TreeItem<TreeItemData> = {
      ...item,
      // Layers cannot have children
      canHaveChildren: item.type === "group",
      children:
        item.type === "layer"
          ? undefined
          : item.children
          ? enforceLayerRules(item.children)
          : item.children,
    };
    return updatedItem;
  });
};

const GroupDropDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (action: "reorder" | "insert") => void;
  draggedGroupName: string;
  targetGroupName: string;
  isDarkMode: boolean;
}> = ({
  open,
  onClose,
  onConfirm,
  draggedGroupName,
  targetGroupName,
  isDarkMode,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        },
      }}
    >
      <DialogTitle>{t("common.groupDropAction")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t("common.groupDropQuestion", {
            dragged: draggedGroupName,
            target: targetGroupName,
          })}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onConfirm("reorder")}
            sx={{ justifyContent: "flex-start", textAlign: "left", py: 1.5 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography variant="body1" fontWeight={600}>
                {t("common.reorder")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("common.reorderDescription")}
              </Typography>
            </Box>
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onConfirm("insert")}
            sx={{ justifyContent: "flex-start", textAlign: "left", py: 1.5 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography variant="body1" fontWeight={600}>
                {t("common.insertAsChild")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("common.insertAsChildDescription")}
              </Typography>
            </Box>
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
};

const AddItemsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedLayerIds: string[], selectedGroupIds: string[]) => void;
  layers: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  addedItemIds: Set<string>;
  isDarkMode: boolean;
}> = ({
  open,
  onClose,
  onConfirm,
  layers,
  groups,
  addedItemIds,
  isDarkMode,
}) => {
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const availableLayers = useMemo(
    () =>
      layers
        .filter(
          (layer) =>
            !addedItemIds.has(`layer-${layer.id}`) &&
            layer.name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [layers, addedItemIds, search]
  );

  const availableGroups = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            !addedItemIds.has(`group-${group.id}`) &&
            group.name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [groups, addedItemIds, search]
  );

  const handleLayerToggle = (layerId: string) => {
    setSelectedLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedLayers), Array.from(selectedGroups));
    setSelectedLayers(new Set());
    setSelectedGroups(new Set());
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSelectedLayers(new Set());
    setSelectedGroups(new Set());
    setSearch("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        },
      }}
    >
      <DialogTitle>{t("common.addItemsToGroup")}</DialogTitle>
      <DialogContent>
        <TextField
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ mb: 2, mt: 1 }}
          size="small"
        />
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {availableLayers.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t("common.layers")}
              </Typography>
              <List dense>
                {availableLayers.map((layer) => (
                  <ListItem key={layer.id} disablePadding>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedLayers.has(layer.id)}
                          onChange={() => handleLayerToggle(layer.id)}
                        />
                      }
                      label={layer.name}
                      sx={{ width: "100%" }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {availableGroups.length > 0 && (
            <>
              {availableLayers.length > 0 && <Divider sx={{ my: 2 }} />}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t("common.groups")}
              </Typography>
              <List dense>
                {availableGroups.map((group) => (
                  <ListItem key={group.id} disablePadding>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedGroups.has(group.id)}
                          onChange={() => handleGroupToggle(group.id)}
                        />
                      }
                      label={group.name}
                      sx={{ width: "100%" }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {availableLayers.length === 0 && availableGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {t("common.noAvailableItemsToAdd")}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("common.cancel")}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedLayers.size === 0 && selectedGroups.size === 0}
        >
          {t("common.add")} ({selectedLayers.size + selectedGroups.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DraggableRitordningItem: React.FC<{
  layerId: string;
  layerName: string;
  index: number;
  onRemove: () => void;
  dragOver?: { layerId: string; position: "above" | "below" } | null;
}> = ({ layerId, layerName, index, onRemove, dragOver }) => {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `ritordning-${layerId}`,
    data: {
      type: "ritordning-item",
      layerId,
      index,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `ritordning-${layerId}`,
    data: {
      accepts: ["source-layer", "ritordning-item"],
    },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const showArrowAbove =
    dragOver?.layerId === layerId && dragOver.position === "above";
  const showArrowBelow =
    dragOver?.layerId === layerId && dragOver.position === "below";

  return (
    <ListItem
      id={`ritordning-${layerId}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: isOver
          ? isDarkMode
            ? "rgba(66, 165, 245, 0.2)"
            : "rgba(25, 118, 210, 0.12)"
          : isDarkMode
          ? "#1a1a1a"
          : "#fff",
        cursor: "grab",
        border: isOver
          ? `2px solid ${isDarkMode ? "#42a5f5" : "#1976d2"}`
          : "1px solid #ddd",
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.2s ease",
        position: "relative",
        "&:hover": {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        },
        "&:active": {
          cursor: "grabbing",
        },
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {showArrowAbove || showArrowBelow ? (
        showArrowAbove ? (
          <ArrowUpwardIcon
            sx={{
              color: isDarkMode ? "#42a5f5" : "#1976d2",
              fontSize: "20px",
            }}
          />
        ) : (
          <ArrowDownwardIcon
            sx={{
              color: isDarkMode ? "#42a5f5" : "#1976d2",
              fontSize: "20px",
            }}
          />
        )
      ) : (
        <DragIndicator sx={{ color: "text.secondary" }} />
      )}
      <Typography variant="body2" sx={{ flex: 1 }}>
        {layerName}
      </Typography>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          "&:hover": {
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
          },
        }}
        title={t("common.delete")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </ListItem>
  );
};

const TreeDropZone: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { setNodeRef, isOver } = useDroppable({
    id: "tree-drop-zone",
    data: {
      accepts: ["source-layer", "source-group"],
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 600,
        p: 2,
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
      }}
    >
      {children}
    </Box>
  );
};

const RitordningDropZone: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { setNodeRef, isOver } = useDroppable({
    id: "ritordning-drop-zone",
    data: {
      accepts: ["source-layer"],
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 600,
        p: 2,
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
      }}
    >
      {children}
    </Box>
  );
};

export default function LayerSwitcherDnD() {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();
  const [leftTab, setLeftTab] = useState(0);
  const [rightTab, setRightTab] = useState(0);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<TreeItems<TreeItemData>>([]);
  const [ritordningItems, setRitordningItems] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRightScrollbar, setShowRightScrollbar] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [groupDropDialogOpen, setGroupDropDialogOpen] = useState(false);
  const [pendingGroupDrop, setPendingGroupDrop] = useState<{
    draggedItemId: string;
    draggedItemName: string;
    targetGroupId: string;
    targetGroupName: string;
    isFromSource: boolean;
  } | null>(null);
  const [ritordningDragOver, setRitordningDragOver] = useState<{
    layerId: string;
    position: "above" | "below";
  } | null>(null);
  const [draggedItemInfo, setDraggedItemInfo] = useState<{
    itemId: string;
    itemType: "group" | "layer";
  } | null>(null);
  const itemsBeforeChangeRef = React.useRef<TreeItems<TreeItemData>>([]);
  const leftPanelScrollRef = React.useRef<HTMLDivElement>(null);
  const rightPanelScrollRef = React.useRef<HTMLDivElement>(null);
  const isProcessingGroupDropRef = React.useRef<boolean>(false);

  const { data: layers = [] } = useLayers();
  const { data: groups = [] } = useGroups();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Separate added item IDs for Lagerordning and Ritordning
  const addedItemIdsLagerordning = useMemo(() => {
    const getAllIds = (treeItems: TreeItems<TreeItemData>): string[] => {
      const ids: string[] = [];
      treeItems.forEach((item) => {
        ids.push(item.id.toString());
        if (item.children) {
          ids.push(...getAllIds(item.children));
        }
      });
      return ids;
    };
    return new Set(getAllIds(items));
  }, [items]);

  const addedItemIdsRitordning = useMemo(() => {
    return new Set(ritordningItems.map((id) => `layer-${id}`));
  }, [ritordningItems]);

  // Filtered layers for Lagerordning (excludes items already in Lagerordning tree)
  const filteredLayersLagerordning = useMemo(
    () =>
      layers
        .filter(
          (layer) =>
            layer.name.toLowerCase().includes(search.toLowerCase()) &&
            !addedItemIdsLagerordning.has(`layer-${layer.id}`)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [layers, search, addedItemIdsLagerordning]
  );

  // Filtered layers for Ritordning (excludes items already in Ritordning list)
  const filteredLayersRitordning = useMemo(
    () =>
      layers
        .filter(
          (layer) =>
            layer.name.toLowerCase().includes(search.toLowerCase()) &&
            !addedItemIdsRitordning.has(`layer-${layer.id}`)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [layers, search, addedItemIdsRitordning]
  );

  const filteredGroups = useMemo(
    () =>
      groups
        .filter(
          (group) =>
            group.name.toLowerCase().includes(search.toLowerCase()) &&
            !addedItemIdsLagerordning.has(`group-${group.id}`)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [groups, search, addedItemIdsLagerordning]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeIdStr = event.active.id.toString();
    setActiveId(activeIdStr);
    setRitordningDragOver(null);

    // Store current items state before any changes
    itemsBeforeChangeRef.current = items;

    // Track what's being dragged for SortableTree drops
    if (
      !activeIdStr.startsWith("source-") &&
      !activeIdStr.startsWith("ritordning-")
    ) {
      const draggedItem = findItemInTree(items, activeIdStr);
      if (draggedItem) {
        setDraggedItemInfo({
          itemId: activeIdStr,
          itemType: draggedItem.type,
        });
      }
    } else {
      setDraggedItemInfo(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) {
      setRitordningDragOver(null);
      return;
    }

    const getPointerY = (e: Event | null | undefined): number | null => {
      if (!e) return null;
      if (e instanceof MouseEvent) return e.clientY;
      if (e instanceof TouchEvent && e.touches.length > 0) {
        return e.touches[0].clientY;
      }
      return null;
    };

    const pointerY = getPointerY(event.activatorEvent);
    if (pointerY === null) return;

    // Check if dragging over a Ritordning item (only when on Ritordning tab)
    if (
      rightTab === 1 &&
      typeof event.over.id === "string" &&
      event.over.id.startsWith("ritordning-") &&
      (activeId?.startsWith("ritordning-") ||
        activeId?.startsWith("source-layer-"))
    ) {
      const targetLayerId = event.over.id.replace("ritordning-", "");
      const targetIndex = ritordningItems.indexOf(targetLayerId);

      if (targetIndex !== -1) {
        let position: "above" | "below" = "below";

        if (activeId?.startsWith("ritordning-")) {
          // Dragging an existing ritordning item - compare indices
          const draggedLayerId = activeId.replace("ritordning-", "");
          const draggedIndex = ritordningItems.indexOf(draggedLayerId);

          if (draggedIndex !== -1) {
            // If dragged item is at a higher index (lower in list), it's moving up
            // If dragged item is at a lower index (higher in list), it's moving down
            position = draggedIndex > targetIndex ? "above" : "below";
          }
        } else {
          // Dragging from source - use mouse position to determine
          const overElement = document.getElementById(
            `ritordning-${targetLayerId}`
          );
          if (overElement) {
            const rect = overElement.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            position = pointerY < centerY ? "above" : "below";
          }
        }

        setRitordningDragOver({ layerId: targetLayerId, position });
      } else {
        setRitordningDragOver(null);
      }
    } else {
      // Clear drag over state when not dragging over a Ritordning item
      setRitordningDragOver(null);
    }

    if (leftPanelScrollRef.current && activeId?.startsWith("source-")) {
      const rect = leftPanelScrollRef.current.getBoundingClientRect();
      const scrollThreshold = 50;
      const scrollSpeed = 10;

      if (pointerY < rect.top + scrollThreshold) {
        leftPanelScrollRef.current.scrollBy({
          top: -scrollSpeed,
          behavior: "smooth",
        });
      } else if (pointerY > rect.bottom - scrollThreshold) {
        leftPanelScrollRef.current.scrollBy({
          top: scrollSpeed,
          behavior: "smooth",
        });
      }
    }

    if (rightPanelScrollRef.current) {
      const rect = rightPanelScrollRef.current.getBoundingClientRect();
      const scrollThreshold = 50;
      const scrollSpeed = 10;

      if (pointerY < rect.top + scrollThreshold) {
        rightPanelScrollRef.current.scrollBy({
          top: -scrollSpeed,
          behavior: "smooth",
        });
      } else if (pointerY > rect.bottom - scrollThreshold) {
        rightPanelScrollRef.current.scrollBy({
          top: scrollSpeed,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    if (!activeId) return;

    const handleWheel = (e: WheelEvent) => {
      if (!activeId) return;

      if (leftPanelScrollRef.current) {
        const rect = leftPanelScrollRef.current.getBoundingClientRect();
        const isOverLeft =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isOverLeft) {
          const canScrollUp = leftPanelScrollRef.current.scrollTop > 0;
          const canScrollDown =
            leftPanelScrollRef.current.scrollTop <
            leftPanelScrollRef.current.scrollHeight -
              leftPanelScrollRef.current.clientHeight;

          if (
            (e.deltaY > 0 && canScrollDown) ||
            (e.deltaY < 0 && canScrollUp)
          ) {
            e.preventDefault();
            e.stopPropagation();
            leftPanelScrollRef.current.scrollBy({
              top: e.deltaY,
              behavior: "auto",
            });
            return;
          }
        }
      }

      if (rightPanelScrollRef.current) {
        const rect = rightPanelScrollRef.current.getBoundingClientRect();
        const isOverRight =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isOverRight) {
          const canScrollUp = rightPanelScrollRef.current.scrollTop > 0;
          const canScrollDown =
            rightPanelScrollRef.current.scrollTop <
            rightPanelScrollRef.current.scrollHeight -
              rightPanelScrollRef.current.clientHeight;

          if (
            (e.deltaY > 0 && canScrollDown) ||
            (e.deltaY < 0 && canScrollUp)
          ) {
            e.preventDefault();
            e.stopPropagation();
            rightPanelScrollRef.current.scrollBy({
              top: e.deltaY,
              behavior: "auto",
            });
            return;
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [activeId]);

  useEffect(() => {
    const checkScrollbar = () => {
      if (rightPanelScrollRef.current) {
        const needsScrollbar =
          rightPanelScrollRef.current.scrollHeight >
          rightPanelScrollRef.current.clientHeight;
        setShowRightScrollbar(needsScrollbar);
      }
    };

    checkScrollbar();
    const timer = setTimeout(checkScrollbar, 100);
    return () => clearTimeout(timer);
  }, [items, ritordningItems, rightTab]);

  // Update itemsBeforeChangeRef after a successful group drop insert
  // This prevents the dialog from reappearing when clicking on the container
  useEffect(() => {
    if (isProcessingGroupDropRef.current) {
      // Update the ref to match current items after insert completes
      itemsBeforeChangeRef.current = items;
      // Reset the flag after updating the ref
      isProcessingGroupDropRef.current = false;
    }
  }, [items]);

  const handleMoveUp = (itemId: string) => {
    setItems((prevItems) => {
      const moveItemUp = (
        treeItems: TreeItems<TreeItemData>
      ): TreeItems<TreeItemData> => {
        for (let i = 1; i < treeItems.length; i++) {
          if (treeItems[i].id.toString() === itemId) {
            const newItems = [...treeItems];
            [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
            return newItems;
          }
        }
        return treeItems.map((item) => {
          if (item.children) {
            const updatedChildren = moveItemUp(item.children);
            if (updatedChildren !== item.children) {
              return { ...item, children: updatedChildren };
            }
          }
          return item;
        });
      };
      return enforceLayerRules(moveItemUp(prevItems));
    });
  };

  const handleMoveDown = (itemId: string) => {
    setItems((prevItems) => {
      const moveItemDown = (
        treeItems: TreeItems<TreeItemData>
      ): TreeItems<TreeItemData> => {
        for (let i = 0; i < treeItems.length - 1; i++) {
          if (treeItems[i].id.toString() === itemId) {
            const newItems = [...treeItems];
            [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
            return newItems;
          }
        }
        return treeItems.map((item) => {
          if (item.children) {
            const updatedChildren = moveItemDown(item.children);
            if (updatedChildren !== item.children) {
              return { ...item, children: updatedChildren };
            }
          }
          return item;
        });
      };
      return enforceLayerRules(moveItemDown(prevItems));
    });
  };

  const canMoveUp = (itemId: string): boolean => {
    const findPosition = (
      treeItems: TreeItems<TreeItemData>
    ): number | null => {
      for (let i = 0; i < treeItems.length; i++) {
        if (treeItems[i].id.toString() === itemId) {
          return i;
        }
      }
      for (const item of treeItems) {
        if (item.children) {
          const pos = findPosition(item.children);
          if (pos !== null) return pos;
        }
      }
      return null;
    };
    const position = findPosition(items);
    return position !== null && position > 0;
  };

  const canMoveDown = (itemId: string): boolean => {
    const findPosition = (
      treeItems: TreeItems<TreeItemData>
    ): { index: number; total: number } | null => {
      for (let i = 0; i < treeItems.length; i++) {
        if (treeItems[i].id.toString() === itemId) {
          return { index: i, total: treeItems.length };
        }
      }
      for (const item of treeItems) {
        if (item.children) {
          const pos = findPosition(item.children);
          if (pos !== null) return pos;
        }
      }
      return null;
    };
    const position = findPosition(items);
    return position !== null && position.index < position.total - 1;
  };

  const findItemInTree = (
    treeItems: TreeItems<TreeItemData>,
    itemId: string
  ): TreeItem<TreeItemData> | null => {
    for (const item of treeItems) {
      if (item.id.toString() === itemId) {
        return item;
      }
      if (item.children) {
        const found = findItemInTree(item.children, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  const findItemParent = (
    treeItems: TreeItems<TreeItemData>,
    itemId: string
  ): { parent: TreeItem<TreeItemData> | null; index: number } | null => {
    for (let i = 0; i < treeItems.length; i++) {
      if (treeItems[i].id.toString() === itemId) {
        return { parent: null, index: i };
      }
      const children = treeItems[i].children;
      if (children) {
        const childIndex = children.findIndex(
          (child) => child.id.toString() === itemId
        );
        if (childIndex !== -1) {
          return { parent: treeItems[i], index: childIndex };
        }
        const result = findItemParent(children, itemId);
        if (result) return result;
      }
    }
    return null;
  };

  const detectGroupOnGroupDrop = (
    oldItems: TreeItems<TreeItemData>,
    newItems: TreeItems<TreeItemData>,
    draggedItemId: string
  ): { targetGroupId: string; targetGroupName: string } | null => {
    // Find the dragged item to check its type
    const draggedItem = findItemInTree(oldItems, draggedItemId);
    if (!draggedItem || draggedItem.type !== "group") {
      return null;
    }

    const oldParent = findItemParent(oldItems, draggedItemId);
    const newParent = findItemParent(newItems, draggedItemId);

    // If the item moved to be a child of a group (wasn't before, or different parent)
    if (newParent && newParent.parent && newParent.parent.type === "group") {
      // Check if it's a new parent (wasn't a child before, or parent changed)
      const oldParentId = oldParent?.parent?.id.toString() ?? null;
      const newParentId = newParent.parent.id.toString();

      if (oldParentId !== newParentId) {
        return {
          targetGroupId: newParentId,
          targetGroupName: newParent.parent.name,
        };
      }
    }

    return null;
  };

  const handleAddToGroup = (groupId: string) => {
    setTargetGroupId(groupId);
    setAddDialogOpen(true);
  };

  const handleConfirmAddItems = (
    selectedLayerIds: string[],
    selectedGroupIds: string[]
  ) => {
    if (!targetGroupId) return;

    setItems((prevItems) => {
      const addToGroup = (
        treeItems: TreeItems<TreeItemData>,
        groupId: string
      ): TreeItems<TreeItemData> => {
        return treeItems.map((item) => {
          if (item.id.toString() === groupId && item.type === "group") {
            const newChildren: TreeItem<TreeItemData>[] = [];

            selectedLayerIds.forEach((layerId) => {
              const layer = layers.find((l) => l.id === layerId);
              if (layer) {
                newChildren.push({
                  id: `layer-${layer.id}`,
                  name: layer.name,
                  type: "layer",
                  canHaveChildren: false,
                });
              }
            });

            selectedGroupIds.forEach((groupItemId) => {
              const groupItem = groups.find((g) => g.id === groupItemId);
              if (groupItem) {
                newChildren.push({
                  id: `group-${groupItem.id}`,
                  name: groupItem.name,
                  type: "group",
                  children: [],
                  canHaveChildren: true,
                });
              }
            });

            return {
              ...item,
              children: [...(item.children ?? []), ...newChildren],
            };
          }
          if (item.children) {
            return {
              ...item,
              children: addToGroup(item.children, groupId),
            };
          }
          return item;
        });
      };
      const updated = addToGroup(prevItems, targetGroupId);
      return enforceLayerRules(updated);
    });

    setTargetGroupId(null);
  };

  const handleGroupDropAction = (action: "reorder" | "insert") => {
    if (!pendingGroupDrop) return;

    const { draggedItemId, targetGroupId, isFromSource } = pendingGroupDrop;

    // Mark that we're processing a group drop action to prevent dialog from reappearing
    isProcessingGroupDropRef.current = true;

    if (action === "insert") {
      // Insert as child (existing behavior)
      if (isFromSource) {
        // Handle source group
        const parts = draggedItemId.split("-");
        if (parts.length < 2) return;
        const groupId = parts.slice(1).join("-");
        const sourceGroup = groups.find((g) => g.id === groupId);
        if (!sourceGroup) return;

        const newItem: TreeItem<TreeItemData> = {
          id: `group-${sourceGroup.id}`,
          name: sourceGroup.name,
          type: "group",
          children: [],
          canHaveChildren: true,
        };

        setItems((prevItems) => {
          const addToGroup = (
            treeItems: TreeItems<TreeItemData>,
            groupId: string
          ): TreeItems<TreeItemData> => {
            return treeItems.map((item) => {
              if (item.id.toString() === groupId && item.type === "group") {
                return {
                  ...item,
                  children: [...(item.children ?? []), newItem],
                };
              }
              if (item.children) {
                return {
                  ...item,
                  children: addToGroup(item.children, groupId),
                };
              }
              return item;
            });
          };
          const updated = enforceLayerRules(
            addToGroup(prevItems, targetGroupId)
          );
          // Update the ref immediately to prevent false detection on next interaction
          itemsBeforeChangeRef.current = updated;
          return updated;
        });
      } else {
        // Handle existing group in tree
        setItems((prevItems) => {
          const findAndRemoveItem = (
            treeItems: TreeItems<TreeItemData>,
            itemId: string
          ): {
            item: TreeItem<TreeItemData> | null;
            updatedItems: TreeItems<TreeItemData>;
          } => {
            for (let i = 0; i < treeItems.length; i++) {
              if (treeItems[i].id.toString() === itemId) {
                const item = treeItems[i];
                const updatedItems = treeItems.filter(
                  (_, index) => index !== i
                );
                return { item, updatedItems };
              }
            }

            let foundItem: TreeItem<TreeItemData> | null = null;
            const updatedItems = treeItems.map((item) => {
              if (foundItem) return item;

              if (item.children) {
                const result = findAndRemoveItem(item.children, itemId);
                if (result.item) {
                  foundItem = result.item;
                  return {
                    ...item,
                    children: result.updatedItems,
                  };
                }
              }
              return item;
            });

            return { item: foundItem, updatedItems };
          };

          const addToGroup = (
            treeItems: TreeItems<TreeItemData>,
            groupId: string,
            itemToAdd: TreeItem<TreeItemData>
          ): TreeItems<TreeItemData> => {
            return treeItems.map((item) => {
              if (item.id.toString() === groupId && item.type === "group") {
                return {
                  ...item,
                  children: [...(item.children ?? []), itemToAdd],
                };
              }
              if (item.children) {
                return {
                  ...item,
                  children: addToGroup(item.children, groupId, itemToAdd),
                };
              }
              return item;
            });
          };

          const { item, updatedItems } = findAndRemoveItem(
            prevItems,
            draggedItemId
          );
          if (item && item.type === "group") {
            const groupToAdd: TreeItem<TreeItemData> = {
              ...item,
              children: item.children ?? [],
              canHaveChildren: true,
            };
            const updated = enforceLayerRules(
              addToGroup(updatedItems, targetGroupId, groupToAdd)
            );
            // Update the ref immediately to prevent false detection on next interaction
            itemsBeforeChangeRef.current = updated;
            return updated;
          }
          const updated = enforceLayerRules(prevItems);
          itemsBeforeChangeRef.current = updated;
          return updated;
        });
      }
    } else {
      // Reorder at same level as target group
      const findAndRemoveItem = (
        treeItems: TreeItems<TreeItemData>,
        itemId: string
      ): {
        item: TreeItem<TreeItemData> | null;
        updatedItems: TreeItems<TreeItemData>;
      } => {
        for (let i = 0; i < treeItems.length; i++) {
          if (treeItems[i].id.toString() === itemId) {
            const item = treeItems[i];
            const updatedItems = treeItems.filter((_, index) => index !== i);
            return { item, updatedItems };
          }
        }

        let foundItem: TreeItem<TreeItemData> | null = null;
        const updatedItems = treeItems.map((item) => {
          if (foundItem) return item;

          if (item.children) {
            const result = findAndRemoveItem(item.children, itemId);
            if (result.item) {
              foundItem = result.item;
              return {
                ...item,
                children: result.updatedItems,
              };
            }
          }
          return item;
        });

        return { item: foundItem, updatedItems };
      };

      const findParentAndSiblings = (
        treeItems: TreeItems<TreeItemData>,
        targetId: string
      ): {
        parent: TreeItem<TreeItemData> | null;
        siblings: TreeItems<TreeItemData>;
        targetIndex: number;
      } | null => {
        // Check root level
        const rootIndex = treeItems.findIndex(
          (item) => item.id.toString() === targetId
        );
        if (rootIndex !== -1) {
          return {
            parent: null,
            siblings: treeItems,
            targetIndex: rootIndex,
          };
        }

        // Check children
        for (const item of treeItems) {
          if (item.children) {
            const childIndex = item.children.findIndex(
              (child) => child.id.toString() === targetId
            );
            if (childIndex !== -1) {
              return {
                parent: item,
                siblings: item.children,
                targetIndex: childIndex,
              };
            }
            const result = findParentAndSiblings(item.children, targetId);
            if (result) return result;
          }
        }
        return null;
      };

      setItems((prevItems) => {
        let draggedItem: TreeItem<TreeItemData> | null = null;
        let updatedItemsAfterRemove = prevItems;

        if (isFromSource) {
          // Create new item from source
          const parts = draggedItemId.split("-");
          if (parts.length < 2) {
            return prevItems;
          }
          const groupId = parts.slice(1).join("-");
          const sourceGroup = groups.find((g) => g.id === groupId);
          if (!sourceGroup) {
            return prevItems;
          }
          draggedItem = {
            id: `group-${sourceGroup.id}`,
            name: sourceGroup.name,
            type: "group",
            children: [],
            canHaveChildren: true,
          };
        } else {
          // Remove existing item
          const result = findAndRemoveItem(prevItems, draggedItemId);
          draggedItem = result.item;
          updatedItemsAfterRemove = result.updatedItems;
        }

        if (!draggedItem) {
          return prevItems;
        }

        const parentInfo = findParentAndSiblings(
          updatedItemsAfterRemove,
          targetGroupId
        );
        if (!parentInfo) {
          return prevItems;
        }

        const { parent, siblings, targetIndex } = parentInfo;
        const newSiblings = [...siblings];
        newSiblings.splice(targetIndex, 0, draggedItem);

        if (parent) {
          const updated = updatedItemsAfterRemove.map((item) => {
            if (item.id.toString() === parent.id.toString()) {
              return {
                ...item,
                children: newSiblings,
              };
            }
            if (item.children) {
              const updateChildren = (
                children: TreeItems<TreeItemData>
              ): TreeItems<TreeItemData> => {
                return children.map((child) => {
                  if (child.id.toString() === parent.id.toString()) {
                    return {
                      ...child,
                      children: newSiblings,
                    };
                  }
                  if (child.children) {
                    return {
                      ...child,
                      children: updateChildren(child.children),
                    };
                  }
                  return child;
                });
              };
              return {
                ...item,
                children: updateChildren(item.children),
              };
            }
            return item;
          });
          const updatedEnforced = enforceLayerRules(updated);
          // Update the ref immediately to prevent false detection on next interaction
          itemsBeforeChangeRef.current = updatedEnforced;
          return updatedEnforced;
        } else {
          const updatedEnforced = enforceLayerRules(newSiblings);
          // Update the ref immediately to prevent false detection on next interaction
          itemsBeforeChangeRef.current = updatedEnforced;
          return updatedEnforced;
        }
      });
    }

    setPendingGroupDrop(null);
    setGroupDropDialogOpen(false);

    // The flag will be reset by useEffect when items update
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setRitordningDragOver(null);

    // Clear drag tracking if no drop happened or if it's not a SortableTree item
    if (!over || active.id === over.id) {
      setDraggedItemInfo(null);
      itemsBeforeChangeRef.current = items;
      return;
    }

    // Clear tracking for source items (handled separately)
    if (typeof active.id === "string" && active.id.startsWith("source-")) {
      setDraggedItemInfo(null);
      itemsBeforeChangeRef.current = items;
    }

    // Handle Ritordning drop zone
    if (over.id === "ritordning-drop-zone") {
      if (
        typeof active.id === "string" &&
        active.id.startsWith("source-layer-")
      ) {
        // Dropping a layer from source into Ritordning
        const parts = active.id.split("-");
        if (parts.length < 3) return;
        const layerId = parts.slice(2).join("-");
        const layer = layers.find((l) => l.id === layerId);
        if (!layer) return;

        // Only add if not already in the list
        setRitordningItems((prev) => {
          if (prev.includes(layerId)) return prev;
          return [...prev, layerId];
        });
      } else if (
        typeof active.id === "string" &&
        active.id.startsWith("ritordning-")
      ) {
        // Reordering within Ritordning - just return, items are already in place
        return;
      }
      return;
    }

    // Handle dropping source layer onto Ritordning item (insert at position)
    if (
      typeof active.id === "string" &&
      active.id.startsWith("source-layer-") &&
      typeof over.id === "string" &&
      over.id.startsWith("ritordning-")
    ) {
      const parts = active.id.split("-");
      if (parts.length < 3) return;
      const layerId = parts.slice(2).join("-");
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      const overLayerId = over.id.replace("ritordning-", "");
      setRitordningItems((prev) => {
        if (prev.includes(layerId)) {
          // If already in list, just reorder
          const newItems = prev.filter((id) => id !== layerId);
          const overIndex = newItems.indexOf(overLayerId);
          if (overIndex !== -1) {
            newItems.splice(overIndex, 0, layerId);
          } else {
            newItems.push(layerId);
          }
          return newItems;
        } else {
          // Add new layer at position
          const overIndex = prev.indexOf(overLayerId);
          if (overIndex !== -1) {
            const newItems = [...prev];
            newItems.splice(overIndex, 0, layerId);
            return newItems;
          } else {
            return [...prev, layerId];
          }
        }
      });
      return;
    }

    // Handle Ritordning item reordering
    if (typeof active.id === "string" && active.id.startsWith("ritordning-")) {
      const activeLayerId = active.id.replace("ritordning-", "");
      if (typeof over.id === "string" && over.id.startsWith("ritordning-")) {
        const overLayerId = over.id.replace("ritordning-", "");
        setRitordningItems((prev) => {
          const newItems = [...prev];
          const activeIndex = newItems.indexOf(activeLayerId);
          const overIndex = newItems.indexOf(overLayerId);
          if (
            activeIndex !== -1 &&
            overIndex !== -1 &&
            activeIndex !== overIndex
          ) {
            newItems.splice(activeIndex, 1);
            newItems.splice(overIndex, 0, activeLayerId);
          }
          return newItems;
        });
      }
      return;
    }

    if (typeof active.id === "string" && active.id.startsWith("source-")) {
      const parts = active.id.split("-");
      if (parts.length < 3) return;
      const type = parts[1] as "group" | "layer";
      const id = parts.slice(2).join("-");
      const sourceItem =
        type === "layer"
          ? layers.find((l) => l.id === id)
          : groups.find((g) => g.id === id);

      if (!sourceItem) return;

      const newItem: TreeItem<TreeItemData> = {
        id: `${type}-${sourceItem.id}`,
        name: sourceItem.name,
        type: type,
        children: type === "group" ? [] : undefined,
        canHaveChildren: type === "group",
      };

      if (over.id !== "tree-drop-zone") {
        const targetId = over.id.toString();
        const targetItem = findItemInTree(items, targetId);

        // Check if both dragged item and target are groups
        if (type === "group" && targetItem?.type === "group") {
          // Show dialog to choose between reorder and insert
          setPendingGroupDrop({
            draggedItemId: newItem.id.toString(),
            draggedItemName: sourceItem.name,
            targetGroupId: targetId,
            targetGroupName: targetItem.name,
            isFromSource: true,
          });
          setGroupDropDialogOpen(true);
          return;
        }

        // For layers or when target is not a group, proceed with normal insert
        setItems((prevItems) => {
          const addToGroup = (
            treeItems: TreeItems<TreeItemData>,
            groupId: string
          ): TreeItems<TreeItemData> => {
            return treeItems.map((item) => {
              if (item.id.toString() === groupId && item.type === "group") {
                return {
                  ...item,
                  children: [...(item.children ?? []), newItem],
                };
              }
              if (item.children) {
                return {
                  ...item,
                  children: addToGroup(item.children, groupId),
                };
              }
              return item;
            });
          };
          const updated = addToGroup(prevItems, targetId);
          return enforceLayerRules(updated);
        });
      } else {
        setItems((prevItems) => enforceLayerRules([...prevItems, newItem]));
      }
    } else {
      // Handle existing item in tree being dragged
      const draggedItemId = active.id.toString();
      const draggedItem = findItemInTree(items, draggedItemId);

      if (over.id !== "tree-drop-zone" && draggedItem) {
        const targetId = over.id.toString();
        const targetItem = findItemInTree(items, targetId);

        // Check if both dragged item and target are groups
        if (draggedItem.type === "group" && targetItem?.type === "group") {
          // Show dialog to choose between reorder and insert
          setPendingGroupDrop({
            draggedItemId: draggedItemId,
            draggedItemName: draggedItem.name,
            targetGroupId: targetId,
            targetGroupName: targetItem.name,
            isFromSource: false,
          });
          setGroupDropDialogOpen(true);
          return;
        }
      }

      if (over.id === "tree-drop-zone") {
        setItems((prevItems) => {
          const findAndRemoveItem = (
            treeItems: TreeItems<TreeItemData>,
            itemId: string
          ): {
            item: TreeItem<TreeItemData> | null;
            updatedItems: TreeItems<TreeItemData>;
          } => {
            for (let i = 0; i < treeItems.length; i++) {
              if (treeItems[i].id.toString() === itemId) {
                const item = treeItems[i];
                const updatedItems = treeItems.filter(
                  (_, index) => index !== i
                );
                return { item, updatedItems };
              }
            }

            let foundItem: TreeItem<TreeItemData> | null = null;
            const updatedItems = treeItems.map((item) => {
              if (foundItem) return item;

              if (item.children) {
                const result = findAndRemoveItem(item.children, itemId);
                if (result.item) {
                  foundItem = result.item;
                  return {
                    ...item,
                    children: result.updatedItems,
                  };
                }
              }
              return item;
            });

            return { item: foundItem, updatedItems };
          };

          const { item, updatedItems } = findAndRemoveItem(
            prevItems,
            draggedItemId
          );
          if (item) {
            const rootItem: TreeItem<TreeItemData> = {
              ...item,
              children: item.type === "group" ? item.children ?? [] : undefined,
              canHaveChildren: item.type === "group",
            };
            return enforceLayerRules([...updatedItems, rootItem]);
          }
          return enforceLayerRules(prevItems);
        });
      }
    }
  };

  return (
    <Paper
      sx={{
        width: "100%",
        p: 2,
        mb: 3,
        backgroundColor: isDarkMode ? "#121212" : "#efefef",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("common.layerSwitcherOrder")}
      </Typography>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={3} sx={{ position: "relative" }}>
          <Grid size={4} sx={{ position: "relative" }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
                position: "relative",
                width: "100%",
                minHeight: 600,
              }}
            >
              {rightTab === 0 ? (
                <>
                  <Tabs
                    value={leftTab}
                    onChange={(_, newValue: number) => setLeftTab(newValue)}
                    sx={{ mb: 2 }}
                  >
                    <Tab label={t("common.layers")} />
                    <Tab label={t("common.groups")} />
                  </Tabs>

                  <TextField
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  <Box
                    ref={leftPanelScrollRef}
                    sx={{
                      maxHeight: 600,
                      overflowY: "auto",
                      overflowX: "hidden",
                      position: "relative",
                      width: "100%",
                      pointerEvents: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: isDarkMode ? "#555" : "#ccc",
                        borderRadius: "4px",
                        "&:hover": {
                          background: isDarkMode ? "#666" : "#bbb",
                        },
                      },
                      scrollbarWidth: "thin",
                      scrollbarColor: isDarkMode
                        ? "#555 transparent"
                        : "#ccc transparent",
                    }}
                    onWheel={(e) => {
                      const container = leftPanelScrollRef.current;
                      if (!container) return;

                      e.stopPropagation();

                      if (activeId) {
                        const delta = e.deltaY;
                        container.scrollBy({
                          top: delta,
                          behavior: "auto",
                        });
                      }
                    }}
                  >
                    <List sx={{ position: "relative", width: "100%", p: 1 }}>
                      {leftTab === 0
                        ? filteredLayersLagerordning.map((layer) => (
                            <DraggableSourceItem
                              key={layer.id}
                              item={layer}
                              type="layer"
                            />
                          ))
                        : filteredGroups.map((group) => (
                            <DraggableSourceItem
                              key={group.id}
                              item={group}
                              type="group"
                            />
                          ))}
                      {leftTab === 0 &&
                        filteredLayersLagerordning.length === 0 && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ p: 2, textAlign: "center" }}
                          >
                            {t("common.noLayersAvailable")}
                          </Typography>
                        )}
                      {leftTab === 1 && filteredGroups.length === 0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ p: 2, textAlign: "center" }}
                        >
                          {t("common.noGroupsAvailable")}
                        </Typography>
                      )}
                    </List>
                  </Box>
                </>
              ) : (
                <>
                  <Tabs value={0} sx={{ mb: 2 }}>
                    <Tab label={t("common.layers")} />
                  </Tabs>

                  <TextField
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  <Box
                    ref={leftPanelScrollRef}
                    sx={{
                      maxHeight: 600,
                      overflowY: "auto",
                      overflowX: "hidden",
                      position: "relative",
                      width: "100%",
                      pointerEvents: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: isDarkMode ? "#555" : "#ccc",
                        borderRadius: "4px",
                        "&:hover": {
                          background: isDarkMode ? "#666" : "#bbb",
                        },
                      },
                      scrollbarWidth: "thin",
                      scrollbarColor: isDarkMode
                        ? "#555 transparent"
                        : "#ccc transparent",
                    }}
                    onWheel={(e) => {
                      const container = leftPanelScrollRef.current;
                      if (!container) return;

                      e.stopPropagation();

                      if (activeId) {
                        const delta = e.deltaY;
                        container.scrollBy({
                          top: delta,
                          behavior: "auto",
                        });
                      }
                    }}
                  >
                    <List sx={{ position: "relative", width: "100%", p: 1 }}>
                      {filteredLayersRitordning.map((layer) => (
                        <DraggableSourceItem
                          key={layer.id}
                          item={layer}
                          type="layer"
                        />
                      ))}
                      {filteredLayersRitordning.length === 0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ p: 2, textAlign: "center" }}
                        >
                          {t("common.noLayersAvailable")}
                        </Typography>
                      )}
                    </List>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          <Grid size={8}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
              }}
            >
              <Tabs
                value={rightTab}
                onChange={(_, newValue: number) => {
                  setRightTab(newValue);
                  if (newValue === 1) {
                    setLeftTab(0); // Auto-switch to Layers tab when Ritordning is selected
                  }
                }}
                sx={{ mb: 2 }}
              >
                <Tab label="Lagerordning" />
                <Tab label="Ritordning" />
              </Tabs>

              {rightTab === 0 && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("common.layerSwitcherHierarchyTreeDescription")}
                  </Typography>

                  <TreeDropZone>
                    <Box
                      ref={rightPanelScrollRef}
                      sx={{
                        maxHeight: 600,
                        overflowY: showRightScrollbar ? "auto" : "hidden",
                        overflowX: "hidden",
                        position: "relative",
                        width: "100%",
                        pointerEvents: "auto",
                        flex: 1,
                        "&::-webkit-scrollbar": {
                          width: "8px",
                          display: showRightScrollbar ? "block" : "none",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: isDarkMode ? "#555" : "#ccc",
                          borderRadius: "4px",
                          "&:hover": {
                            background: isDarkMode ? "#666" : "#bbb",
                          },
                        },
                        scrollbarWidth: showRightScrollbar ? "thin" : "none",
                        scrollbarColor: showRightScrollbar
                          ? isDarkMode
                            ? "#555 transparent"
                            : "#ccc transparent"
                          : "transparent transparent",
                      }}
                      onWheel={(e) => {
                        const container = rightPanelScrollRef.current;
                        if (!container) return;

                        e.stopPropagation();

                        if (activeId) {
                          const delta = e.deltaY;
                          container.scrollBy({
                            top: delta,
                            behavior: "auto",
                          });
                        }
                      }}
                    >
                      {items.length === 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 400,
                            color: "text.secondary",
                          }}
                        >
                          <Typography variant="body2">
                            {t("common.dragLayersAndGroups")}
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            "& .dnd-sortable-tree_simple_tree-item-collapse_button":
                              {
                                filter: isDarkMode
                                  ? "brightness(0) invert(0.6)"
                                  : "none",
                                marginRight: 1,
                              },
                            "& .dnd-sortable-tree_simple_tree-item-collapse_button-container":
                              {
                                position: "relative",
                                zIndex: 1,
                                pointerEvents: "auto",
                                flexShrink: 0,
                                width: "fit-content",
                                height: "fit-content",
                              },
                            "& .dnd-sortable-tree_simple_tree-item-wrapper": {
                              "& > div": {
                                "&:last-child": {
                                  position: "relative",
                                  zIndex: 10,
                                },
                              },
                            },
                            "& .dnd-sortable-tree_simple_handle": {
                              cursor: "grab",
                              "&:active": {
                                cursor: "grabbing",
                              },
                              filter: isDarkMode
                                ? "brightness(0) invert(0.6)"
                                : "none",
                            },
                            "& .dnd-sortable-tree_drop-indicator": {
                              backgroundColor: isDarkMode
                                ? "#42a5f5"
                                : "#1976d2",
                              height: "2px",
                              boxShadow: `0 0 4px ${
                                isDarkMode ? "#42a5f5" : "#1976d2"
                              }`,
                            },
                          }}
                        >
                          <SortableTree
                            items={items}
                            onItemsChanged={(newItems) => {
                              // Skip dialog detection if we're processing a group drop action
                              // (prevents dialog from reappearing after successful insert)
                              if (isProcessingGroupDropRef.current) {
                                setItems(enforceLayerRules(newItems));
                                setDraggedItemInfo(null);
                                itemsBeforeChangeRef.current =
                                  enforceLayerRules(newItems);
                                return;
                              }

                              // Use ref to get the items state before the change
                              const oldItems = itemsBeforeChangeRef.current;

                              // Check if this is a group-on-group drop
                              // Try to detect by comparing old and new tree structure
                              let detectedDrop: {
                                draggedItemId: string;
                                draggedItemName: string;
                                targetGroupId: string;
                                targetGroupName: string;
                              } | null = null;

                              // First, try using draggedItemInfo if available
                              if (
                                draggedItemInfo &&
                                draggedItemInfo.itemType === "group"
                              ) {
                                const dropInfo = detectGroupOnGroupDrop(
                                  oldItems, // State before change (from ref)
                                  newItems, // New state after change
                                  draggedItemInfo.itemId
                                );

                                if (dropInfo) {
                                  const draggedItem = findItemInTree(
                                    oldItems,
                                    draggedItemInfo.itemId
                                  );
                                  if (draggedItem) {
                                    detectedDrop = {
                                      draggedItemId: draggedItemInfo.itemId,
                                      draggedItemName: draggedItem.name,
                                      targetGroupId: dropInfo.targetGroupId,
                                      targetGroupName: dropInfo.targetGroupName,
                                    };
                                  }
                                }
                              } else {
                                // Fallback: find any group that became a child of another group
                                // Compare all items to find what changed
                                const findNewChildGroups = (
                                  oldTree: TreeItems<TreeItemData>,
                                  newTree: TreeItems<TreeItemData>
                                ): typeof detectedDrop => {
                                  // Find groups in new tree that have children they didn't have before
                                  for (const newItem of newTree) {
                                    if (
                                      newItem.type === "group" &&
                                      newItem.children
                                    ) {
                                      for (const child of newItem.children) {
                                        if (child.type === "group") {
                                          // Check if this child wasn't here before
                                          const oldItem = findItemInTree(
                                            oldTree,
                                            newItem.id.toString()
                                          );
                                          const wasChildBefore =
                                            oldItem?.children?.some(
                                              (c) =>
                                                c.id.toString() ===
                                                child.id.toString()
                                            );

                                          if (!wasChildBefore) {
                                            // This group became a child - check if it was moved from elsewhere
                                            const oldParent = findItemParent(
                                              oldTree,
                                              child.id.toString()
                                            );
                                            if (
                                              !oldParent?.parent ||
                                              oldParent.parent.id.toString() !==
                                                newItem.id.toString()
                                            ) {
                                              return {
                                                draggedItemId:
                                                  child.id.toString(),
                                                draggedItemName: child.name,
                                                targetGroupId:
                                                  newItem.id.toString(),
                                                targetGroupName: newItem.name,
                                              };
                                            }
                                          }
                                        }
                                      }
                                    }
                                    if (newItem.children) {
                                      const oldItem = findItemInTree(
                                        oldTree,
                                        newItem.id.toString()
                                      );
                                      const oldChildren =
                                        oldItem?.children ?? [];
                                      const result = findNewChildGroups(
                                        oldChildren,
                                        newItem.children
                                      );
                                      if (result) return result;
                                    }
                                  }
                                  return null;
                                };

                                detectedDrop = findNewChildGroups(
                                  oldItems,
                                  newItems
                                );
                              }

                              if (detectedDrop) {
                                // Revert the change and show dialog
                                setPendingGroupDrop({
                                  ...detectedDrop,
                                  isFromSource: false,
                                });
                                setGroupDropDialogOpen(true);
                                setDraggedItemInfo(null);
                                // Don't update items - we'll update after dialog choice
                                return;
                              }

                              // Normal update
                              setItems(enforceLayerRules(newItems));
                              setDraggedItemInfo(null);
                              // Update ref for next drag
                              itemsBeforeChangeRef.current =
                                enforceLayerRules(newItems);
                            }}
                            TreeItemComponent={(treeItemProps) => {
                              const itemId = treeItemProps.item.id.toString();
                              const isGroup =
                                treeItemProps.item.type === "group";
                              return (
                                <TreeItemComponent
                                  {...treeItemProps}
                                  onMoveUp={() => handleMoveUp(itemId)}
                                  onMoveDown={() => handleMoveDown(itemId)}
                                  onAdd={
                                    isGroup
                                      ? () => handleAddToGroup(itemId)
                                      : undefined
                                  }
                                  canMoveUp={canMoveUp(itemId)}
                                  canMoveDown={canMoveDown(itemId)}
                                />
                              );
                            }}
                            keepGhostInPlace
                          />
                        </Box>
                      )}
                    </Box>
                  </TreeDropZone>
                </>
              )}

              {rightTab === 1 && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t("common.dragLayersAndGroups")}
                  </Typography>

                  <RitordningDropZone>
                    <Box
                      ref={rightPanelScrollRef}
                      sx={{
                        maxHeight: 600,
                        overflowY: "auto",
                        overflowX: "hidden",
                        position: "relative",
                        width: "100%",
                        pointerEvents: "auto",
                        flex: 1,
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: isDarkMode ? "#555" : "#ccc",
                          borderRadius: "4px",
                          "&:hover": {
                            background: isDarkMode ? "#666" : "#bbb",
                          },
                        },
                        scrollbarWidth: "thin",
                        scrollbarColor: isDarkMode
                          ? "#555 transparent"
                          : "#ccc transparent",
                      }}
                      onWheel={(e) => {
                        const container = rightPanelScrollRef.current;
                        if (!container) return;

                        e.stopPropagation();

                        if (activeId) {
                          const delta = e.deltaY;
                          container.scrollBy({
                            top: delta,
                            behavior: "auto",
                          });
                        }
                      }}
                    >
                      {ritordningItems.length === 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 400,
                            color: "text.secondary",
                          }}
                        >
                          <Typography variant="body2">
                            {t("common.dragLayersAndGroups")}
                          </Typography>
                        </Box>
                      ) : (
                        <List sx={{ position: "relative", width: "100%" }}>
                          {ritordningItems.map((layerId, index) => {
                            const layer = layers.find((l) => l.id === layerId);
                            if (!layer) return null;
                            return (
                              <DraggableRitordningItem
                                key={`ritordning-${layerId}`}
                                layerId={layerId}
                                layerName={layer.name}
                                index={index}
                                onRemove={() => {
                                  setRitordningItems((prev) =>
                                    prev.filter((id) => id !== layerId)
                                  );
                                }}
                                dragOver={ritordningDragOver}
                              />
                            );
                          })}
                        </List>
                      )}
                    </Box>
                  </RitordningDropZone>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
        <DragOverlay>
          {activeId?.startsWith("source-")
            ? (() => {
                const parts = activeId.split("-");
                if (parts.length < 3) return null;
                const type = parts[1] as "group" | "layer";
                const id = parts.slice(2).join("-");
                const sourceItem =
                  type === "layer"
                    ? layers.find((l) => l.id === id)
                    : groups.find((g) => g.id === id);

                if (!sourceItem) return null;

                return (
                  <ListItem
                    sx={{
                      backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
                      cursor: "grabbing",
                      border: "1px solid #ddd",
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                      opacity: 0.9,
                      transform: "rotate(2deg)",
                      width: 250,
                    }}
                  >
                    <DragIndicator sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">{sourceItem.name}</Typography>
                  </ListItem>
                );
              })()
            : null}
        </DragOverlay>
      </DndContext>
      <AddItemsDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setTargetGroupId(null);
        }}
        onConfirm={handleConfirmAddItems}
        layers={layers}
        groups={groups}
        addedItemIds={addedItemIdsLagerordning}
        isDarkMode={isDarkMode}
      />
      {pendingGroupDrop && (
        <GroupDropDialog
          open={groupDropDialogOpen}
          onClose={() => {
            setGroupDropDialogOpen(false);
            setPendingGroupDrop(null);
            // Reset the flag when dialog is cancelled
            isProcessingGroupDropRef.current = false;
          }}
          onConfirm={handleGroupDropAction}
          draggedGroupName={pendingGroupDrop.draggedItemName}
          targetGroupName={pendingGroupDrop.targetGroupName}
          isDarkMode={isDarkMode}
        />
      )}
    </Paper>
  );
}
