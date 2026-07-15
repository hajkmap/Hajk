import {
  Tree,
  MultiBackend,
  getBackendOptions,
  type DropOptions,
} from "@minoru/react-dnd-treeview";
import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useGroups, useUpdateGroup } from "../../../api/groups";
import { useLayers } from "../../../api/layers";
import {
  getUpdateGroupErrorMessage,
} from "../../groups/utils/group-errors";
import type {
  CatalogDragItem,
  GroupDisplaySettings,
  GroupFormValues,
  GroupLayerTreeNode,
  LayerDisplaySettings,
  LayerFormValues,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  GROUP_LAYER_TREE_ROOT_ID,
} from "../types";
import { toDisplaySettings, toFormValues } from "../utils/group-form";
import {
  applyDropOnLayerRedirect,
  applySiblingOrderFromFlatTree,
  canDropGroupLayerNode,
  collectPlacedSourceIds,
  createTreeNodeFromCatalogItem,
  getNextSiblingOrder,
  insertCatalogItemIntoTree,
  isValidLayerParentId,
  removeTreeNodeWithDescendants,
} from "../utils/tree-model";
import { filterTreeBySearch } from "../utils/tree-filter";
import {
  toggleGroupVisibility,
  toggleLayerVisibility,
} from "../utils/tree-visibility";
import GroupLayerAddDialog from "./group-layer-add-dialog";
import GroupLayerCatalog from "./group-layer-catalog";
import GroupFormDialog from "./group-form-dialog";
import LayerFormDialog from "./layer-form-dialog";
import GroupLayerTreeDropZone from "./group-layer-tree-drop-zone";
import GroupLayerTreeNodeView from "./group-layer-tree-node";
import LayerSwitcherPreview from "./layer-switcher-preview";

interface AddDialogTarget {
  parentId: GroupLayerTreeNode["parent"];
  parentName: string;
  excludeGroupSourceId?: string;
  allowLayers: boolean;
}

export default function GroupLayerTree() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { mutateAsync: updateGroup, isPending: isUpdatingGroup } =
    useUpdateGroup();
  const [treeData, setTreeData] = useState<GroupLayerTreeNode[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [addDialogTarget, setAddDialogTarget] = useState<AddDialogTarget | null>(
    null,
  );
  const [groupDisplaySettings, setGroupDisplaySettings] = useState<
    Record<string, GroupDisplaySettings>
  >({});
  const [editDialogTarget, setEditDialogTarget] = useState<{
    nodeId: GroupLayerTreeNode["id"];
    sourceId: string;
    name: string;
  } | null>(null);
  const [layerDisplaySettings, setLayerDisplaySettings] = useState<
    Record<string, LayerDisplaySettings>
  >({});
  const [layerEditDialogTarget, setLayerEditDialogTarget] = useState<{
    nodeId: GroupLayerTreeNode["id"];
    sourceId: string;
    name: string;
  } | null>(null);

  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: layers = [], isLoading: layersLoading } = useLayers();

  const placedIds = useMemo(() => collectPlacedSourceIds(treeData), [treeData]);
  const visibleNodeIds = useMemo(() => {
    if (!search.trim()) {
      return null;
    }

    return new Set(
      filterTreeBySearch(treeData, search).map((node) => String(node.id)),
    );
  }, [search, treeData]);

  const addCatalogItemsToParent = useCallback(
    (
      catalogItems: CatalogDragItem[],
      parentId: GroupLayerTreeNode["parent"],
    ) => {
      if (catalogItems.length === 0) {
        return;
      }

      setTreeData((current) => {
        let next = current;

        for (const catalogItem of catalogItems) {
          const order = getNextSiblingOrder(next, parentId);
          const newNode = createTreeNodeFromCatalogItem(
            catalogItem,
            parentId,
            order,
          );

          if (next.some((node) => node.id === newNode.id)) {
            continue;
          }

          if (
            catalogItem.kind === "layer" &&
            !isValidLayerParentId(next, parentId)
          ) {
            continue;
          }

          next = [...next, newNode];
        }

        return applySiblingOrderFromFlatTree(next);
      });
    },
    [],
  );

  const addCatalogItem = useCallback(
    (
      catalogItem: CatalogDragItem,
      dropOptions: {
        dropTargetId: GroupLayerTreeNode["id"];
        dropTarget?: GroupLayerTreeNode;
        relativeIndex?: number;
      },
    ) => {
      setTreeData((current) => {
        const next = insertCatalogItemIntoTree(current, catalogItem, dropOptions);

        if (!next) {
          return current;
        }

        return next;
      });
    },
    [],
  );

  const handleCatalogDropToRoot = useCallback(
    (catalogItem: CatalogDragItem) => {
      if (catalogItem.kind === "layer") {
        return;
      }

      addCatalogItem(catalogItem, {
        dropTargetId: GROUP_LAYER_TREE_ROOT_ID,
      });
    },
    [addCatalogItem],
  );

  const canAcceptCatalogDropToRoot = useCallback(
    (item: CatalogDragItem) => item.kind === "group",
    [],
  );

  const handleDrop = useCallback(
    (
      newTree: GroupLayerTreeNode[],
      options: DropOptions<GroupLayerTreeNode["data"]>,
    ) => {
      const itemType = options.monitor.getItemType();

      if (itemType === CATALOG_DRAG_TYPE) {
        addCatalogItem(options.monitor.getItem() as CatalogDragItem, {
          dropTargetId: options.dropTargetId,
          dropTarget: options.dropTarget,
          relativeIndex: options.relativeIndex,
        });
        return;
      }

      const updatedTree = applyDropOnLayerRedirect(newTree, {
        dragSourceId: options.dragSourceId,
        dropTargetId: options.dropTargetId,
        dropTarget: options.dropTarget,
      });

      const movedNode = updatedTree.find(
        (node) => node.id === options.dragSourceId,
      );
      if (
        movedNode?.data?.kind === "layer" &&
        !isValidLayerParentId(updatedTree, movedNode.parent)
      ) {
        return;
      }

      setTreeData(applySiblingOrderFromFlatTree(updatedTree));
    },
    [addCatalogItem],
  );

  const handleToggleLayerVisibility = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setVisibleIds((current) => toggleLayerVisibility(current, nodeId));
    },
    [],
  );

  const handleToggleGroupVisibility = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setVisibleIds((current) =>
        toggleGroupVisibility(treeData, current, nodeId),
      );
    },
    [treeData],
  );

  const handleOpenAddDialog = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const targetNode = treeData.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.data?.kind !== "group") {
        return;
      }

      setAddDialogTarget({
        parentId: targetNode.id,
        parentName: targetNode.text,
        excludeGroupSourceId: targetNode.data.sourceId,
        allowLayers: true,
      });
    },
    [treeData],
  );

  const handleOpenRootAddDialog = useCallback(() => {
    setAddDialogTarget({
      parentId: GROUP_LAYER_TREE_ROOT_ID,
      parentName: t("maps.tab.mapContent"),
      allowLayers: false,
    });
  }, [t]);

  const handleAddDialogConfirm = useCallback(
    (items: CatalogDragItem[]) => {
      if (!addDialogTarget) {
        return;
      }

      addCatalogItemsToParent(items, addDialogTarget.parentId);
    },
    [addCatalogItemsToParent, addDialogTarget],
  );

  const handleRemoveFromTree = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setTreeData((current) => {
        const removedNodes = current.filter(
          (node) =>
            !removeTreeNodeWithDescendants(current, nodeId).some(
              (remaining) => remaining.id === node.id,
            ),
        );
        const updatedTree = removeTreeNodeWithDescendants(current, nodeId);
        const removedIds = new Set(removedNodes.map((node) => String(node.id)));

        setVisibleIds((visible) => {
          const next = new Set(visible);
          for (const id of removedIds) {
            next.delete(id);
          }
          return next;
        });

        setLayerDisplaySettings((settings) => {
          const next = { ...settings };
          for (const node of removedNodes) {
            if (node.data?.kind === "layer") {
              delete next[node.data.sourceId];
            }
          }
          return next;
        });

        return updatedTree;
      });
    },
    [],
  );

  const handleOpenEditDialog = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node || node.data?.kind !== "group") {
        return;
      }

      setEditDialogTarget({
        nodeId,
        sourceId: node.data.sourceId,
        name: node.text,
      });
    },
    [treeData],
  );

  const handleOpenLayerEditDialog = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node || node.data?.kind !== "layer") {
        return;
      }

      setLayerEditDialogTarget({
        nodeId,
        sourceId: node.data.sourceId,
        name: node.text,
      });
    },
    [treeData],
  );

  const handleLayerFormSubmit = useCallback(
    (values: LayerFormValues) => {
      if (!layerEditDialogTarget) {
        return;
      }

      setLayerDisplaySettings((current) => ({
        ...current,
        [layerEditDialogTarget.sourceId]: {
          layerVisibleAtStart: values.layerVisibleAtStart,
          layerInfoBox: values.layerInfoBox,
        },
      }));

      setLayerEditDialogTarget(null);
    },
    [layerEditDialogTarget],
  );

  const handleTreeGroupFormSubmit = useCallback(
    async (values: GroupFormValues) => {
      if (!editDialogTarget) {
        return;
      }

      const displaySettings = toDisplaySettings(values);

      try {
        const response = await updateGroup({
          groupId: editDialogTarget.sourceId,
          data: { name: values.name },
        });

        setGroupDisplaySettings((current) => ({
          ...current,
          [editDialogTarget.sourceId]: displaySettings,
        }));

        setTreeData((current) =>
          current.map((node) =>
            node.data?.kind === "group" &&
            node.data.sourceId === editDialogTarget.sourceId
              ? { ...node, text: response.name }
              : node,
          ),
        );

        toast.success(t("groups.updateGroupSuccess", { name: response.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });

        setEditDialogTarget(null);
      } catch (error) {
        toast.error(
          getUpdateGroupErrorMessage(error, t, editDialogTarget.name),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          },
        );
      }
    },
    [editDialogTarget, palette.mode, t, updateGroup],
  );

  const treeEditFormInitialValues = useMemo(() => {
    if (!editDialogTarget) {
      return undefined;
    }

    return toFormValues(
      editDialogTarget.name,
      groupDisplaySettings[editDialogTarget.sourceId] ??
        DEFAULT_GROUP_DISPLAY_SETTINGS,
    );
  }, [editDialogTarget, groupDisplaySettings]);

  const layerEditFormInitialValues = useMemo((): LayerFormValues | undefined => {
    if (!layerEditDialogTarget) {
      return undefined;
    }

    return (
      layerDisplaySettings[layerEditDialogTarget.sourceId] ??
      DEFAULT_LAYER_DISPLAY_SETTINGS
    );
  }, [layerEditDialogTarget, layerDisplaySettings]);

  const isLoading = groupsLoading || layersLoading;

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(280px, 360px) minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "stretch",
          minHeight: {
            xs: "clamp(360px, calc(100vh - 260px), 640px)",
            lg: "clamp(480px, calc(100vh - 220px), 760px)",
          },
        }}
      >
        <GroupLayerCatalog
          groups={groups}
          layers={layers}
          placedGroupIds={placedIds.groupIds}
          placedLayerIds={placedIds.layerIds}
          groupDisplaySettings={groupDisplaySettings}
          onGroupDisplaySettingsChange={(groupId, settings) => {
            setGroupDisplaySettings((current) => ({
              ...current,
              [groupId]: settings,
            }));
          }}
          onGroupDisplaySettingsRemove={(groupId) => {
            setGroupDisplaySettings((current) => {
              const next = { ...current };
              delete next[groupId];
              return next;
            });
          }}
        />

        <LayerSwitcherPreview search={search} onSearchChange={setSearch}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("common.loading")}
              </Typography>
            </Box>
          ) : visibleNodeIds?.size === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("map.drawOrderNoSearchResults")}
              </Typography>
            </Box>
          ) : treeData.length === 0 ? (
            <GroupLayerTreeDropZone
              emptyLabel="Drag a group here to start, then add layers inside groups."
              emptyActionLabel={t("common.addToGroup")}
              onEmptyAction={handleOpenRootAddDialog}
              onCatalogDrop={handleCatalogDropToRoot}
              canAcceptCatalogItem={canAcceptCatalogDropToRoot}
            />
          ) : (
            <GroupLayerTreeDropZone
              onCatalogDrop={handleCatalogDropToRoot}
              canAcceptCatalogItem={canAcceptCatalogDropToRoot}
            >
              <Tree<GroupLayerTreeNode["data"]>
                tree={treeData}
                rootId={GROUP_LAYER_TREE_ROOT_ID}
                extraAcceptTypes={[CATALOG_DRAG_TYPE]}
                initialOpen
                enableAnimateExpand
                sort={false}
                insertDroppableFirst={false}
                dropTargetOffset={12}
                canDrop={(tree, options) =>
                  canDropGroupLayerNode(tree, options)
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
                    flex: 1,
                    minHeight: "100%",
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
                    <GroupLayerTreeNodeView
                      node={node}
                      options={options}
                      treeData={treeData}
                      visibleIds={visibleIds}
                      onToggleLayerVisibility={handleToggleLayerVisibility}
                      onToggleGroupVisibility={handleToggleGroupVisibility}
                      onAddToGroup={handleOpenAddDialog}
                      onRemoveFromTree={handleRemoveFromTree}
                      onEditGroupMetadata={handleOpenEditDialog}
                      onEditLayerSettings={handleOpenLayerEditDialog}
                    />
                  </Box>
                )}
              />
            </GroupLayerTreeDropZone>
          )}
        </LayerSwitcherPreview>

        <GroupLayerAddDialog
          open={addDialogTarget != null}
          onClose={() => setAddDialogTarget(null)}
          onConfirm={handleAddDialogConfirm}
          parentName={addDialogTarget?.parentName ?? ""}
          groups={groups}
          layers={layers}
          placedGroupIds={placedIds.groupIds}
          placedLayerIds={placedIds.layerIds}
          excludeGroupSourceId={addDialogTarget?.excludeGroupSourceId}
          allowLayers={addDialogTarget?.allowLayers ?? true}
        />

        <GroupFormDialog
          open={editDialogTarget != null}
          mode="edit"
          initialValues={treeEditFormInitialValues}
          onClose={() => {
            if (isUpdatingGroup) {
              return;
            }
            setEditDialogTarget(null);
          }}
          onSubmit={handleTreeGroupFormSubmit}
          isSubmitting={isUpdatingGroup}
        />

        <LayerFormDialog
          open={layerEditDialogTarget != null}
          layerName={layerEditDialogTarget?.name ?? ""}
          initialValues={layerEditFormInitialValues}
          onClose={() => setLayerEditDialogTarget(null)}
          onSubmit={handleLayerFormSubmit}
        />
      </Box>
    </DndProvider>
  );
}
