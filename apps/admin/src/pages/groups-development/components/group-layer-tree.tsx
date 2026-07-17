import {
  Tree,
  MultiBackend,
  getBackendOptions,
  type DropOptions,
} from "@minoru/react-dnd-treeview";
import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useGroups, useUpdateGroup } from "../../../api/groups";
import { useLayers } from "../../../api/layers";
import type { ToolOnMap } from "../../../api/maps";
import {
  getUpdateGroupErrorMessage,
} from "../../groups/utils/group-errors";
import type {
  CatalogDragItem,
  GroupDisplaySettings,
  GroupFormValues,
  GroupLayerTreeNode,
  KartlagerDraft,
  LayerDisplaySettings,
  LayerFormValues,
  MoveZoneItem,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  GROUP_LAYER_TREE_ROOT_ID,
  MOVE_ZONE_DRAG_TYPE,
} from "../types";
import { toDisplaySettings, toFormValues } from "../utils/group-form";
import {
  buildLayerswitcherOptionsWithGroups,
  clientGroupsToLayerSwitcherTree,
  getClientGroupsFromToolOptions,
  hydrateDisplaySettingsFromClientGroups,
  nodeModelsToClientGroups,
  serializeClientGroupsJson,
} from "../utils/client-groups";
import {
  applyDropOnLayerRedirect,
  applySiblingOrderFromFlatTree,
  canDropGroupLayerNode,
  collectPlacedSourceIds,
  createTreeNodeFromCatalogItem,
  extractSubtreeForMoveZone,
  getNextSiblingOrder,
  insertCatalogItemIntoTree,
  insertMoveZoneSubtreeIntoTree,
  isValidLayerParentId,
  layerSwitcherTreeToNodeModels,
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
import KartlagerMoveZone from "./kartlager-move-zone";
import LayerSwitcherPreview from "./layer-switcher-preview";
import { createPortal } from "react-dom";

interface AddDialogTarget {
  parentId: GroupLayerTreeNode["parent"];
  parentName: string;
  excludeGroupSourceId?: string;
  allowLayers: boolean;
}

export type { KartlagerDraft };

interface GroupLayerTreeProps {
  /** Map tools for the current map (includes layerswitcher Tool.options). */
  mapTools?: ToolOnMap[];
  /** Draft/server set of active tool ids — used to pick the active layerswitcher. */
  activeToolIds?: Set<number>;
  /** Unsaved Kartlager options held by the map settings page (survives tab unmount). */
  pendingDraft?: KartlagerDraft | null;
  /** Raised when Kartlager differs from the loaded layerswitcher options.groups. */
  onKartlagerDraftChange?: (draft: KartlagerDraft | null) => void;
  /** DOM host in FormActionPanel sidebar for the Flyttzon portal. */
  moveZoneHostEl?: HTMLElement | null;
}

function findActiveLayerswitcher(
  mapTools: ToolOnMap[] | undefined,
  activeToolIds: Set<number> | undefined,
): ToolOnMap | null {
  const layerswitchers = (mapTools ?? []).filter(
    (entry) => entry.tool.type === "layerswitcher",
  );

  if (layerswitchers.length === 0) {
    return null;
  }

  if (activeToolIds && activeToolIds.size > 0) {
    const fromDraft = layerswitchers.find((entry) =>
      activeToolIds.has(entry.toolId),
    );
    if (fromDraft) {
      return fromDraft;
    }
  }

  return (
    layerswitchers.find((entry) => entry.active !== false) ??
    layerswitchers[0] ??
    null
  );
}

export default function GroupLayerTree({
  mapTools,
  activeToolIds,
  pendingDraft = null,
  onKartlagerDraftChange,
  moveZoneHostEl = null,
}: GroupLayerTreeProps) {
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
  const [moveZoneItems, setMoveZoneItems] = useState<MoveZoneItem[]>([]);
  const baselineGroupsJsonRef = useRef<string>("");
  const loadedLayerswitcherKeyRef = useRef<string | null>(null);
  const pendingDraftRef = useRef(pendingDraft);
  pendingDraftRef.current = pendingDraft;
  const onKartlagerDraftChangeRef = useRef(onKartlagerDraftChange);
  onKartlagerDraftChangeRef.current = onKartlagerDraftChange;

  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: layers = [], isLoading: layersLoading } = useLayers();

  const activeLayerswitcher = useMemo(
    () => findActiveLayerswitcher(mapTools, activeToolIds),
    [mapTools, activeToolIds],
  );

  const activeLayerswitcherOptions = useMemo(() => {
    if (!activeLayerswitcher) {
      return null;
    }

    return {
      ...(activeLayerswitcher.tool.options ?? {}),
      ...(activeLayerswitcher.options ?? {}),
    };
  }, [activeLayerswitcher]);

  const activeLayerswitcherGroupsJson = useMemo(
    () =>
      JSON.stringify(
        getClientGroupsFromToolOptions(activeLayerswitcherOptions),
      ),
    [activeLayerswitcherOptions],
  );

  const layerNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const layer of layers) {
      map.set(layer.id, layer.name);
    }
    return map;
  }, [layers]);

  const groupNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups) {
      map.set(group.id, group.name);
    }
    return map;
  }, [groups]);

  // Load Kartlager tree from the active layerswitcher Tool.options.groups
  useEffect(() => {
    if (!activeLayerswitcher || !activeLayerswitcherOptions) {
      loadedLayerswitcherKeyRef.current = null;
      baselineGroupsJsonRef.current = "";
      setTreeData([]);
      setVisibleIds(new Set());
      setGroupDisplaySettings({});
      setLayerDisplaySettings({});
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    const loadKey = `${activeLayerswitcher.toolId}:${activeLayerswitcherGroupsJson}`;

    // Same tool options: only refresh layer labels from the catalog, keep local edits.
    // Group names stay as stored in options.groups (Kartlager source of truth).
    if (loadKey === loadedLayerswitcherKeyRef.current) {
      setTreeData((current) => {
        let changed = false;
        const next = current.map((node) => {
          if (node.data?.kind !== "layer") {
            return node;
          }
          const catalogName = layerNames.get(node.data.sourceId);
          if (catalogName && catalogName !== node.text) {
            changed = true;
            return { ...node, text: catalogName };
          }
          return node;
        });
        return changed ? next : current;
      });
      return;
    }

    const serverGroups = getClientGroupsFromToolOptions(
      activeLayerswitcherOptions,
    );
    const serverIntermediate = clientGroupsToLayerSwitcherTree(serverGroups);
    const serverNodes = applySiblingOrderFromFlatTree(
      layerSwitcherTreeToNodeModels(
        serverIntermediate,
        GROUP_LAYER_TREE_ROOT_ID,
        groupNames,
        layerNames,
      ),
    );
    const serverHydrated =
      hydrateDisplaySettingsFromClientGroups(serverGroups);

    // Compare dirty state against the same serializer used on save.
    baselineGroupsJsonRef.current = serializeClientGroupsJson(
      serverNodes,
      serverHydrated.groupDisplaySettings,
      serverHydrated.layerDisplaySettings,
    );

    const pending = pendingDraftRef.current;
    const restoringDraft =
      pending != null && pending.toolId === activeLayerswitcher.toolId;
    const optionsToLoad = restoringDraft
      ? pending.options
      : activeLayerswitcherOptions;

    const clientGroups = getClientGroupsFromToolOptions(optionsToLoad);
    const intermediate = clientGroupsToLayerSwitcherTree(clientGroups);
    const nodes = applySiblingOrderFromFlatTree(
      layerSwitcherTreeToNodeModels(
        intermediate,
        GROUP_LAYER_TREE_ROOT_ID,
        groupNames,
        layerNames,
      ),
    );
    const hydrated = hydrateDisplaySettingsFromClientGroups(clientGroups);

    loadedLayerswitcherKeyRef.current = loadKey;
    setTreeData(nodes);
    setVisibleIds(hydrated.visibleIds);
    setGroupDisplaySettings(hydrated.groupDisplaySettings);
    setLayerDisplaySettings(hydrated.layerDisplaySettings);
  }, [
    activeLayerswitcher,
    activeLayerswitcherOptions,
    activeLayerswitcherGroupsJson,
    groupNames,
    layerNames,
  ]);

  // Notify parent when Kartlager edits differ from the loaded Tool.options.groups
  useEffect(() => {
    if (!activeLayerswitcher || !activeLayerswitcherOptions) {
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    const groupsPayload = nodeModelsToClientGroups(
      treeData,
      groupDisplaySettings,
      layerDisplaySettings,
    );
    const groupsJson = serializeClientGroupsJson(
      treeData,
      groupDisplaySettings,
      layerDisplaySettings,
    );

    if (groupsJson === baselineGroupsJsonRef.current) {
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    onKartlagerDraftChangeRef.current?.({
      toolId: activeLayerswitcher.toolId,
      options: buildLayerswitcherOptionsWithGroups(
        activeLayerswitcherOptions,
        groupsPayload,
      ),
    });
  }, [
    treeData,
    groupDisplaySettings,
    layerDisplaySettings,
    activeLayerswitcher,
    activeLayerswitcherOptions,
  ]);

  const placedIds = useMemo(() => {
    const fromTree = collectPlacedSourceIds(treeData);
    const groupIds = new Set(fromTree.groupIds);
    const layerIds = new Set(fromTree.layerIds);

    for (const item of moveZoneItems) {
      for (const node of item.nodes) {
        if (node.data?.kind === "group") {
          groupIds.add(node.data.sourceId);
        } else if (node.data?.kind === "layer") {
          layerIds.add(node.data.sourceId);
        }
      }
    }

    return { groupIds, layerIds };
  }, [treeData, moveZoneItems]);
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

  const handleMoveZoneDropToRoot = useCallback(
    (moveItem: MoveZoneItem) => {
      if (moveItem.kind === "layer") {
        return;
      }

      setTreeData((current) => {
        const next = insertMoveZoneSubtreeIntoTree(current, moveItem.nodes, {
          dropTargetId: GROUP_LAYER_TREE_ROOT_ID,
        });
        return next ?? current;
      });
      setMoveZoneItems((current) =>
        current.filter((entry) => entry.key !== moveItem.key),
      );
    },
    [],
  );

  const canAcceptMoveZoneDropToRoot = useCallback(
    (item: MoveZoneItem) => item.kind === "group",
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

      if (itemType === MOVE_ZONE_DRAG_TYPE) {
        const moveItem = options.monitor.getItem() as MoveZoneItem;
        setTreeData((current) => {
          const next = insertMoveZoneSubtreeIntoTree(current, moveItem.nodes, {
            dropTargetId: options.dropTargetId,
            dropTarget: options.dropTarget,
            relativeIndex: options.relativeIndex,
          });
          return next ?? current;
        });
        setMoveZoneItems((current) =>
          current.filter((entry) => entry.key !== moveItem.key),
        );
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

  const handleDropToMoveZone = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const extracted = extractSubtreeForMoveZone(treeData, nodeId);
      if (!extracted) {
        return;
      }

      const root = extracted.subtree.find(
        (node) => node.parent === GROUP_LAYER_TREE_ROOT_ID,
      );
      if (!root?.data) {
        return;
      }

      const moveItem: MoveZoneItem = {
        key: `${root.data.kind}:${root.data.sourceId}:${Date.now()}`,
        kind: root.data.kind,
        sourceId: root.data.sourceId,
        name: root.text,
        nodes: extracted.subtree,
      };

      setTreeData(extracted.remainingTree);
      setMoveZoneItems((items) => [...items, moveItem]);
      setVisibleIds((visible) => {
        const next = new Set(visible);
        for (const node of extracted.subtree) {
          next.delete(String(node.id));
        }
        return next;
      });
    },
    [treeData],
  );

  const canAcceptCatalogDropToMoveZone = useCallback(
    (item: CatalogDragItem) => {
      if (item.kind === "group") {
        return !placedIds.groupIds.has(item.id);
      }
      return !placedIds.layerIds.has(item.id);
    },
    [placedIds],
  );

  const handleDropCatalogToMoveZone = useCallback(
    (catalogItem: CatalogDragItem) => {
      if (!canAcceptCatalogDropToMoveZone(catalogItem)) {
        return;
      }

      const node = createTreeNodeFromCatalogItem(
        catalogItem,
        GROUP_LAYER_TREE_ROOT_ID,
        0,
      );

      const moveItem: MoveZoneItem = {
        key: `${catalogItem.kind}:${catalogItem.id}:${Date.now()}`,
        kind: catalogItem.kind,
        sourceId: catalogItem.id,
        name: catalogItem.name,
        nodes: [node],
      };

      setMoveZoneItems((items) => [...items, moveItem]);
    },
    [canAcceptCatalogDropToMoveZone],
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

      const { sourceId, nodeId } = layerEditDialogTarget;

      setLayerDisplaySettings((current) => ({
        ...current,
        [sourceId]: {
          ...(current[sourceId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
          layerVisibleAtStart: values.layerVisibleAtStart,
          layerInfoBox: values.layerInfoBox,
        },
      }));

      setVisibleIds((current) => {
        const next = new Set(current);
        const key = String(nodeId);
        if (values.layerVisibleAtStart) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });

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
          ) : !activeLayerswitcher ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("groupsDevelopment.noActiveLayerswitcher")}
              </Typography>
            </Box>
          ) : treeData.length === 0 ? (
            <GroupLayerTreeDropZone
              emptyLabel={t("groupsDevelopment.emptyKartlager")}
              emptyActionLabel={t("common.addToGroup")}
              onEmptyAction={handleOpenRootAddDialog}
              onCatalogDrop={handleCatalogDropToRoot}
              canAcceptCatalogItem={canAcceptCatalogDropToRoot}
              onMoveZoneDrop={handleMoveZoneDropToRoot}
              canAcceptMoveZoneItem={canAcceptMoveZoneDropToRoot}
            />
          ) : (
            <GroupLayerTreeDropZone
              onCatalogDrop={handleCatalogDropToRoot}
              canAcceptCatalogItem={canAcceptCatalogDropToRoot}
              onMoveZoneDrop={handleMoveZoneDropToRoot}
              canAcceptMoveZoneItem={canAcceptMoveZoneDropToRoot}
            >
              <Tree<GroupLayerTreeNode["data"]>
                tree={treeData}
                rootId={GROUP_LAYER_TREE_ROOT_ID}
                extraAcceptTypes={[CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE]}
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
                      groupDisplaySettings={groupDisplaySettings}
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

      {moveZoneHostEl
        ? createPortal(
            <KartlagerMoveZone
              items={moveZoneItems}
              onDropFromTree={handleDropToMoveZone}
              onDropFromCatalog={handleDropCatalogToMoveZone}
              canAcceptCatalogItem={canAcceptCatalogDropToMoveZone}
            />,
            moveZoneHostEl,
          )
        : null}
    </DndProvider>
  );
}
