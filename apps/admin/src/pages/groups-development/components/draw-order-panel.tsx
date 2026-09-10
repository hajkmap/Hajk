import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  DragIndicatorOutlined as DragIndicatorOutlinedIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import {
  Tree,
  type DropOptions,
  type RenderParams,
} from "@minoru/react-dnd-treeview";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GroupLayerTreeNode, MoveZoneItem } from "../types";
import { GROUP_LAYER_TREE_ROOT_ID, MOVE_ZONE_DRAG_TYPE } from "../types";
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
  onMoveZoneDrop?: (item: MoveZoneItem, insertIndex?: number) => void;
  canAcceptMoveZoneItem?: (item: MoveZoneItem) => boolean;
}

function orderedIdsFromTree(tree: GroupLayerTreeNode[]): string[] {
  return applySiblingOrderFromFlatTree(tree)
    .filter((node) => node.parent === GROUP_LAYER_TREE_ROOT_ID)
    .map((node) => parseTreeNodeSourceId(node.id));
}

function moveOrderedId(
  orderedIds: string[],
  layerId: string,
  delta: -1 | 1,
): string[] {
  const index = orderedIds.indexOf(layerId);
  const nextIndex = index + delta;
  if (index < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) {
    return orderedIds;
  }
  const next = orderedIds.slice();
  const [moved] = next.splice(index, 1);
  next.splice(nextIndex, 0, moved);
  return next;
}

function canDropDrawOrderNode(
  tree: GroupLayerTreeNode[],
  options: {
    dragSourceId?: GroupLayerTreeNode["id"];
    dropTargetId?: GroupLayerTreeNode["id"];
    dragSource?: GroupLayerTreeNode;
    dropTarget?: GroupLayerTreeNode;
    monitor?: {
      getItemType: () => string | symbol | null;
      getItem: () => unknown;
    };
  },
): boolean {
  const { dragSourceId, dropTargetId, dragSource, dropTarget, monitor } =
    options;

  if (dropTargetId == null) {
    return false;
  }

  const itemType = monitor?.getItemType();
  if (itemType === MOVE_ZONE_DRAG_TYPE) {
    const item = monitor?.getItem() as MoveZoneItem | undefined;
    return item?.kind === "layer";
  }

  if (dragSourceId == null) {
    return false;
  }

  // Same-position / self drops must not be accepted — otherwise the outer
  // root zone may steal the drop and append the layer at the bottom.
  if (dragSourceId === dropTargetId) {
    return false;
  }

  const source = dragSource ?? tree.find((node) => node.id === dragSourceId);
  if (source?.data?.kind !== "layer") {
    return false;
  }

  if (dropTargetId === GROUP_LAYER_TREE_ROOT_ID) {
    return true;
  }

  const target = dropTarget ?? tree.find((node) => node.id === dropTargetId);
  return target?.data?.kind === "layer";
}

function DrawOrderTreeNode({
  node,
  options,
  drawOrder,
  canMoveUp,
  canMoveDown,
  isHighlighted,
  onMoveUp,
  onMoveDown,
}: {
  node: GroupLayerTreeNode;
  options: RenderParams;
  drawOrder: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isHighlighted: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { t } = useTranslation();
  const { isDragging } = options;

  return (
    <Box
      sx={{
        opacity: isDragging ? 0.45 : 1,
        pl: "11px",
        bgcolor: isHighlighted ? "action.selected" : "transparent",
        borderRadius: isHighlighted ? 1 : 0,
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
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              py: 0.25,
              pr: 6,
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

          <ListItemSecondaryAction
            sx={{
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IconButton
              size="small"
              disableRipple
              disabled={!canMoveUp || isDragging}
              aria-label={t("common.moveUp")}
              title={t("common.moveUp")}
              sx={{
                p: 0.125,
                width: 22,
                height: 18,
                "&:hover": { backgroundColor: "transparent" },
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onMoveUp();
              }}
            >
              <ArrowUpwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              size="small"
              disableRipple
              disabled={!canMoveDown || isDragging}
              aria-label={t("common.moveDown")}
              title={t("common.moveDown")}
              sx={{
                p: 0.125,
                width: 22,
                height: 18,
                "&:hover": { backgroundColor: "transparent" },
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onMoveDown();
              }}
            >
              <ArrowDownwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function DrawOrderPanel({
  layers,
  orderedIds,
  onOrderedIdsChange,
  onMoveZoneDrop,
  canAcceptMoveZoneItem = () => false,
}: DrawOrderPanelProps) {
  const { t } = useTranslation();
  const [highlightedLayerId, setHighlightedLayerId] = useState<string | null>(
    null,
  );
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

  const handleMoveLayer = useCallback(
    (layerId: string, delta: -1 | 1) => {
      const next = moveOrderedId(orderedIds, layerId, delta);
      if (next === orderedIds) {
        return;
      }
      setHighlightedLayerId(layerId);
      onOrderedIdsChange(next);
    },
    [onOrderedIdsChange, orderedIds],
  );

  const handleTreeDropToRoot = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const layerId = parseTreeNodeSourceId(nodeId);
      const index = orderedIds.indexOf(layerId);
      if (index < 0) {
        return;
      }
      // Already last — keep position. Same-position drops that miss the tree
      // target would otherwise append and look like an index change.
      if (index === orderedIds.length - 1) {
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
    (node: GroupLayerTreeNode) => {
      if (node.data?.kind !== "layer") {
        return false;
      }
      const layerId = parseTreeNodeSourceId(node.id);
      const index = orderedIds.indexOf(layerId);
      // Do not accept already-last layers on the empty bottom zone.
      return index >= 0 && index < orderedIds.length - 1;
    },
    [orderedIds],
  );

  const resolveMoveZoneInsertIndex = useCallback(
    (options: DropOptions<GroupLayerTreeNode["data"]>) => {
      if (
        options.dropTargetId == null ||
        options.dropTargetId === GROUP_LAYER_TREE_ROOT_ID
      ) {
        return options.relativeIndex ?? orderedIds.length;
      }

      const targetLayerId = parseTreeNodeSourceId(options.dropTargetId);
      const targetIndex = orderedIds.indexOf(targetLayerId);
      if (targetIndex < 0) {
        return options.relativeIndex ?? orderedIds.length;
      }

      if (options.relativeIndex != null) {
        return options.relativeIndex;
      }

      return targetIndex;
    },
    [orderedIds],
  );

  const handleDrop = useCallback(
    (
      newTree: GroupLayerTreeNode[],
      options: DropOptions<GroupLayerTreeNode["data"]>,
    ) => {
      const itemType = options.monitor.getItemType();

      if (itemType === MOVE_ZONE_DRAG_TYPE) {
        const moveItem = options.monitor.getItem() as MoveZoneItem;
        if (!canAcceptMoveZoneItem(moveItem)) {
          return;
        }
        onMoveZoneDrop?.(moveItem, resolveMoveZoneInsertIndex(options));
        return;
      }

      if (
        options.dragSourceId != null &&
        options.dragSourceId === options.dropTargetId
      ) {
        return;
      }

      const updatedTree = applyDropOnLayerRedirect(newTree, {
        dragSourceId: options.dragSourceId,
        dropTargetId: options.dropTargetId,
        dropTarget: options.dropTarget,
      });

      const nextIds = orderedIdsFromTree(
        applySiblingOrderFromFlatTree(updatedTree),
      );
      const orderUnchanged =
        nextIds.length === orderedIds.length &&
        nextIds.every((id, index) => id === orderedIds[index]);
      if (orderUnchanged) {
        return;
      }

      onOrderedIdsChange(nextIds);
    },
    [
      canAcceptMoveZoneItem,
      onMoveZoneDrop,
      onOrderedIdsChange,
      orderedIds,
      resolveMoveZoneInsertIndex,
    ],
  );

  const handleMoveZoneDropToRoot = useCallback(
    (item: MoveZoneItem) => {
      onMoveZoneDrop?.(item, orderedIds.length);
    },
    [onMoveZoneDrop, orderedIds.length],
  );

  if (orderedIds.length === 0) {
    return (
      <GroupLayerTreeDropZone
        emptyLabel={t("map.drawOrderHelp")}
        onCatalogDrop={() => undefined}
        canAcceptCatalogItem={() => false}
        onMoveZoneDrop={handleMoveZoneDropToRoot}
        canAcceptMoveZoneItem={canAcceptMoveZoneItem}
        onTreeDropToRoot={() => undefined}
        canAcceptTreeItemToRoot={() => false}
      />
    );
  }

  return (
    <GroupLayerTreeDropZone
      onCatalogDrop={() => undefined}
      canAcceptCatalogItem={() => false}
      onMoveZoneDrop={handleMoveZoneDropToRoot}
      canAcceptMoveZoneItem={canAcceptMoveZoneItem}
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
          extraAcceptTypes={[MOVE_ZONE_DRAG_TYPE]}
          initialOpen
          sort={false}
          insertDroppableFirst={false}
          dropTargetOffset={12}
          canDrop={(tree, options) => {
            const itemType = options.monitor?.getItemType();
            if (itemType === MOVE_ZONE_DRAG_TYPE) {
              return canAcceptMoveZoneItem(
                options.monitor.getItem() as MoveZoneItem,
              );
            }
            return canDropDrawOrderNode(tree, options);
          }}
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
          render={(node, options) => {
            const layerId = parseTreeNodeSourceId(node.id);
            const index = orderedIds.indexOf(layerId);
            return (
              <DrawOrderTreeNode
                node={node}
                options={options}
                drawOrder={drawOrderById.get(layerId) ?? 1}
                canMoveUp={index > 0}
                canMoveDown={index >= 0 && index < orderedIds.length - 1}
                isHighlighted={highlightedLayerId === layerId}
                onMoveUp={() => handleMoveLayer(layerId, -1)}
                onMoveDown={() => handleMoveLayer(layerId, 1)}
              />
            );
          }}
        />
      </Box>
    </GroupLayerTreeDropZone>
  );
}
