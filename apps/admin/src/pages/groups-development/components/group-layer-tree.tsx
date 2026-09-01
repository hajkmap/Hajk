import {
  Tree,
  MultiBackend,
  getBackendOptions,
  type DropOptions,
} from "@minoru/react-dnd-treeview";
import { Box, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useGroups, useUpdateGroup } from "../../../api/groups";
import { useLayers } from "../../../api/layers";
import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import { getUpdateGroupErrorMessage } from "../../groups/utils/group-errors";
import type {
  CatalogDragItem,
  GroupDisplaySettings,
  GroupFormValues,
  GroupLayerTreeNode,
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
  clientGroupsToLayerSwitcherTree,
  getClientGroupsFromToolOptions,
  hydrateDisplaySettingsFromClientGroups,
  layerSwitcherDraftComparableSignature,
  nodeModelsToClientGroups,
} from "../utils/client-groups";
import BackgroundLayersPanel from "./background-layers-panel";
import DrawOrderPanel from "./draw-order-panel";
import {
  buildDrawOrderIds,
} from "../utils/draw-order";
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
import { findActiveLayerswitcher } from "../utils/active-layerswitcher";
import {
  getDescendantLayerNodeIds,
  normalizeVisibleId,
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
import LayerSwitcherPreview, {
  type LayerSwitcherPreviewTab,
} from "./layer-switcher-preview";
import { createPortal } from "react-dom";

interface AddDialogTarget {
  parentId: GroupLayerTreeNode["parent"];
  parentName: string;
  excludeGroupSourceId?: string;
  allowLayers: boolean;
}

/** Local draft/state shape — avoids circular type resolution issues. */
export interface KartlagerDraft {
  groups: ReturnType<typeof nodeModelsToClientGroups>;
  baselayers: {
    layerId: string;
    visibleAtStart?: boolean;
    zIndex?: number;
    infobox?: string;
  }[];
}

function resolveEffectiveBackgroundOrderedIds(
  backgroundOrderedIds: string[],
  activationBackgroundOrder: string[] | null,
): string[] {
  if (activationBackgroundOrder == null) {
    return backgroundOrderedIds;
  }
  const backgroundIdSet = new Set(activationBackgroundOrder);
  return backgroundOrderedIds.filter((id) => backgroundIdSet.has(id));
}

function buildDrawOrderLayerRows(
  treeData: GroupLayerTreeNode[],
  layerNames: Map<string, string>,
  activeLayerIds: ReadonlySet<string> | null,
  mapBackgroundLayerIds: ReadonlySet<string>,
): { id: string; name: string }[] {
  const placedLayerIds = collectPlacedSourceIds(treeData).layerIds;
  return [...placedLayerIds]
    .filter((id) => {
      if (!layerNames.has(id)) {
        return false;
      }
      if (mapBackgroundLayerIds.has(id)) {
        return false;
      }
      if (activeLayerIds != null && !activeLayerIds.has(id)) {
        return false;
      }
      return true;
    })
    .map((id) => ({
      id,
      name: layerNames.get(id) ?? id,
    }));
}

function resolveEffectiveDrawOrderOrderedIds(
  drawOrderOrderedIds: string[],
  drawOrderLayers: { id: string; name: string }[],
): string[] {
  const eligibleIds = new Set(drawOrderLayers.map((layer) => layer.id));
  const kept = drawOrderOrderedIds.filter((id) => eligibleIds.has(id));
  const keptSet = new Set(kept);
  const added = drawOrderLayers
    .filter((layer) => !keptSet.has(layer.id))
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .map((layer) => layer.id);
  return [...kept, ...added];
}

function applyDrawOrderToLayerDisplaySettings(
  layerDisplaySettings: Record<string, LayerDisplaySettings>,
  orderedIdsTopToBottom: string[],
): Record<string, LayerDisplaySettings> {
  if (orderedIdsTopToBottom.length === 0) {
    return layerDisplaySettings;
  }

  const next: Record<string, LayerDisplaySettings> = {
    ...layerDisplaySettings,
  };
  const total = orderedIdsTopToBottom.length;
  orderedIdsTopToBottom.forEach((layerId, index) => {
    next[layerId] = {
      ...(next[layerId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
      drawOrder: total - index,
    };
  });
  return next;
}

function buildLayerSwitcherEditorSnapshot(input: {
  treeData: GroupLayerTreeNode[];
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  layerDisplaySettings: Record<string, LayerDisplaySettings>;
  backgroundOrderedIds: string[];
  drawOrderOrderedIds: string[];
  activationBackgroundOrder: string[] | null;
  activeLayerIds: ReadonlySet<string> | null;
  mapBackgroundLayerIds: ReadonlySet<string>;
  layerNames: Map<string, string>;
}): { draft: KartlagerDraft; signature: string } {
  const effectiveBackgroundOrderedIds = resolveEffectiveBackgroundOrderedIds(
    input.backgroundOrderedIds,
    input.activationBackgroundOrder,
  );
  const drawOrderLayers = buildDrawOrderLayerRows(
    input.treeData,
    input.layerNames,
    input.activeLayerIds,
    input.mapBackgroundLayerIds,
  );
  const effectiveDrawOrderOrderedIds = resolveEffectiveDrawOrderOrderedIds(
    input.drawOrderOrderedIds,
    drawOrderLayers,
  );
  const settingsForGroups = applyDrawOrderToLayerDisplaySettings(
    input.layerDisplaySettings,
    effectiveDrawOrderOrderedIds,
  );
  const draft: KartlagerDraft = {
    groups: nodeModelsToClientGroups(
      input.treeData,
      input.groupDisplaySettings,
      settingsForGroups,
    ),
    baselayers: effectiveBackgroundOrderedIds.map((layerId, index) => ({
      layerId,
      zIndex: index,
      visibleAtStart:
        input.layerDisplaySettings[layerId]?.layerVisibleAtStart ?? false,
      infobox: input.layerDisplaySettings[layerId]?.layerInfoBox ?? "",
    })),
  };
  const signature = layerSwitcherDraftComparableSignature(
    {
      groups: draft.groups,
      baselayers: draft.baselayers.map(({ layerId, visibleAtStart, infobox }) => ({
        layerId,
        visibleAtStart,
        infobox,
      })),
      baselayerOrder: effectiveBackgroundOrderedIds,
      drawOrderSequence: effectiveDrawOrderOrderedIds,
    },
    input.activeLayerIds,
  );
  return { draft, signature };
}

interface GroupLayerTreeProps {
  /** Map tools for the current map (includes layerswitcher Tool.options). */
  mapTools?: ToolOnMap[];
  /** Catalog tools — used when a layerswitcher is activated but not yet on the map. */
  catalogTools?: Tool[];
  /** Draft/server set of active tool ids — used to pick the active layerswitcher. */
  activeToolIds?: Set<number>;
  /** DB Kartlager + Bakgrund state (catalog layer ids). */
  layerSwitcherState?: KartlagerDraft | null;
  /**
   * Layers activated on the Lager tab. Kartlager list shows active FOREGROUND
   * layers; Bakgrund list shows active BACKGROUND layers.
   */
  layerActivationRows?: {
    layerId: string;
    active: boolean;
    isBackground: boolean;
    /** Search/editing are activated on Lager but never appear in Lagerordning. */
    layerKind?: "display" | "search" | "editing";
  }[];
  /** Unsaved Kartlager/Bakgrund draft held by the map settings page. */
  pendingDraft?: KartlagerDraft | null;
  /** Raised when Kartlager/Bakgrund differs from the loaded DB state. */
  onKartlagerDraftChange?: (draft: KartlagerDraft | null) => void;
  /** Bumped when Lager checkboxes are reverted to the last committed state. */
  layerActivationResetKey?: number;
  /** Lager tab rows have been synced from the server — required for dirty checks. */
  menuSynced?: boolean;
  /** DOM host in FormActionPanel sidebar for the Flyttzon portal. */
  moveZoneHostEl?: HTMLElement | null;
}

export default function GroupLayerTree({
  mapTools,
  catalogTools,
  activeToolIds,
  layerSwitcherState = null,
  layerActivationRows,
  pendingDraft = null,
  onKartlagerDraftChange,
  layerActivationResetKey = 0,
  menuSynced = false,
  moveZoneHostEl = null,
}: GroupLayerTreeProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { mutateAsync: updateGroup, isPending: isUpdatingGroup } =
    useUpdateGroup();
  const [treeData, setTreeData] = useState<GroupLayerTreeNode[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [addDialogTarget, setAddDialogTarget] =
    useState<AddDialogTarget | null>(null);
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
  const [previewTab, setPreviewTab] =
    useState<LayerSwitcherPreviewTab>("layers");
  const [backgroundOrderedIds, setBackgroundOrderedIds] = useState<string[]>(
    [],
  );
  const [drawOrderOrderedIds, setDrawOrderOrderedIds] = useState<string[]>([]);
  const baselineSignatureRef = useRef<string>("");
  const baselineReadyRef = useRef(false);
  const loadedLayerSwitcherKeyRef = useRef<string | null>(null);
  const pendingDraftRef = useRef(pendingDraft);
  const onKartlagerDraftChangeRef = useRef(onKartlagerDraftChange);

  useEffect(() => {
    pendingDraftRef.current = pendingDraft;
  }, [pendingDraft]);

  useEffect(() => {
    onKartlagerDraftChangeRef.current = onKartlagerDraftChange;
  }, [onKartlagerDraftChange]);

  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const { data: layers = [], isLoading: layersLoading } = useLayers();

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

  const activeLayerswitcher = useMemo(
    () => findActiveLayerswitcher(mapTools, activeToolIds, catalogTools),
    [mapTools, activeToolIds, catalogTools],
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

  const activeLayerIds = useMemo(() => {
    if (!layerActivationRows) {
      return null;
    }
    return new Set(
      layerActivationRows
        .filter(
          (row) =>
            row.active && (row.layerKind ?? "display") === "display",
        )
        .map((row) => row.layerId),
    );
  }, [layerActivationRows]);

  const mapBackgroundLayerIds = useMemo(() => {
    if (!layerActivationRows) {
      return new Set<string>();
    }
    return new Set(
      layerActivationRows
        .filter(
          (row) =>
            row.active &&
            row.isBackground &&
            (row.layerKind ?? "display") === "display",
        )
        .map((row) => row.layerId),
    );
  }, [layerActivationRows]);

  const activationBackgroundOrder = useMemo(() => {
    if (!layerActivationRows) {
      return null;
    }
    return layerActivationRows
      .filter(
        (row) =>
          row.active &&
          row.isBackground &&
          (row.layerKind ?? "display") === "display",
      )
      .map((row) => row.layerId);
  }, [layerActivationRows]);

  const effectiveBackgroundOrderedIds = useMemo(
    () =>
      resolveEffectiveBackgroundOrderedIds(
        backgroundOrderedIds,
        activationBackgroundOrder,
      ),
    [activationBackgroundOrder, backgroundOrderedIds],
  );

  const drawOrderLayers = useMemo(
    () =>
      buildDrawOrderLayerRows(
        treeData,
        layerNames,
        activeLayerIds,
        mapBackgroundLayerIds,
      ),
    [activeLayerIds, layerNames, mapBackgroundLayerIds, treeData],
  );

  const drawOrderLayersKey = useMemo(
    () =>
      drawOrderLayers
        .map((layer) => layer.id)
        .sort()
        .join("|"),
    [drawOrderLayers],
  );

  // Preserve user order; append newly eligible layers alphabetically.
  const effectiveDrawOrderOrderedIds = useMemo(() => {
    void drawOrderLayersKey;
    return resolveEffectiveDrawOrderOrderedIds(
      drawOrderOrderedIds,
      drawOrderLayers,
    );
  }, [drawOrderLayers, drawOrderLayersKey, drawOrderOrderedIds]);

  const handleDrawOrderIdsChange = useCallback((ids: string[]) => {
    setDrawOrderOrderedIds(ids);
  }, []);

  const layerSwitcherEditorSnapshot = useMemo(
    () =>
      buildLayerSwitcherEditorSnapshot({
        treeData,
        groupDisplaySettings,
        layerDisplaySettings,
        backgroundOrderedIds,
        drawOrderOrderedIds,
        activationBackgroundOrder,
        activeLayerIds,
        mapBackgroundLayerIds,
        layerNames,
      }),
    [
      treeData,
      groupDisplaySettings,
      layerDisplaySettings,
      backgroundOrderedIds,
      drawOrderOrderedIds,
      activationBackgroundOrder,
      activeLayerIds,
      mapBackgroundLayerIds,
      layerNames,
    ],
  );

  useLayoutEffect(() => {
    if (!activeLayerswitcher || !menuSynced || !baselineReadyRef.current) {
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    if (
      layerSwitcherEditorSnapshot.signature === baselineSignatureRef.current
    ) {
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    onKartlagerDraftChangeRef.current?.(layerSwitcherEditorSnapshot.draft);
  }, [
    activeLayerswitcher,
    layerSwitcherEditorSnapshot,
    menuSynced,
  ]);

  const prevActiveDisplayLayerIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (activeLayerIds == null || loadedLayerSwitcherKeyRef.current == null) {
      prevActiveDisplayLayerIdsRef.current = activeLayerIds;
      return;
    }

    const previous = prevActiveDisplayLayerIdsRef.current;
    prevActiveDisplayLayerIdsRef.current = activeLayerIds;

    if (previous == null) {
      return;
    }

    const deactivated = [...previous].filter((id) => !activeLayerIds.has(id));
    if (deactivated.length === 0) {
      return;
    }

    const deactivatedSet = new Set(deactivated);

    setTreeData((current) => {
      const next = current.filter((node) => {
        if (node.data?.kind !== "layer") {
          return true;
        }
        return !deactivatedSet.has(node.data.sourceId);
      });
      return next.length === current.length ? current : next;
    });
  }, [activeLayerIds]);

  useEffect(() => {
    prevActiveDisplayLayerIdsRef.current = null;
  }, [layerActivationResetKey]);

  const activeForegroundLayerIds = useMemo(() => {
    if (activeLayerIds == null) {
      return null;
    }
    return new Set(
      [...activeLayerIds].filter((id) => !mapBackgroundLayerIds.has(id)),
    );
  }, [activeLayerIds, mapBackgroundLayerIds]);

  const backgroundMode = previewTab === "background";
  const drawOrderMode = previewTab === "drawOrder";

  const serverGroupsFromState = useMemo(
    () => layerSwitcherState?.groups ?? [],
    [layerSwitcherState?.groups],
  );
  const serverBaselayersFromState = useMemo(
    () => layerSwitcherState?.baselayers ?? [],
    [layerSwitcherState?.baselayers],
  );

  const serverGroupsJson = useMemo(
    () => JSON.stringify(serverGroupsFromState),
    [serverGroupsFromState],
  );

  const serverBaselayersJson = useMemo(
    () =>
      JSON.stringify(serverBaselayersFromState.map((entry) => entry.layerId)),
    [serverBaselayersFromState],
  );

  // Load Kartlager tree + Bakgrund from DB layerswitcher state (not Tool.options).
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate local editor state from server/draft */
  useEffect(() => {
    if (!activeLayerswitcher) {
      loadedLayerSwitcherKeyRef.current = null;
      baselineSignatureRef.current = "";
      baselineReadyRef.current = false;
      setTreeData([]);
      setVisibleIds(new Set());
      setGroupDisplaySettings({});
      setLayerDisplaySettings({});
      setBackgroundOrderedIds([]);
      setDrawOrderOrderedIds([]);
      setMoveZoneItems([]);
      onKartlagerDraftChangeRef.current?.(null);
      return;
    }

    const activeLayerIdsKey = activeLayerIds
      ? [...activeLayerIds].sort().join("|")
      : "";
    const loadKey = `${serverGroupsJson}|${serverBaselayersJson}|${layerActivationResetKey}|${activeLayerIdsKey}`;

    if (loadKey === loadedLayerSwitcherKeyRef.current) {
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

    baselineReadyRef.current = false;

    const serverGroupsFromDb = serverGroupsFromState;
    // Short dual-read fallback while a map still only has Tool.options.groups.
    const serverGroups =
      serverGroupsFromDb.length > 0
        ? serverGroupsFromDb
        : getClientGroupsFromToolOptions(activeLayerswitcherOptions);
    const toolBaselayers: {
      layerId: string;
      visibleAtStart: boolean;
      infobox: string;
    }[] = [];
    if (
      activeLayerswitcherOptions &&
      Array.isArray(activeLayerswitcherOptions.baselayers)
    ) {
      for (const entry of activeLayerswitcherOptions.baselayers) {
        if (typeof entry === "string" || typeof entry === "number") {
          toolBaselayers.push({
            layerId: String(entry),
            visibleAtStart: false,
            infobox: "",
          });
          continue;
        }
        if (
          entry &&
          typeof entry === "object" &&
          "id" in entry &&
          (entry as { id?: unknown }).id != null
        ) {
          const record = entry as {
            id: unknown;
            visibleAtStart?: unknown;
            infobox?: unknown;
          };
          toolBaselayers.push({
            layerId: String(record.id),
            visibleAtStart: record.visibleAtStart === true,
            infobox: typeof record.infobox === "string" ? record.infobox : "",
          });
        }
      }
    }

    const serverBaselayers: {
      layerId: string;
      visibleAtStart?: boolean;
      infobox?: string;
    }[] =
      serverBaselayersFromState.length > 0
        ? serverBaselayersFromState.map((entry) => ({
            layerId: entry.layerId,
            visibleAtStart: entry.visibleAtStart,
            infobox:
              "infobox" in entry && typeof entry.infobox === "string"
                ? entry.infobox
                : "",
          }))
        : toolBaselayers;

    const pending = pendingDraftRef.current;
    const restoringDraft = pending != null;
    const groupsToLoad = restoringDraft
      ? pending.groups
      : serverGroups;
    const baselayersToLoad = restoringDraft
      ? pending.baselayers
      : serverBaselayers;

    const intermediate = clientGroupsToLayerSwitcherTree(groupsToLoad);
    const nodes = applySiblingOrderFromFlatTree(
      layerSwitcherTreeToNodeModels(
        intermediate,
        GROUP_LAYER_TREE_ROOT_ID,
        groupNames,
        layerNames,
      ),
    );
    const hydrated = hydrateDisplaySettingsFromClientGroups(groupsToLoad);
    const baselayerSettings: Record<string, LayerDisplaySettings> = {};
    for (const entry of baselayersToLoad) {
      baselayerSettings[entry.layerId] = {
        layerVisibleAtStart: entry.visibleAtStart ?? false,
        layerInfoBox:
          "infobox" in entry && typeof entry.infobox === "string"
            ? entry.infobox
            : "",
      };
    }

    const loadedLayerSettings = {
      ...hydrated.layerDisplaySettings,
      ...baselayerSettings,
    };
    const loadedBackgroundOrder = baselayersToLoad.map((entry) => entry.layerId);
    const drawOrderLayerRows = buildDrawOrderLayerRows(
      nodes,
      layerNames,
      activeLayerIds,
      mapBackgroundLayerIds,
    );
    const drawOrderById: Record<string, number | undefined> = {};
    for (const layer of drawOrderLayerRows) {
      drawOrderById[layer.id] =
        hydrated.layerDisplaySettings[layer.id]?.drawOrder;
    }
    const loadedDrawOrderIds = buildDrawOrderIds(
      drawOrderLayerRows,
      drawOrderById,
    );

    const baselineSnapshot = buildLayerSwitcherEditorSnapshot({
      treeData: nodes,
      groupDisplaySettings: hydrated.groupDisplaySettings,
      layerDisplaySettings: loadedLayerSettings,
      backgroundOrderedIds: loadedBackgroundOrder,
      drawOrderOrderedIds: loadedDrawOrderIds,
      activationBackgroundOrder,
      activeLayerIds,
      mapBackgroundLayerIds,
      layerNames,
    });
    baselineSignatureRef.current = baselineSnapshot.signature;
    baselineReadyRef.current = true;

    loadedLayerSwitcherKeyRef.current = loadKey;
    setTreeData(nodes);
    setVisibleIds(hydrated.visibleIds);
    setGroupDisplaySettings(hydrated.groupDisplaySettings);
    setLayerDisplaySettings(loadedLayerSettings);
    setBackgroundOrderedIds(loadedBackgroundOrder);
    setDrawOrderOrderedIds(loadedDrawOrderIds);
    setMoveZoneItems([]);
  }, [
    activeLayerswitcher,
    activeLayerswitcherOptions,
    activationBackgroundOrder,
    activeLayerIds,
    groupNames,
    layerNames,
    mapBackgroundLayerIds,
    serverBaselayersFromState,
    serverBaselayersJson,
    serverGroupsFromState,
    serverGroupsJson,
    layerActivationResetKey,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const placedIds = useMemo(() => {
    const fromTree = collectPlacedSourceIds(treeData);
    const groupIds = new Set(fromTree.groupIds);
    const layerIds = new Set(fromTree.layerIds);

    for (const layerId of effectiveBackgroundOrderedIds) {
      layerIds.add(layerId);
    }

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
  }, [effectiveBackgroundOrderedIds, treeData, moveZoneItems]);
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
        const next = insertCatalogItemIntoTree(
          current,
          catalogItem,
          dropOptions,
        );

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

  const handleMoveZoneDropToRoot = useCallback((moveItem: MoveZoneItem) => {
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
  }, []);

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
        if (backgroundMode) {
          return;
        }
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
    [addCatalogItem, backgroundMode],
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
      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node || node.data?.kind !== "layer") {
        return;
      }

      const sourceId = node.data.sourceId;
      const nextVisible = !visibleIds.has(String(nodeId));

      setVisibleIds((current) => toggleLayerVisibility(current, nodeId));
      setLayerDisplaySettings((current) => ({
        ...current,
        [sourceId]: {
          ...(current[sourceId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
          layerVisibleAtStart: nextVisible,
        },
      }));
    },
    [treeData, visibleIds],
  );

  const handleToggleGroupVisibility = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const groupKey = normalizeVisibleId(nodeId);
      const nextVisible = !visibleIds.has(groupKey);
      const descendantLayerNodeIds = getDescendantLayerNodeIds(treeData, nodeId);

      setVisibleIds((current) =>
        toggleGroupVisibility(treeData, current, nodeId),
      );
      setLayerDisplaySettings((current) => {
        const next = { ...current };
        for (const layerNodeId of descendantLayerNodeIds) {
          const layerNode = treeData.find((entry) => entry.id === layerNodeId);
          if (layerNode?.data?.kind !== "layer") {
            continue;
          }
          next[layerNode.data.sourceId] = {
            ...(next[layerNode.data.sourceId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
            layerVisibleAtStart: nextVisible,
          };
        }
        return next;
      });
    },
    [treeData, visibleIds],
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

  const layerEditFormInitialValues = useMemo(():
    | LayerFormValues
    | undefined => {
    if (!layerEditDialogTarget) {
      return undefined;
    }

    return (
      layerDisplaySettings[layerEditDialogTarget.sourceId] ??
      DEFAULT_LAYER_DISPLAY_SETTINGS
    );
  }, [layerEditDialogTarget, layerDisplaySettings]);

  const isLoading = groupsLoading || layersLoading;
  const previewOptions = useMemo(
    () => ({
      showFilter: Boolean(activeLayerswitcherOptions?.showFilter),
      showQuickAccess: Boolean(activeLayerswitcherOptions?.showQuickAccess),
      showDrawOrderView: Boolean(activeLayerswitcherOptions?.showDrawOrderView),
      enableQuickAccessPresets: Boolean(
        activeLayerswitcherOptions?.enableQuickAccessPresets,
      ),
      enableUserQuickAccessFavorites: Boolean(
        activeLayerswitcherOptions?.enableUserQuickAccessFavorites,
      ),
    }),
    [activeLayerswitcherOptions],
  );

  const handleDropTreeItemToRoot = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      setTreeData((current) => {
        const node = current.find((entry) => entry.id === nodeId);
        if (!node || node.data?.kind !== "group") {
          return current;
        }

        const remaining = current.filter((entry) => entry.id !== nodeId);
        return applySiblingOrderFromFlatTree([
          ...remaining,
          { ...node, parent: GROUP_LAYER_TREE_ROOT_ID },
        ]);
      });
    },
    [],
  );

  if (!activeLayerswitcher) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("groupsDevelopment.noActiveLayerswitcher")}
        </Typography>
      </Box>
    );
  }

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
          activeLayerIds={activeLayerIds}
          backgroundLayerIds={mapBackgroundLayerIds}
          backgroundMode={backgroundMode}
          drawOrderMode={drawOrderMode}
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

        <LayerSwitcherPreview
          search={search}
          onSearchChange={setSearch}
          activeTab={previewTab}
          onActiveTabChange={setPreviewTab}
          showFilter={previewOptions.showFilter}
          showQuickAccess={previewOptions.showQuickAccess}
          showDrawOrderView={previewOptions.showDrawOrderView}
          enableQuickAccessPresets={previewOptions.enableQuickAccessPresets}
          enableUserQuickAccessFavorites={
            previewOptions.enableUserQuickAccessFavorites
          }
        >
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("common.loading")}
              </Typography>
            </Box>
          ) : drawOrderMode ? (
            <DrawOrderPanel
              layers={drawOrderLayers}
              orderedIds={effectiveDrawOrderOrderedIds}
              onOrderedIdsChange={handleDrawOrderIdsChange}
              search={search}
            />
          ) : backgroundMode ? (
            <BackgroundLayersPanel
              layers={layers
                .filter((layer) => (layer.layerKind ?? "display") === "display")
                .map((layer) => ({ id: layer.id, name: layer.name }))}
              orderedIds={effectiveBackgroundOrderedIds}
              onOrderedIdsChange={setBackgroundOrderedIds}
              layerDisplaySettings={layerDisplaySettings}
              onLayerDisplaySettingsChange={(layerId, settings) => {
                setLayerDisplaySettings((current) => ({
                  ...current,
                  [layerId]: settings,
                }));
              }}
              search={search}
            />
          ) : visibleNodeIds?.size === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("map.drawOrderNoSearchResults")}
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
              onTreeDropToRoot={handleDropTreeItemToRoot}
            />
          ) : (
            <GroupLayerTreeDropZone
              onCatalogDrop={handleCatalogDropToRoot}
              canAcceptCatalogItem={canAcceptCatalogDropToRoot}
              onMoveZoneDrop={handleMoveZoneDropToRoot}
              canAcceptMoveZoneItem={canAcceptMoveZoneDropToRoot}
              onTreeDropToRoot={handleDropTreeItemToRoot}
            >
              <Box sx={{ pb: "8px" }}>
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
              </Box>
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
          backgroundLayerIds={mapBackgroundLayerIds}
          activeForegroundLayerIds={activeForegroundLayerIds}
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
          onSubmit={(values) => {
            void handleTreeGroupFormSubmit(values);
          }}
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
