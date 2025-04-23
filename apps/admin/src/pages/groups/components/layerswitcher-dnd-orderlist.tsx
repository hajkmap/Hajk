import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import useAppStateStore from "../../../store/use-app-state-store";
import { useLayers } from "../../../api/layers";
import { useGroups } from "../../../api/groups";
import type { XYCoord } from "dnd-core";

const ItemType = {
  ITEM: "ITEM",
  REORDER: "REORDER_LAYER",
  GROUP: "GROUP",
};

interface DraggableItemProps {
  item: { id: string; name: string };
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item }) => {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType.ITEM,
    item: { ...item, type: ItemType.ITEM },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ListItem
      key={item.id}
      ref={dragRef as unknown as React.Ref<HTMLLIElement>}
      sx={{
        backgroundColor: isDragging
          ? "#f0f0f0"
          : themeMode === "dark"
          ? "#121212"
          : "white",
        cursor: "move",
        border: "1px solid #ddd",
        borderRadius: 2,
        boxShadow: isDragging ? "0px 2px 10px rgba(0, 0, 0, 0.1)" : "none",
        mb: 1,
        px: 2,
        py: 1.5,
        transition: "box-shadow 0.2s ease, background-color 0.2s ease",
      }}
    >
      {item.name}
    </ListItem>
  );
};

const DraggableGroup = ({
  group,
  index,
  moveGroup,
  children,
}: {
  group: { id: string; name: string };
  index: number;
  moveGroup: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.GROUP,
    item: { id: group.id, index, type: ItemType.GROUP },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<
    { id: string; index: number; type: string },
    void,
    { isOver: boolean }
  >({
    accept: ItemType.GROUP,
    hover(item, monitor) {
      if (!ref.current) return;
      if (item.id === group.id) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Timeout to prevent rapid reordering
      const timeoutId = setTimeout(() => {
        moveGroup(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }, 50);

      return () => clearTimeout(timeoutId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        mb: 2,
        transition: "all 0.2s ease",
        backgroundColor: isOver
          ? isDarkMode
            ? "#1e293b"
            : "#e0f7fa"
          : "transparent",
        borderRadius: 2,
        p: 0.5,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        boxShadow: isDragging ? "0px 2px 8px rgba(0,0,0,0.1)" : "none",
      }}
    >
      {children}
    </Box>
  );
};

const ReorderableListItem = ({
  layer,
  index,
  moveLayer,
  groupId,
  onRemove,
  dimmed,
}: {
  layer: { id: string; name: string };
  index: number;
  moveLayer: (dragIndex: number, hoverIndex: number) => void;
  groupId: string;
  onRemove: () => void;
  dimmed?: boolean;
}) => {
  const ref = React.useRef<HTMLLIElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const [{ isOver, handlerId }, drop] = useDrop<
    { id: string; name: string; index: number; groupId: string },
    void,
    { isOver: boolean; handlerId: string | symbol | null }
  >({
    accept: ItemType.ITEM,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      handlerId: monitor.getHandlerId(),
    }),
    hover(item, monitor) {
      if (!ref.current) return;
      if (item.groupId !== groupId) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveLayer(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.ITEM,
    item: { ...layer, index, groupId, type: ItemType.ITEM },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    setIsHovered(isOver);
  }, [isOver]);

  drag(drop(ref));

  return (
    <ListItem
      key={layer.id}
      ref={ref}
      data-handler-id={handlerId}
      sx={{
        opacity: isDragging ? 0.5 : dimmed ? 0.25 : 1,
        cursor: "move",
        backgroundColor: dimmed
          ? "transparent"
          : isHovered
          ? isDarkMode
            ? "#1e293b"
            : "#e0f7fa"
          : isDragging
          ? isDarkMode
            ? "#263238"
            : "#f0f0f0"
          : isDarkMode
          ? "#121212"
          : "white",
        border: "1px solid #ddd",
        borderRadius: 2,
        boxShadow:
          isHovered || isDragging ? "0px 2px 10px rgba(0, 0, 0, 0.1)" : "none",
        mb: 1,
        px: 2,
        py: 1.5,
        transition: "all 0.2s ease",
      }}
      secondaryAction={
        <IconButton edge="end" onClick={onRemove}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      {layer.name}
    </ListItem>
  );
};

const GroupDropZone = ({
  group,
  layers,
  onDropLayerToGroup,
  onRemoveLayerFromGroup,
  onReorderLayer,
  onMoveGroupToGroup,
  onDeleteGroup,
  showDeleteGroupButton = true,
  pathIndex,
  isRootGroup,
  index,
  lastIndex,
  onMoveUp,
  onMoveDown,
}: {
  group: { id: string; name: string };
  layers: { id: string; name: string }[];
  onDropLayerToGroup: (
    groupId: string,
    layer: { id: string; name: string }
  ) => void;
  onRemoveLayerFromGroup: (groupId: string, layerId: string) => void;
  onReorderLayer: (
    groupId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  onMoveGroupToGroup: (childGroupId: string, parentGroupId: string) => void;
  onDeleteGroup?: () => void;
  showDeleteGroupButton?: boolean;
  pathIndex?: string;
  isRootGroup?: boolean;
  index?: number;
  lastIndex?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) => {
  const listRef = React.useRef<HTMLUListElement>(null);

  const [{ isOverCurrent, isExternalDrag }, drop] = useDrop<
    {
      id: string;
      name: string;
      groupId?: string;
      index?: number;
      type: string;
    },
    void,
    { isOverCurrent: boolean; isExternalDrag: boolean }
  >({
    accept: [ItemType.ITEM, ItemType.GROUP],

    drop: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;

      if (item.type === ItemType.ITEM) {
        if (item.groupId) {
          onRemoveLayerFromGroup(item.groupId, item.id);
        }
        onDropLayerToGroup(group.id, { id: item.id, name: item.name });
      }

      if (item.type === ItemType.GROUP) {
        onMoveGroupToGroup(item.id, group.id);
      }
    },
    hover: (_, monitor) => {
      const el = listRef.current;
      if (!el) return;

      const scrollThreshold = 40;
      const scrollSpeed = 10;
      const rect = el.getBoundingClientRect();

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const pointerY = clientOffset.y;

      if (pointerY < rect.top + scrollThreshold) {
        el.scrollBy({ top: -scrollSpeed, behavior: "smooth" });
      } else if (pointerY > rect.bottom - scrollThreshold) {
        el.scrollBy({ top: scrollSpeed, behavior: "smooth" });
      }
    },
    collect: (monitor) => {
      const item = monitor.getItem();
      const isOver = monitor.isOver({ shallow: true });
      const isExternal = !!item && item.groupId !== group.id;
      return {
        isOverCurrent: isOver,
        isExternalDrag: isExternal,
      };
    },
  });

  return (
    <Paper
      sx={{
        position: "relative",
        p: 2,
        mb: 2,
        mr: 1,
        border: "2px dashed",
        borderColor: isOverCurrent && isExternalDrag ? "#000" : "#ccc",
        backgroundColor:
          isOverCurrent && isExternalDrag ? "#f9f9f9" : "transparent",
      }}
    >
      <Box
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: isExternalDrag ? "auto" : "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {pathIndex ? `${pathIndex}.` : ""} {group.name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isRootGroup && (
            <>
              <IconButton
                size="small"
                onClick={onMoveUp}
                disabled={index === 0}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={onMoveDown}
                disabled={index === lastIndex}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        {showDeleteGroupButton && onDeleteGroup && (
          <IconButton onClick={onDeleteGroup} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {isOverCurrent && isExternalDrag && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 10,
            fontWeight: "bold",
            color: "#888",
          }}
        >
          Släpp här
        </Box>
      )}

      <List
        key={group.id}
        ref={listRef}
        sx={{
          position: "relative",
          zIndex: 1,
          opacity: isOverCurrent && isExternalDrag ? 0.3 : 1,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {layers.map((layer, index) => (
          <ReorderableListItem
            key={layer.id}
            layer={layer}
            index={index}
            moveLayer={(dragIndex, hoverIndex) =>
              onReorderLayer(group.id, dragIndex, hoverIndex)
            }
            groupId={group.id}
            onRemove={() => onRemoveLayerFromGroup(group.id, layer.id)}
            dimmed={isOverCurrent && isExternalDrag}
          />
        ))}
      </List>
    </Paper>
  );
};

function LayerSwitcherOrderList() {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const [leftTab, setLeftTab] = useState(0);
  const [rightTab, setRightTab] = useState(0);
  const [search, setSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupedLayers, setGroupedLayers] = useState<
    Record<string, { id: string; name: string }[]>
  >({});
  const [groupHierarchy, setGroupHierarchy] = useState<
    Record<string, string[]>
  >({});

  const { data: layers = [] } = useLayers();
  const { data: groups = [] } = useGroups();
  const [orderedGroups, setOrderedGroups] = useState(groups || []);

  useEffect(() => {
    setOrderedGroups((prev) => {
      const prevIds = prev.map((g) => g.id).join(",");
      const newIds = groups.map((g) => g.id).join(",");
      return prevIds === newIds ? prev : groups;
    });
  }, [groups]);

  const handleMoveGroup = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setOrderedGroups((prev) => {
        if (dragIndex === hoverIndex) return prev;

        const movedGroup = prev[dragIndex];

        const getAllChildren = (groupId: string): string[] => {
          const directChildren = groupHierarchy[groupId] || [];
          return directChildren.reduce((acc, childId) => {
            return [...acc, childId, ...getAllChildren(childId)];
          }, [] as string[]);
        };

        const allChildren = getAllChildren(movedGroup.id);
        const childrenSet = new Set(allChildren);

        const filteredGroups = prev.filter(
          (group) => group.id !== movedGroup.id && !childrenSet.has(group.id)
        );

        const safeHoverIndex = Math.max(
          0,
          Math.min(hoverIndex, filteredGroups.length)
        );
        filteredGroups.splice(safeHoverIndex, 0, movedGroup);

        return filteredGroups;
      });
    },
    [groupHierarchy]
  );

  // Add a memoized version of the move handler for the icon buttons
  const handleMoveUp = React.useCallback(
    (index: number) => {
      if (index > 0) {
        handleMoveGroup(index, index - 1);
      }
    },
    [handleMoveGroup]
  );

  const handleMoveDown = React.useCallback(
    (index: number) => {
      handleMoveGroup(index, index + 1);
    },
    [handleMoveGroup]
  );

  const handleDropToGroup = (
    groupId: string,
    layer: { id: string; name: string }
  ) => {
    setGroupedLayers((prev) => {
      const current = prev[groupId] || [];
      if (current.find((l) => l.id === layer.id)) return prev;
      return {
        ...prev,
        [groupId]: [...current, layer],
      };
    });
  };

  const handleRemoveLayer = (groupId: string, layerId: string) => {
    setGroupedLayers((prev) => {
      const updatedGroup = (prev[groupId] || []).filter(
        (layer) => layer.id !== layerId
      );
      return {
        ...prev,
        [groupId]: updatedGroup,
      };
    });
  };

  const handleReorderLayer = (
    groupId: string,
    dragIndex: number,
    hoverIndex: number
  ) => {
    setGroupedLayers((prev) => {
      const layers = [...(prev[groupId] || [])];
      const [removed] = layers.splice(dragIndex, 1);
      layers.splice(hoverIndex, 0, removed);
      return {
        ...prev,
        [groupId]: layers,
      };
    });
  };

  const assignedLayerIds = new Set(
    Object.values(groupedLayers)
      .flat()
      .map((layer) => layer.id)
  );

  const listItems = leftTab === 0 ? layers : groups;
  const filteredItems = listItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (leftTab === 1 || !assignedLayerIds.has(item.id))
  );

  const onMoveGroupToGroup = (childGroupId: string, parentGroupId: string) => {
    setGroupHierarchy((prevHierarchy) => {
      const isCircular = (id: string, target: string): boolean => {
        if (id === target) return true;
        const children = prevHierarchy[id] || [];
        return children.some((childId) => isCircular(childId, target));
      };
      if (isCircular(childGroupId, parentGroupId)) return prevHierarchy;

      const newHierarchy: Record<string, string[]> = {};
      for (const [parentId, children] of Object.entries(prevHierarchy)) {
        newHierarchy[parentId] = children.filter((id) => id !== childGroupId);
      }

      if (!newHierarchy[parentGroupId]) {
        newHierarchy[parentGroupId] = [];
      }
      newHierarchy[parentGroupId].push(childGroupId);

      return newHierarchy;
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupHierarchy((prev) => {
      const newHierarchy: Record<string, string[]> = {};

      for (const [parentId, children] of Object.entries(prev)) {
        newHierarchy[parentId] = children.filter((id) => id !== groupId);
      }

      return newHierarchy;
    });

    setOrderedGroups((prev) => {
      if (prev.find((g) => g.id === groupId)) return prev;

      const groupToAdd = groups.find((g) => g.id === groupId);
      if (!groupToAdd) return prev;

      return [...prev, groupToAdd];
    });
  };

  const groupMatchesSearch = (groupId: string, query: string): boolean => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return false;

    const nameMatches = group.name.toLowerCase().includes(query.toLowerCase());
    const children = groupHierarchy[groupId] || [];

    return (
      nameMatches ||
      children.some((childId) => groupMatchesSearch(childId, query))
    );
  };

  const rootGroups = orderedGroups.filter(
    (group) => !Object.values(groupHierarchy).flat().includes(group.id)
  );

  const visibleRootGroups = rootGroups.filter((group) =>
    groupMatchesSearch(group.id, groupSearch)
  );

  const renderGroupTree = (
    group: { id: string; name: string },
    depth = 0,
    index?: number,
    pathIndex?: string,
    totalRootGroups?: number
  ): React.ReactNode => {
    const children = groupHierarchy[group.id] || [];
    const hasChildren = children.length > 0;
    const isRootGroup = depth === 0;

    const groupBlock = (
      <Box
        key={group.id}
        sx={{
          pl: depth * 2,
          ml: depth * 2,
          borderLeft: depth > 0 ? "3px solid #ddd" : "none",
          mt: 2,
        }}
      >
        <DraggableGroup
          group={group}
          index={index ?? 0}
          moveGroup={handleMoveGroup}
        >
          <GroupDropZone
            group={group}
            pathIndex={pathIndex}
            layers={groupedLayers[group.id] || []}
            onDropLayerToGroup={handleDropToGroup}
            onRemoveLayerFromGroup={handleRemoveLayer}
            onReorderLayer={handleReorderLayer}
            onMoveGroupToGroup={onMoveGroupToGroup}
            showDeleteGroupButton={depth > 0}
            onDeleteGroup={() => handleDeleteGroup(group.id)}
            isRootGroup={isRootGroup}
            index={index ?? 0}
            lastIndex={(totalRootGroups ?? 1) - 1}
            onMoveUp={() => handleMoveUp(index ?? 0)}
            onMoveDown={() => handleMoveDown(index ?? 0)}
          />
        </DraggableGroup>
      </Box>
    );

    if (hasChildren && depth === 0) {
      return (
        <Paper
          key={group.id}
          elevation={2}
          sx={{
            p: 2,
            mt: 2,
            border: "1px solid #ccc",
            borderRadius: 2,
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fafafa",
          }}
        >
          {groupBlock}

          {children.map((childId, idx) => {
            const childGroup = groups.find((g) => g.id === childId);
            const childPathIndex =
              depth === 0 ? `${pathIndex}.${idx + 1}` : undefined;

            return childGroup
              ? renderGroupTree(childGroup, depth + 1, idx, childPathIndex)
              : null;
          })}
        </Paper>
      );
    }

    return (
      <>
        {groupBlock}
        {children.map((childId, idx) => {
          const childGroup = groups.find((g) => g.id === childId);
          const childPathIndex =
            depth === 0 ? `${pathIndex}.${idx + 1}` : undefined;

          return childGroup
            ? renderGroupTree(childGroup, depth + 1, idx, childPathIndex)
            : null;
        })}
      </>
    );
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
      <Typography variant="h6" sx={{ mt: -0.5, mb: 1.5 }}>
        Välj lager och justera ordning
      </Typography>

      <Grid container spacing={4}>
        <DndProvider backend={HTML5Backend}>
          <Grid size={4}>
            <Tabs
              value={leftTab}
              onChange={(_, newValue: number) => setLeftTab(newValue)}
            >
              <Tab label="Alla lager" />
              <Tab label="Alla grupper" />
            </Tabs>
            <Typography variant="body2" mt={2}>
              Här listas alla tillgängliga lager och grupper. Flytta eller dra
              ett lager till ytan för lagerordning för att de ska visas i kartan
              för användaren.
            </Typography>
            <TextField
              placeholder="Sök"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ my: 2 }}
            />
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                maxHeight: 600,
                overflowY: "auto",
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
              }}
            >
              <List>
                {filteredItems.map((item) => (
                  <DraggableItem key={item.id} item={item} />
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid size={8}>
            <Tabs
              value={rightTab}
              onChange={(_, newValue) => setRightTab(newValue as number)}
            >
              <Tab label="Lagerordning" />
              <Tab label="Ritordning" />
            </Tabs>
            <Typography variant="body2" mt={2} mb={2}>
              Här listas lager i den ordning som de visas för besökaren i
              lagerhanteraren.
            </Typography>
            <TextField
              placeholder="Sök grupper"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              sx={{ my: 2, width: "50%" }}
            />
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: 600,
                overflowY: "auto",
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {visibleRootGroups.map((group, i) =>
                  renderGroupTree(
                    group,
                    0,
                    i,
                    `${i + 1}`,
                    visibleRootGroups.length
                  )
                )}
              </Box>
            </Paper>
          </Grid>
        </DndProvider>
      </Grid>
    </Paper>
  );
}

export default LayerSwitcherOrderList;
