import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderIcon from "@mui/icons-material/Folder";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LayersIcon from "@mui/icons-material/Layers";
import {
  Box,
  Button,
  IconButton,
  ListItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { ItemTypes } from "@minoru/react-dnd-treeview";
import { useMemo, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";

import DialogWrapper from "../../../components/flexible-dialog";
import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  MoveZoneItem,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  GROUP_LAYER_TREE_ROOT_ID,
  MOVE_ZONE_DRAG_TYPE,
} from "../types";
import { sortSiblingNodes } from "../utils/tree-model";

const TREE_ITEM_TYPE =
  (ItemTypes as { TREE_ITEM?: string | symbol }).TREE_ITEM ?? "TREE_ITEM";

interface KartlagerMoveZoneProps {
  items: MoveZoneItem[];
  onDropFromTree: (nodeId: GroupLayerTreeNode["id"]) => void;
  onDropFromCatalog: (item: CatalogDragItem) => void;
  canAcceptCatalogItem?: (item: CatalogDragItem) => boolean;
}

function summarizeMoveZoneSubtree(nodes: GroupLayerTreeNode[]): {
  groupCount: number;
  layerCount: number;
} {
  const root = nodes.find((node) => node.parent === GROUP_LAYER_TREE_ROOT_ID);
  const descendants = root
    ? nodes.filter((node) => node.id !== root.id)
    : nodes;
  return {
    groupCount: descendants.filter((node) => node.data?.kind === "group")
      .length,
    layerCount: descendants.filter((node) => node.data?.kind === "layer")
      .length,
  };
}

function MoveZoneContentTree({
  nodes,
  parentId = GROUP_LAYER_TREE_ROOT_ID,
  depth = 0,
}: {
  nodes: GroupLayerTreeNode[];
  parentId?: GroupLayerTreeNode["parent"];
  depth?: number;
}) {
  const children = useMemo(
    () =>
      nodes
        .filter((node) => node.parent === parentId)
        .slice()
        .sort(sortSiblingNodes),
    [nodes, parentId],
  );

  if (children.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {children.map((node) => {
        const isGroup = node.data?.kind === "group";
        return (
          <Box key={String(node.id)}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                pl: depth * 2,
                py: 0.25,
              }}
            >
              {isGroup ? (
                <FolderIcon
                  fontSize="small"
                  sx={{ mt: 0.15, color: "action.active", flexShrink: 0 }}
                />
              ) : (
                <LayersIcon
                  fontSize="small"
                  sx={{ mt: 0.15, color: "action.active", flexShrink: 0 }}
                />
              )}
              <Typography
                variant="body2"
                sx={{ wordBreak: "break-word", minWidth: 0 }}
              >
                {node.text}
              </Typography>
            </Box>
            {isGroup ? (
              <MoveZoneContentTree
                nodes={nodes}
                parentId={node.id}
                depth={depth + 1}
              />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

function MoveZoneItemRow({
  item,
  onShowContents,
}: {
  item: MoveZoneItem;
  onShowContents: (item: MoveZoneItem) => void;
}) {
  const { t } = useTranslation();
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

  const canInspect = item.kind === "group";

  return (
    <ListItem
      ref={(node) => {
        dragRef(node);
      }}
      sx={{
        cursor: "grab",
        px: 0.75,
        py: 0.75,
        border: "1px solid",
        borderColor: "warning.light",
        borderRadius: 1.5,
        bgcolor: "action.hover",
        opacity: isDragging ? 0.4 : 1,
        display: "flex",
        alignItems: "flex-start",
        gap: 0.5,
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicatorIcon
        fontSize="small"
        sx={{ color: "text.secondary", flexShrink: 0, mt: 0.15 }}
      />
      {item.kind === "group" ? (
        <FolderIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.15 }} />
      ) : (
        <LayersIcon fontSize="small" sx={{ flexShrink: 0, mt: 0.15 }} />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Tooltip title={item.name} enterDelay={400}>
          <Typography
            variant="caption"
            component="div"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mt: 0.5,
            }}
          >
            {item.name}
          </Typography>
        </Tooltip>
      </Box>
      {canInspect ? (
        <Tooltip title={t("groupsDevelopment.moveZoneShowContent")}>
          <IconButton
            size="small"
            aria-label={t("groupsDevelopment.moveZoneShowContent")}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onShowContents(item);
            }}
            sx={{ flexShrink: 0, mt: -0.25 }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </ListItem>
  );
}

function MoveZoneContentsDialogBody({ item }: { item: MoveZoneItem }) {
  const { t } = useTranslation();
  const summary = summarizeMoveZoneSubtree(item.nodes);

  if (summary.groupCount === 0 && summary.layerCount === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("groupsDevelopment.moveZoneNoNestedContent")}
      </Typography>
    );
  }

  const root = item.nodes.find(
    (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
  );

  return (
    <MoveZoneContentTree
      nodes={item.nodes}
      parentId={root?.id ?? GROUP_LAYER_TREE_ROOT_ID}
    />
  );
}

export default function KartlagerMoveZone({
  items,
  onDropFromTree,
  onDropFromCatalog,
  canAcceptCatalogItem = () => true,
}: KartlagerMoveZoneProps) {
  const { t } = useTranslation();
  const [inspectItem, setInspectItem] = useState<MoveZoneItem | null>(null);

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
    <>
      <Box
        ref={(node) => {
          dropRef(node as HTMLDivElement | null);
        }}
        sx={{
          width: "100%",
          minHeight: 200,
          maxHeight: 380,
          display: "flex",
          flexDirection: "column",
          p: 1,
          boxSizing: "border-box",
          border: "2px dashed",
          borderColor: highlight ? "primary.main" : "divider",
          borderRadius: 2,
          bgcolor: highlight ? "action.selected" : "background.default",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ mb: 0.25, textAlign: "center", fontWeight: 600 }}
        >
          {t("map.drawOrderMoveZone")}
        </Typography>

        {items.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 0.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {t("groupsDevelopment.moveZoneEmpty")}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            {items.map((item) => (
              <MoveZoneItemRow
                key={item.key}
                item={item}
                onShowContents={setInspectItem}
              />
            ))}
          </Box>
        )}
      </Box>

      <DialogWrapper
        open={inspectItem != null}
        title={t("groupsDevelopment.moveZoneContentsTitle", {
          name: inspectItem?.name ?? "",
        })}
        onClose={() => setInspectItem(null)}
        fullWidth
        maxWidth="sm"
        actions={
          <Button onClick={() => setInspectItem(null)} color="primary">
            {t("common.dialog.closeBtn")}
          </Button>
        }
      >
        {inspectItem ? <MoveZoneContentsDialogBody item={inspectItem} /> : null}
      </DialogWrapper>
    </>
  );
}
