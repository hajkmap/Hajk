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
      layers.filter(
        (layer) =>
          !addedItemIds.has(`layer-${layer.id}`) &&
          layer.name.toLowerCase().includes(search.toLowerCase())
      ),
    [layers, addedItemIds, search]
  );

  const availableGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          !addedItemIds.has(`group-${group.id}`) &&
          group.name.toLowerCase().includes(search.toLowerCase())
      ),
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

export default function LayerSwitcherDnD() {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();
  const [leftTab, setLeftTab] = useState(0);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<TreeItems<TreeItemData>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRightScrollbar, setShowRightScrollbar] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const leftPanelScrollRef = React.useRef<HTMLDivElement>(null);
  const rightPanelScrollRef = React.useRef<HTMLDivElement>(null);

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

  const addedItemIds = useMemo(() => {
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

  const filteredLayers = useMemo(
    () =>
      layers.filter(
        (layer) =>
          layer.name.toLowerCase().includes(search.toLowerCase()) &&
          !addedItemIds.has(`layer-${layer.id}`)
      ),
    [layers, search, addedItemIds]
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.name.toLowerCase().includes(search.toLowerCase()) &&
          !addedItemIds.has(`group-${group.id}`)
      ),
    [groups, search, addedItemIds]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) return;

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

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
      setItems((prevItems) => enforceLayerRules(prevItems));
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
                  position: "relative",
                  width: "100%",
                  pointerEvents: "auto",
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
                <List sx={{ position: "relative", width: "100%" }}>
                  {leftTab === 0
                    ? filteredLayers.map((layer) => (
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
                  {leftTab === 0 && filteredLayers.length === 0 && (
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
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {t("common.layerSwitcherHierarchyTree")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                          backgroundColor: isDarkMode ? "#42a5f5" : "#1976d2",
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
                          setItems(enforceLayerRules(newItems));
                        }}
                        TreeItemComponent={(treeItemProps) => {
                          const itemId = treeItemProps.item.id.toString();
                          const isGroup = treeItemProps.item.type === "group";
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
        addedItemIds={addedItemIds}
        isDarkMode={isDarkMode}
      />
    </Paper>
  );
}
