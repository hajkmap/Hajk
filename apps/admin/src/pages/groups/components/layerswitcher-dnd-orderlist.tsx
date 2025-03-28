import React, { useState } from "react";
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
} from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import useAppStateStore from "../../../store/use-app-state-store";
import { useLayers } from "../../../api/layers";
import { useGroups } from "../../../api/groups";

const ItemType = "ITEM";

interface DraggableItemProps {
  item: { id: string; name: string };
  onDrop?: (item: { id: string; name: string }) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType,
    item: { item },
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

const DropZone = ({
  items,
  onItemDrop,
}: {
  items: { id: string; name: string }[];
  onItemDrop: (item: { id: string; name: string }) => void;
}) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { item: { id: string; name: string } }) =>
      onItemDrop(item.item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <Paper
      ref={drop as unknown as React.Ref<HTMLDivElement> | undefined}
      sx={{
        p: 2,
        border: "1px dashed",
        borderColor: isOver ? "#000" : "#ccc",
        backgroundColor: canDrop ? "#f0f0f0" : "transparent",
        minHeight: 400,
        mt: "auto",
      }}
    >
      <Typography variant="body2">Dra och släpp lager här</Typography>
      <List>
        {items.map((item) => (
          <ListItem key={item.id}>{item.name}</ListItem>
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
  const [selectedItems, setSelectedItems] = useState<
    { id: string; name: string }[]
  >([]);

  const { data: layers = [] } = useLayers();
  const { data: groups = [] } = useGroups();

  const handleItemDrop = (item: { id: string; name: string }) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.id === item.id) ? prev : [...prev, item]
    );
  };

  const listItems = leftTab === 0 ? layers : groups;
  const filteredItems = listItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
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
                  justifyContent: "center",
                  mt: "auto",
                }}
              >
                <DropZone items={selectedItems} onItemDrop={handleItemDrop} />
              </Box>
            </Grid>
          </Grid>
        </DndProvider>
      </Grid>
    </Paper>
  );
}

export default LayerSwitcherOrderList;
