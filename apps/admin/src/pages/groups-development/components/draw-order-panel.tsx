import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import LayersIcon from "@mui/icons-material/Layers";
import {
  Box,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Tree,
  type DropOptions,
  type RenderParams,
} from "@minoru/react-dnd-treeview";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { GroupLayerTreeNode } from "../types";
import { GROUP_LAYER_TREE_ROOT_ID } from "../types";
import {
  applyDropOnLayerRedirect,
  applySiblingOrderFromFlatTree,
  createLayerTreeNode,
  parseTreeNodeSourceId,
} from "../utils/tree-model";
import GroupLayerTreeDropZone from "./group-layer-tree-drop-zone";

interface DrawOrderLayerRow {
  id: string;
  name: string;
}

interface DrawOrderPanelProps {
  layers: DrawOrderLayerRow[];
  /** Top → bottom catalog ids. Bottom gets drawOrder 1. */
  orderedIds: string[];
  onOrderedIdsChange: (ids: string[]) => void;
  search?: string;
}

function orderedIdsFromTree(tree: GroupLayerTreeNode[]): string[] {
  return applySiblingOrderFromFlatTree(tree)
    .filter((node) => node.parent === GROUP_LAYER_TREE_ROOT_ID)
    .map((node) => parseTreeNodeSourceId(node.id));
}

function canDropDrawOrderNode(
  tree: GroupLayerTreeNode[],
  options: {
    dragSourceId?: GroupLayerTreeNode["id"];
    dropTargetId?: GroupLayerTreeNode["id"];
    dragSource?: GroupLayerTreeNode;
    dropTarget?: GroupLayerTreeNode;
  },
): boolean {
  const { dragSourceId, dropTargetId, dragSource, dropTarget } = options;

  if (dropTargetId == null || dragSourceId == null) {
    return false;
  }

  const source =
    dragSource ?? tree.find((node) => node.id === dragSourceId);
  if (source?.data?.kind !== "layer") {
    return false;
  }

  if (dropTargetId === GROUP_LAYER_TREE_ROOT_ID) {
    return true;
  }

  const target =
    dropTarget ?? tree.find((node) => node.id === dropTargetId);
  return target?.data?.kind === "layer";
}

function DrawOrderTreeNode({
  node,
  options,
  drawOrder,
}: {
  node: GroupLayerTreeNode;
  options: RenderParams;
  drawOrder: number;
}) {
  const { isDragging } = options;

  return (
    <Box
      sx={{
        opacity: isDragging ? 0.45 : 1,
        pl: "11px",
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            alignItems: "center",
            px: 0,
            pt: "7px",
            flexShrink: 0,
            color: "action.active",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <DragIndicatorOutlinedIcon fontSize="small" />
        </Box>

        <ListItemButton
          disableTouchRipple
          dense
          sx={{
            flex: 1,
            p: 0,
            pl: "2px",
            position: "relative",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              py: 0.25,
              pr: 1,
              borderBottom: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
            }}
          >
            <LayersIcon
              sx={{
                display: "block",
                mr: "5px",
                mt: "6px",
                ml: "4px",
                width: 18,
                height: 18,
                color: "action.active",
              }}
            />

            <ListItemText
              primary={node.text}
              secondary={`${drawOrder}`}
              slotProps={{
                primary: {
                  variant: "body1",
                  sx: {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                },
                secondary: {
                  variant: "caption",
                  sx: { color: "text.secondary" },
                },
              }}
            />
          </Box>
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function DrawOrderPanel({
  layers,
  orderedIds,
  onOrderedIdsChange,
  search = "",
}: DrawOrderPanelProps) {
  const { t } = useTranslation();
  const byId = useMemo(
    () => new Map(layers.map((layer) => [layer.id, layer])),
    [layers],
  );

  const treeData = useMemo<GroupLayerTreeNode[]>(
    () =>
      orderedIds
        .map((id, index) => {
          const layer = byId.get(id);
          if (!layer) {
            return null;
          }
          return createLayerTreeNode(
            layer.id,
            layer.name,
            GROUP_LAYER_TREE_ROOT_ID,
            index,
          );
        })
        .filter((node): node is GroupLayerTreeNode => node != null),
    [byId, orderedIds],
  );

  const drawOrderById = useMemo(() => {
    const total = orderedIds.length;
    const map = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      // Bottom item = 1; top item = N
      map.set(id, total - index);
    });
    return map;
  }, [orderedIds]);

  const visibleNodeIds = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    return new Set(
      treeData
        .filter((node) => node.text.toLowerCase().includes(normalized))
        .map((node) => String(node.id)),
    );
  }, [search, treeData]);

  const handleTreeDropToRoot = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const layerId = parseTreeNodeSourceId(nodeId);
      if (!orderedIds.includes(layerId)) {
        return;
      }
      onOrderedIdsChange([
        ...orderedIds.filter((id) => id !== layerId),
        layerId,
      ]);
    },
    [onOrderedIdsChange, orderedIds],
  );

  const canAcceptTreeItemToRoot = useCallback(
    (node: GroupLayerTreeNode) => node.data?.kind === "layer",
    [],
  );

  const handleDrop = useCallback(
    (
      newTree: GroupLayerTreeNode[],
      options: DropOptions<GroupLayerTreeNode["data"]>,
    ) => {
      const updatedTree = applyDropOnLayerRedirect(newTree, {
        dragSourceId: options.dragSourceId,
        dropTargetId: options.dropTargetId,
        dropTarget: options.dropTarget,
      });

      onOrderedIdsChange(
        orderedIdsFromTree(applySiblingOrderFromFlatTree(updatedTree)),
      );
    },
    [onOrderedIdsChange],
  );

  if (orderedIds.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {t("map.drawOrderHelp")}
        </Typography>
      </Box>
    );
  }

  if (visibleNodeIds?.size === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("map.drawOrderNoSearchResults")}
        </Typography>
      </Box>
    );
  }

  return (
    <GroupLayerTreeDropZone
      onCatalogDrop={() => undefined}
      canAcceptCatalogItem={() => false}
      onTreeDropToRoot={handleTreeDropToRoot}
      canAcceptTreeItemToRoot={canAcceptTreeItemToRoot}
    >
      <Box
        sx={{
          pb: "8px",
          flex: 1,
          minHeight: 120,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tree<GroupLayerTreeNode["data"]>
          tree={treeData}
          rootId={GROUP_LAYER_TREE_ROOT_ID}
          initialOpen
          sort={false}
          insertDroppableFirst={false}
          dropTargetOffset={12}
          canDrop={(tree, options) => canDropDrawOrderNode(tree, options)}
          onDrop={handleDrop}
          placeholderRender={(_node, { depth }) => (
            <Box
              sx={{
                height: 2,
                ml: `${depth * 20}px`,
                mr: 1,
                bgcolor: "primary.main",
                borderRadius: 1,
              }}
            />
          )}
          rootProps={{
            style: {
              flex: "0 0 auto",
              minHeight: 0,
            },
          }}
          classes={{
            root: "group-layer-tree-root",
            listItem: "group-layer-tree-item",
            dropTarget: "group-layer-tree-drop-target",
            draggingSource: "group-layer-tree-dragging",
          }}
          render={(node, options) => (
            <Box
              sx={{
                display:
                  visibleNodeIds && !visibleNodeIds.has(String(node.id))
                    ? "none"
                    : "block",
              }}
            >
              <DrawOrderTreeNode
                node={node}
                options={options}
                drawOrder={
                  drawOrderById.get(parseTreeNodeSourceId(node.id)) ?? 1
                }
              />
            </Box>
          )}
        />
      </Box>
    </GroupLayerTreeDropZone>
  );
}
