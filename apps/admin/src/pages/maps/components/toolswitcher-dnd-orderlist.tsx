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
  IconButton,
  Box,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import useAppStateStore from "../../../store/use-app-state-store";
import { useTools } from "../../../api/tools/hooks";
import type { XYCoord } from "dnd-core";

const ItemType = {
  ITEM: "ITEM",
  REORDER: "REORDER_TOOL",
  GROUP: "GROUP",
};

type CategoryKey =
  | "drawer"
  | "control"
  | "widget_left"
  | "widget_right"
  | "other";

export type ToolCategories = Record<
  CategoryKey,
  { id: string; name: string }[]
>;

interface ToolSwitcherOrderListProps {
  value?: ToolCategories;
  onChange?: (value: ToolCategories) => void;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  drawer: "Drawer",
  control: "Control button",
  widget_left: "Widget left",
  widget_right: "Widget right",
  other: "Övrigt",
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
  children,
}: {
  group: { id: string; name: string };
  index: number;
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
  tool,
  index,
  moveItem,
  categoryKey,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  dimmed,
}: {
  tool: { id: string; name: string };
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  categoryKey: CategoryKey;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  dimmed?: boolean;
}) => {
  const ref = React.useRef<HTMLLIElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const [{ isOver, handlerId }, drop] = useDrop<
    { id: string; name: string; index: number; categoryKey: CategoryKey },
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
      if (item.categoryKey !== categoryKey) return;

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

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.ITEM,
    item: { ...tool, index, categoryKey, type: ItemType.ITEM },
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
      key={tool.id}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={onMoveUp}
            disabled={isFirst}
            sx={{
              opacity: isFirst ? 0.3 : 1,
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
            }}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onMoveDown}
            disabled={isLast}
            sx={{
              opacity: isLast ? 0.3 : 1,
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
            }}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              color: "error.main",
              "&:hover": {
                backgroundColor: "error.light",
                color: "error.dark",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {tool.name}
    </ListItem>
  );
};

const GroupDropZone = ({
  group,
  tools,
  onDropToolToGroup,
  onRemoveToolFromGroup,
  onReorderTool,
  onMoveGroupToGroup,
  onDeleteGroup,
  showDeleteGroupButton = true,
  pathIndex,
}: {
  group: { id: string; name: string };
  tools: { id: string; name: string }[];
  onDropToolToGroup: (
    groupId: string,
    tool: { id: string; name: string }
  ) => void;
  onRemoveToolFromGroup: (groupId: string, toolId: string) => void;
  onReorderTool: (
    groupId: string,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  onMoveGroupToGroup: (childGroupId: string, parentGroupId: string) => void;
  onDeleteGroup?: () => void;
  showDeleteGroupButton?: boolean;
  pathIndex?: string;
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
          onRemoveToolFromGroup(item.groupId, item.id);
        }
        onDropToolToGroup(group.id, { id: item.id, name: item.name });
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
        {tools.map((tool, index) => (
          <ReorderableListItem
            key={tool.id}
            tool={tool}
            index={index}
            categoryKey={group.id as CategoryKey}
            moveItem={(dragIndex, hoverIndex) =>
              onReorderTool(group.id, dragIndex, hoverIndex)
            }
            onRemove={() => onRemoveToolFromGroup(group.id, tool.id)}
            onMoveUp={() => {
              if (index > 0) {
                onReorderTool(group.id, index, index - 1);
              }
            }}
            onMoveDown={() => {
              if (index < tools.length - 1) {
                onReorderTool(group.id, index, index + 1);
              }
            }}
            isFirst={index === 0}
            isLast={index === tools.length - 1}
            dimmed={isOverCurrent && isExternalDrag}
          />
        ))}
      </List>
    </Paper>
  );
};

function ToolSwitcherOrderList({
  value,
  onChange,
}: ToolSwitcherOrderListProps) {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const [leftTab, setLeftTab] = useState(0);
  const [search, setSearch] = useState("");

  const { data: tools = [] } = useTools();

  const [categoryToTools, setCategoryToTools] = useState<ToolCategories>(
    value ?? {
      drawer: [],
      control: [],
      widget_left: [],
      widget_right: [],
      other: [],
    }
  );

  useEffect(() => {
    if (value) setCategoryToTools(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    value?.drawer?.length,
    value?.control?.length,
    value?.widget_left?.length,
    value?.widget_right?.length,
    value?.other?.length,
  ]);

  useEffect(() => {
    if (!tools.length) return;
    setCategoryToTools((prev) => {
      const alreadyHave = Object.values(prev)
        .flat()
        .map((t) => t.id);
      if (alreadyHave.length) return prev; // don't overwrite user changes
      const initial: ToolCategories = {
        drawer: [],
        control: [],
        widget_left: [],
        widget_right: [],
        other: [],
      };
      for (const t of tools) {
        const name = t.type;
        const opt = t.options || {};
        let key: CategoryKey = "other";
        const pos = (opt.position || opt.widgetPosition || "")
          .toString()
          .toLowerCase();
        const isControl =
          opt.control === "true" || opt.showControlButton === "true";
        const isWidget =
          opt.widget === "true" || pos === "left" || pos === "right";
        const isDrawer = opt.drawer === "true" || (!isControl && !isWidget);
        if (isControl) key = "control";
        else if (pos === "left") key = "widget_left";
        else if (pos === "right") key = "widget_right";
        else if (isDrawer) key = "drawer";
        initial[key].push({ id: t.id, name });
      }
      return initial;
    });
  }, [tools]);

  useEffect(() => {
    onChange?.(categoryToTools);
  }, [categoryToTools, onChange]);

  const browseItems = tools
    .map((t) => ({ id: t.id, name: t.type }))
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const handleDropToCategory = (
    key: CategoryKey,
    item: { id: string; name: string }
  ) => {
    setCategoryToTools((prev) => {
      const next: ToolCategories = {
        drawer: [...prev.drawer],
        control: [...prev.control],
        widget_left: [...prev.widget_left],
        widget_right: [...prev.widget_right],
        other: [...prev.other],
      };
      for (const k of Object.keys(next) as CategoryKey[]) {
        next[k] = next[k].filter((x) => x.id !== item.id);
      }
      if (!next[key].find((x) => x.id === item.id)) next[key].push(item);
      return next;
    });
  };

  const handleRemoveFromCategory = (key: CategoryKey, id: string) => {
    setCategoryToTools((prev) => ({
      ...prev,
      [key]: prev[key].filter((x) => x.id !== id),
    }));
  };

  const handleReorderInCategory = (
    key: CategoryKey,
    dragIndex: number,
    hoverIndex: number
  ) => {
    setCategoryToTools((prev) => {
      const list = [...prev[key]];
      const [removed] = list.splice(dragIndex, 1);
      list.splice(hoverIndex, 0, removed);
      return { ...prev, [key]: list };
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <ToolSwitcherOrderListContent
        categoryToTools={categoryToTools}
        leftTab={leftTab}
        setLeftTab={setLeftTab}
        search={search}
        setSearch={setSearch}
        browseItems={browseItems}
        handleDropToCategory={handleDropToCategory}
        handleRemoveFromCategory={handleRemoveFromCategory}
        handleReorderInCategory={handleReorderInCategory}
        isDarkMode={isDarkMode}
      />
    </DndProvider>
  );
}

function ToolSwitcherOrderListContent({
  categoryToTools,
  leftTab,
  setLeftTab,
  search,
  setSearch,
  browseItems,
  handleDropToCategory,
  handleRemoveFromCategory,
  handleReorderInCategory,
  isDarkMode,
}: {
  categoryToTools: ToolCategories;
  leftTab: number;
  setLeftTab: (value: number) => void;
  search: string;
  setSearch: (value: string) => void;
  browseItems: { id: string; name: string }[];
  handleDropToCategory: (
    key: CategoryKey,
    item: { id: string; name: string }
  ) => void;
  handleRemoveFromCategory: (key: CategoryKey, id: string) => void;
  handleReorderInCategory: (
    key: CategoryKey,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  isDarkMode: boolean;
}) {
  const [{ isOverDrop }, dropZoneRef] = useDrop<
    {
      id: string;
      name: string;
      categoryKey?: CategoryKey;
      index?: number;
      type: string;
    },
    void,
    { isOverDrop: boolean }
  >({
    accept: [ItemType.ITEM],
    drop: (item) => {
      if (!item) return;
      // Drop to first available category since no tabs
      const firstCategory = Object.keys(categoryToTools)[0] as CategoryKey;
      handleDropToCategory(firstCategory, { id: item.id, name: item.name });
    },
    collect: (monitor) => ({
      isOverDrop: monitor.isOver({ shallow: true }),
    }),
  });

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
        Välj verktyg och justera ordning
      </Typography>

      <Grid container spacing={4}>
        <Grid size={4}>
          <Tabs value={leftTab} onChange={(_, v: number) => setLeftTab(v)}>
            <Tab label="Alla verktyg" />
          </Tabs>
          <Typography variant="body2" mt={2}>
            Här listas alla tillgängliga verktyg. Dra ett verktyg till en
            kategori för att visa det där.
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
              height: 600,
              overflowY: "auto",
              backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
            }}
          >
            <List>
              {browseItems.map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={8}>
          <Tabs value={0}>
            <Tab label="Tool order" />
          </Tabs>
          <Typography variant="body2" mt={2} mb={2}>
            Här listas verktyg i den ordning som de visas för besökaren i
            verktygssidan.
          </Typography>
          <TextField
            placeholder="Sök verktyg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ my: 2, width: "50%" }}
          />
          <Paper
            ref={dropZoneRef as unknown as React.Ref<HTMLDivElement>}
            variant="outlined"
            sx={{
              p: 2,
              height: 600,
              overflowY: "auto",
              backgroundColor: isOverDrop
                ? "#eef7ff"
                : isDarkMode
                ? "#1a1a1a"
                : "#fff",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(categoryToTools).map(
                ([categoryKey, tools], index) => {
                  const filteredTools = tools.filter((tool) =>
                    tool.name.toLowerCase().includes(search.toLowerCase())
                  );

                  if (filteredTools.length === 0) return null;

                  return (
                    <DraggableGroup
                      key={categoryKey}
                      group={{
                        id: categoryKey,
                        name: CATEGORY_LABELS[categoryKey as CategoryKey],
                      }}
                      index={index}
                    >
                      <GroupDropZone
                        group={{
                          id: categoryKey,
                          name: CATEGORY_LABELS[categoryKey as CategoryKey],
                        }}
                        tools={filteredTools}
                        onDropToolToGroup={(groupId, tool) =>
                          handleDropToCategory(groupId as CategoryKey, tool)
                        }
                        onRemoveToolFromGroup={(groupId, toolId) =>
                          handleRemoveFromCategory(
                            groupId as CategoryKey,
                            toolId
                          )
                        }
                        onReorderTool={(groupId, dragIndex, hoverIndex) =>
                          handleReorderInCategory(
                            groupId as CategoryKey,
                            dragIndex,
                            hoverIndex
                          )
                        }
                        onMoveGroupToGroup={() => undefined} // Not needed for tools
                      />
                    </DraggableGroup>
                  );
                }
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default ToolSwitcherOrderList;
