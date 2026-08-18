import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderIcon from "@mui/icons-material/Folder";
import LayersIcon from "@mui/icons-material/Layers";
import { Box, ListItem, Typography } from "@mui/material";
import { ItemTypes } from "@minoru/react-dnd-treeview";
import { useDrag, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MoveZoneItem,
} from "../types";
import { CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE } from "../types";

const TREE_ITEM_TYPE =
  (ItemTypes as { TREE_ITEM?: string | symbol }).TREE_ITEM ?? "TREE_ITEM";

interface KartlagerMoveZoneProps {
  items: MoveZoneItem[];
  onDropFromTree: (nodeId: GroupLayerTreeNode["id"]) => void;
  onDropFromCatalog: (item: CatalogDragItem) => void;
  canAcceptCatalogItem?: (item: CatalogDragItem) => boolean;
}

function MoveZoneItemRow({ item }: { item: MoveZoneItem }) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: MOVE_ZONE_DRAG_TYPE,
      item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item],
  );

  return (
    <ListItem
      ref={(node) => {
        dragRef(node);
      }}
      sx={{
        cursor: "grab",
        px: 1.5,
        py: 1,
        border: "1px solid",
        borderColor: "warning.light",
        borderRadius: 2,
        bgcolor: "action.hover",
        opacity: isDragging ? 0.4 : 1,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicatorIcon
        fontSize="small"
        sx={{ color: "text.secondary", flexShrink: 0, mt: 0.25 }}
      />
      {item.kind === "group" ? (
        <FolderIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.25 }} />
      ) : (
        <LayersIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.25 }} />
      )}
      <Typography
        variant="body2"
        title={item.name}
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {item.name}
      </Typography>
    </ListItem>
  );
}

export default function KartlagerMoveZone({
  items,
  onDropFromTree,
  onDropFromCatalog,
  canAcceptCatalogItem = () => true,
}: KartlagerMoveZoneProps) {
  const { t } = useTranslation();

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [TREE_ITEM_TYPE, CATALOG_DRAG_TYPE],
      canDrop: (item: GroupLayerTreeNode | CatalogDragItem, monitor) => {
        if (monitor.getItemType() === CATALOG_DRAG_TYPE) {
          return canAcceptCatalogItem(item as CatalogDragItem);
        }
        return (item as GroupLayerTreeNode)?.id != null;
      },
      drop: (item: GroupLayerTreeNode | CatalogDragItem, monitor) => {
        if (monitor.didDrop()) {
          return;
        }

        if (monitor.getItemType() === CATALOG_DRAG_TYPE) {
          onDropFromCatalog(item as CatalogDragItem);
          return { movedToMoveZone: true };
        }

        const treeNode = item as GroupLayerTreeNode;
        if (treeNode?.id == null) {
          return;
        }
        onDropFromTree(treeNode.id);
        return { movedToMoveZone: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [canAcceptCatalogItem, onDropFromCatalog, onDropFromTree],
  );

  const highlight = isOver && canDrop;

  return (
    <Box
      ref={(node) => {
        dropRef(node as HTMLDivElement | null);
      }}
      sx={{
        width: "100%",
        minHeight: 140,
        maxHeight: 280,
        display: "flex",
        flexDirection: "column",
        p: 1.5,
        boxSizing: "border-box",
        border: "2px dashed",
        borderColor: highlight ? "primary.main" : "divider",
        borderRadius: 2,
        bgcolor: highlight ? "action.selected" : "background.default",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ mb: 0.5, textAlign: "left", fontWeight: 600 }}
      >
        {t("map.drawOrderMoveZone")}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, textAlign: "left", display: "block" }}
      >
        {t("groupsDevelopment.moveZoneHelp")}
      </Typography>

      {items.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 1,
          }}
        ></Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {items.map((item) => (
            <MoveZoneItemRow key={item.key} item={item} />
          ))}
        </Box>
      )}
    </Box>
  );
}
