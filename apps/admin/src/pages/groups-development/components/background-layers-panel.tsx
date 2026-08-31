import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import LayersIcon from "@mui/icons-material/Layers";
import MoreOutlinedIcon from "@mui/icons-material/MoreOutlined";
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Tree,
  mutateTreeWithIndex,
  type DropOptions,
  type RenderParams,
} from "@minoru/react-dnd-treeview";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  CatalogDragItem,
  GroupLayerTreeNode,
  LayerDisplaySettings,
  LayerFormValues,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  GROUP_LAYER_TREE_ROOT_ID,
} from "../types";
import {
  applyDropOnLayerRedirect,
  applySiblingOrderFromFlatTree,
  createLayerTreeNode,
  createTreeNodeFromCatalogItem,
  parseTreeNodeSourceId,
  resolveCatalogInsertTarget,
} from "../utils/tree-model";
import GroupLayerTreeDropZone from "./group-layer-tree-drop-zone";
import LayerFormDialog from "./layer-form-dialog";

interface BackgroundLayerRow {
  id: string;
  name: string;
}

interface BackgroundLayersPanelProps {
  layers: BackgroundLayerRow[];
  orderedIds: string[];
  onOrderedIdsChange: (ids: string[]) => void;
  layerDisplaySettings: Record<string, LayerDisplaySettings>;
  onLayerDisplaySettingsChange: (
    layerId: string,
    settings: LayerDisplaySettings,
  ) => void;
  search?: string;
}

function orderedIdsFromTree(tree: GroupLayerTreeNode[]): string[] {
  return applySiblingOrderFromFlatTree(tree)
    .filter((node) => node.parent === GROUP_LAYER_TREE_ROOT_ID)
    .map((node) => parseTreeNodeSourceId(node.id));
}

function insertBackgroundCatalogItem(
  tree: GroupLayerTreeNode[],
  catalogItem: CatalogDragItem,
  options: {
    dropTargetId: GroupLayerTreeNode["id"];
    dropTarget?: GroupLayerTreeNode;
    relativeIndex?: number;
  },
): GroupLayerTreeNode[] | null {
  if (catalogItem.kind !== "layer") {
    return null;
  }

  const { index } = resolveCatalogInsertTarget(
    tree,
    options.dropTargetId,
    options.dropTarget,
    options.relativeIndex,
  );

  const resolvedParentId = GROUP_LAYER_TREE_ROOT_ID;

  const newNode = createTreeNodeFromCatalogItem(
    catalogItem,
    resolvedParentId,
    0,
  );

  if (tree.some((node) => node.id === newNode.id)) {
    return null;
  }

  const next = mutateTreeWithIndex(
    [...tree, newNode],
    newNode.id,
    resolvedParentId,
    index,
  ) as GroupLayerTreeNode[];

  return applySiblingOrderFromFlatTree(next);
}

function canDropBackgroundLayerNode(
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

  if (dragSourceId == null) {
    if (monitor?.getItemType() !== CATALOG_DRAG_TYPE) {
      return false;
    }
    const item = monitor.getItem() as CatalogDragItem | undefined;
    if (item?.kind !== "layer") {
      return false;
    }
    return !tree.some((node) => node.data?.sourceId === item.id);
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

function BackgroundLayerTreeNode({
  node,
  options,
  onEdit,
  onRemove,
}: {
  node: GroupLayerTreeNode;
  options: RenderParams;
  onEdit: (layerId: string, name: string) => void;
  onRemove: (layerId: string) => void;
}) {
  const { t } = useTranslation();
  const { isDragging } = options;
  const layerId = parseTreeNodeSourceId(node.id);

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
              slotProps={{
                primary: {
                  variant: "body1",
                  sx: {
                    pr: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
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
              alignItems: "center",
            }}
          >
            <IconButton
              size="small"
              aria-label={t("groupsDevelopment.editLayer")}
              title={t("groupsDevelopment.editLayer")}
              sx={{ mt: "1px", cursor: "pointer" }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(layerId, node.text);
              }}
            >
              <MoreOutlinedIcon
                sx={{
                  width: "0.7em",
                  height: "0.7em",
                  transform: "rotate(180deg)",
                  color: "grey.500",
                }}
              />
            </IconButton>
            <IconButton
              size="small"
              aria-label={t("groupsDevelopment.removeLayerFromTree")}
              title={t("groupsDevelopment.removeLayerFromTree")}
              sx={{ mt: "1px", cursor: "pointer" }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(layerId);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function BackgroundLayersPanel({
  layers,
  orderedIds,
  onOrderedIdsChange,
  layerDisplaySettings,
  onLayerDisplaySettingsChange,
  search = "",
}: BackgroundLayersPanelProps) {
  const { t } = useTranslation();
  const [editTarget, setEditTarget] = useState<{
    layerId: string;
    name: string;
  } | null>(null);

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

  const editInitialValues = useMemo<LayerFormValues | undefined>(() => {
    if (!editTarget) {
      return undefined;
    }
    const settings =
      layerDisplaySettings[editTarget.layerId] ??
      DEFAULT_LAYER_DISPLAY_SETTINGS;
    return {
      layerVisibleAtStart: settings.layerVisibleAtStart,
      layerInfoBox: settings.layerInfoBox,
    };
  }, [editTarget, layerDisplaySettings]);

  const handleRemove = useCallback(
    (layerId: string) => {
      onOrderedIdsChange(orderedIds.filter((entry) => entry !== layerId));
    },
    [onOrderedIdsChange, orderedIds],
  );

  const handleEdit = useCallback((layerId: string, name: string) => {
    setEditTarget({ layerId, name });
  }, []);

  const handleFormSubmit = useCallback(
    (values: LayerFormValues) => {
      if (!editTarget) {
        return;
      }
      onLayerDisplaySettingsChange(editTarget.layerId, {
        ...(layerDisplaySettings[editTarget.layerId] ??
          DEFAULT_LAYER_DISPLAY_SETTINGS),
        layerVisibleAtStart: values.layerVisibleAtStart,
        layerInfoBox: values.layerInfoBox,
      });
      setEditTarget(null);
    },
    [editTarget, layerDisplaySettings, onLayerDisplaySettingsChange],
  );

  const handleCatalogDropToRoot = useCallback(
    (item: CatalogDragItem) => {
      if (item.kind !== "layer" || orderedIds.includes(item.id)) {
        return;
      }
      onOrderedIdsChange([...orderedIds, item.id]);
    },
    [onOrderedIdsChange, orderedIds],
  );

  const canAcceptCatalogItem = useCallback(
    (item: CatalogDragItem) =>
      item.kind === "layer" && !orderedIds.includes(item.id),
    [orderedIds],
  );

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
      const itemType = options.monitor.getItemType();

      if (itemType === CATALOG_DRAG_TYPE) {
        const catalogItem = options.monitor.getItem() as CatalogDragItem;
        const next = insertBackgroundCatalogItem(treeData, catalogItem, {
          dropTargetId: options.dropTargetId ?? GROUP_LAYER_TREE_ROOT_ID,
          dropTarget: options.dropTarget,
          relativeIndex: options.relativeIndex,
        });
        if (!next) {
          return;
        }
        onOrderedIdsChange(orderedIdsFromTree(next));
        return;
      }

      const updatedTree = applyDropOnLayerRedirect(newTree, {
        dragSourceId: options.dragSourceId,
        dropTargetId: options.dropTargetId,
        dropTarget: options.dropTarget,
      });

      onOrderedIdsChange(
        orderedIdsFromTree(applySiblingOrderFromFlatTree(updatedTree)),
      );
    },
    [onOrderedIdsChange, treeData],
  );

  if (orderedIds.length === 0) {
    return (
      <GroupLayerTreeDropZone
        emptyLabel={t("groupsDevelopment.emptyBackground")}
        onCatalogDrop={handleCatalogDropToRoot}
        canAcceptCatalogItem={canAcceptCatalogItem}
      />
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
    <>
      <GroupLayerTreeDropZone
        onCatalogDrop={handleCatalogDropToRoot}
        canAcceptCatalogItem={canAcceptCatalogItem}
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
            extraAcceptTypes={[CATALOG_DRAG_TYPE]}
            initialOpen
            sort={false}
            insertDroppableFirst={false}
            dropTargetOffset={12}
            canDrop={(tree, options) =>
              canDropBackgroundLayerNode(tree, options)
            }
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
                <BackgroundLayerTreeNode
                  node={node}
                  options={options}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                />
              </Box>
            )}
          />
        </Box>
      </GroupLayerTreeDropZone>

      <LayerFormDialog
        open={editTarget != null}
        layerName={editTarget?.name ?? ""}
        initialValues={editInitialValues}
        onClose={() => setEditTarget(null)}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
