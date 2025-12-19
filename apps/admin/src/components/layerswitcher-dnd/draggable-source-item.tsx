import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { ListItem, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

import useAppStateStore from "../../store/use-app-state-store";
import { ItemType } from "./types";
import { createSourceId } from "./utils";

interface DraggableSourceItemProps {
  item: { id: string; name: string };
  type: ItemType;
}

export const DraggableSourceItem: React.FC<DraggableSourceItemProps> = ({
  item,
  type,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: createSourceId(type, item.id),
    data: { type, item },
  });

  return (
    <ListItem
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: "grab",
        mb: 1,
        px: 2,
        py: 1.5,
        border: "1px solid #ddd",
        borderRadius: 2,
        background: isDarkMode ? "#1a1a1a" : "#fff",
        opacity: isDragging ? 0.5 : 1,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <DragIndicator sx={{ mr: 1, flexShrink: 0 }} />
      <Typography
        variant="body2"
        noWrap
        sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {item.name}
      </Typography>
    </ListItem>
  );
};
