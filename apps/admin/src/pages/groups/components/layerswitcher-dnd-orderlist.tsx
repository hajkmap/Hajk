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
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType.ITEM,
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ListItem
      ref={dragRef as unknown as React.Ref<HTMLLIElement>}
      sx={{
        backgroundColor: isDragging ? "#f0f0f0" : "transparent",
        cursor: "move",
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

  const [, drop] = useDrop<
    { id: string; index: number; type: string },
    void,
    unknown
  >({
    accept: ItemType.GROUP,
    hover(item, monitor) {
      if (!ref.current) return;

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

      moveGroup(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.GROUP,
    item: { id: group.id, index, type: ItemType.GROUP },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
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
        transition: "opacity 0.2s ease",
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
}: {
  layer: { id: string; name: string };
  index: number;
  moveLayer: (dragIndex: number, hoverIndex: number) => void;
  groupId: string;
  onRemove: () => void;
}) => {
  const ref = React.useRef<HTMLLIElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

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
    item: { ...layer, index, groupId },
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
      ref={ref}
      data-handler-id={handlerId}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        backgroundColor: isHovered
          ? "#e0f7fa"
          : isDragging
          ? "#f0f0f0"
          : "transparent",
        transition: "background-color 0.2s ease",
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
}) => {
  const listRef = React.useRef<HTMLUListElement>(null);

  const [{ isOverCurrent, isExternalDrag }, drop] = useDrop<
    { id: string; name: string; groupId?: string; index?: number },
    void,
    { isOverCurrent: boolean; isExternalDrag: boolean }
  >({
    accept: ItemType.ITEM,
    drop: (item, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        if (item.groupId === group.id) {
          // Same group: reordering handled in hover
        } else {
          if (item.groupId) {
            onRemoveLayerFromGroup(item.groupId, item.id);
          }
          onDropLayerToGroup(group.id, { id: item.id, name: item.name });
        }
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
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      sx={{
        p: 2,
        mb: 2,
        mr: 1,
        border: "2px dashed",
        borderColor: isOverCurrent && isExternalDrag ? "#000" : "#ccc",
        backgroundColor:
          isOverCurrent && isExternalDrag ? "#f9f9f9" : "transparent",
        position: "relative",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {group.name}
      </Typography>

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
        ref={listRef}
        sx={{
          opacity: isOverCurrent ? 0.3 : 1,
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
  const [groupedLayers, setGroupedLayers] = useState<
    Record<string, { id: string; name: string }[]>
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

  const handleMoveGroup = (dragIndex: number, hoverIndex: number) => {
    setOrderedGroups((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, moved);
      return updated;
    });
  };

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
      <Grid container>
        <DndProvider backend={HTML5Backend}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Tabs
                value={leftTab}
                onChange={(_, newValue: number) => setLeftTab(newValue)}
              >
                <Tab label="Alla lager" />
                <Tab label="Alla grupper" />
              </Tabs>
              <Typography variant="body2" mt={2}>
                Här listas alla tillgängliga lager och grupper. Flytta eller dra
                ett lager till ytan för lagerordning för att de ska visas i
                kartan för användaren.
              </Typography>
              <TextField
                fullWidth
                placeholder="Sök"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ my: 2 }}
              />
              <Paper
                variant="outlined"
                sx={{ p: 1, maxHeight: 410, overflow: "auto" }}
              >
                <List>
                  {filteredItems.map((item) => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                </List>
              </Paper>
            </Grid>

            <Grid size={6}>
              <Tabs
                value={rightTab}
                onChange={(_, newValue) => setRightTab(newValue as number)}
              >
                <Tab label="Lagerordning" />
                <Tab label="Ritordning" />
              </Tabs>
              <Typography variant="body2" mt={2}>
                Här listas lager i den ordning som de visas för besökaren i
                lagerhanteraren.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "500px",
                  overflowY: "auto",
                }}
              >
                {orderedGroups.map((group, index) => (
                  <DraggableGroup
                    key={group.id}
                    group={group}
                    index={index}
                    moveGroup={handleMoveGroup}
                  >
                    <GroupDropZone
                      group={group}
                      layers={groupedLayers[group.id] || []}
                      onDropLayerToGroup={handleDropToGroup}
                      onRemoveLayerFromGroup={handleRemoveLayer}
                      onReorderLayer={handleReorderLayer}
                    />
                  </DraggableGroup>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DndProvider>
      </Grid>
    </Paper>
  );
}

export default LayerSwitcherOrderList;
