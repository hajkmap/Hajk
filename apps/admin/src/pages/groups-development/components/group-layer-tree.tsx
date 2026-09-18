import { Box, Button, Typography, useTheme } from "@mui/material";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

import { useGroups, useUpdateGroup } from "../../../api/groups";
import { useLayers } from "../../../api/layers";
import { getUpdateGroupErrorMessage } from "../../groups/utils/group-errors";
import {
  getCatalogToolDisplayName,
  getToolDisplayName,
} from "../../maps/map-tools-utils";
import type {
  CatalogDragItem,
  GroupDisplaySettings,
  GroupFormValues,
  GroupLayerTreeNode,
  LayerDisplaySettings,
  LayerFormValues,
  MapLayersClickPick,
  MapLayersInteractionMode,
  MoveZoneItem,
} from "../types";
import {
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  GROUP_LAYER_TREE_ROOT_ID,
} from "../types";
import { toDisplaySettings, toFormValues } from "../utils/group-form";
import {
  clientGroupsToLayerSwitcherTree,
  getClientBaselayersFromToolOptions,
  getClientGroupsFromToolOptions,
  hydrateDisplaySettingsFromClientGroups,
  pruneLayerSwitcherDraftToActiveLayers,
} from "../utils/client-groups";
import {
  createEmptyMoveZoneByTab,
  loadMoveZoneByTabFromStorage,
  pruneMoveZoneByTabAgainstPlaced,
  saveMoveZoneByTabToStorage,
  type MoveZoneByTab,
} from "../utils/move-zone-storage";
import BackgroundLayersPanel from "./background-layers-panel";
import DrawOrderPanel from "./draw-order-panel";
import { buildDrawOrderIds } from "../utils/draw-order";
import {
  applyMapLayersSiblingOrder,
  collectPlacedSourceIds,
  layerSwitcherTreeToNodeModels,
  removeTreeNodeWithDescendants,
} from "../utils/tree-model";
import { filterTreeBySearch } from "../utils/tree-filter";
import { findActiveLayerswitcher } from "../utils/active-layerswitcher";
import {
  getDescendantLayerNodeIds,
  isParentGroupExclusive,
  toggleGroupVisibility,
  toggleLayerVisibility,
} from "../utils/tree-visibility";
import {
  buildDrawOrderLayerRows,
  buildLayerSwitcherEditorSnapshot,
  isLayerStillInMapLayersTree,
  resolveEffectiveBackgroundOrderedIds,
  resolveEffectiveDrawOrderOrderedIds,
} from "../utils/maplayers-editor";
import { useMapLayersClickPlace } from "../hooks/use-maplayers-click-place";
import { useMapLayersMoveZone } from "../hooks/use-maplayers-move-zone";
import { useMapLayersTreeDnd } from "../hooks/use-maplayers-tree-dnd";
import type {
  AddDialogTarget,
  GroupLayerTreeProps,
} from "./group-layer-tree-types";
import GroupLayerAddDialog from "./group-layer-add-dialog";
import GroupLayerCatalog from "./group-layer-catalog";
import GroupFormDialog from "./group-form-dialog";
import LayerFormDialog from "./layer-form-dialog";
import GroupLayerTreeDropZone from "./group-layer-tree-drop-zone";
import MapLayersMoveZone from "./maplayers-move-zone";
import MapLayersTreeView, { MapLayersDndProvider } from "./maplayers-tree-view";
import LayerSwitcherPreview, {
  type LayerSwitcherPreviewTab,
} from "./layer-switcher-preview";

export type { LayerSwitcherDraft } from "../types";

/** Local handle for expand/collapse-all (avoids poisoned import typing). */
interface MapLayersTreeExpandHandle {
  expandAll: () => void;
  collapseAll: () => void;
}

/** Local rebind for click-place hook output (see useMapLayersClickPlace call). */
interface MapLayersClickPlaceBindings {
  clickPick: MapLayersClickPick | null;
  setClickPick: Dispatch<SetStateAction<MapLayersClickPick | null>>;
  clickMode: boolean;
  handleInteractionModeChange: (mode: MapLayersInteractionMode) => void;
  clearClickPickAndResetToDrag: () => void;
  handleCatalogClickPick: (item: CatalogDragItem, additive: boolean) => void;
  handleTreeClickInteract: (
    nodeId: GroupLayerTreeNode["id"],
    additive: boolean,
  ) => void;
  handleClickPlaceToRoot: () => void;
  handleClickPlaceToRootStart: () => void;
  handleClickPlaceRootEdgeHover: (
    edge: "start" | "end" | null,
  ) => void;
  handleClickPlaceRootEndHover: (hovering: boolean) => void;
  handleClickPlaceToMoveZone: () => void;
  handleMoveZoneClickPick: (item: MoveZoneItem, additive: boolean) => void;
  clickPickCount: number;
  clickPickLabel: string | null;
  canClickPlaceToRoot: boolean;
  clickPickEdgeById: Map<string, "only" | "start" | "middle" | "end"> | null;
  hoveredSubtreeIds: Set<string> | null;
  handleMapLayersNodeHover: (nodeId: GroupLayerTreeNode["id"]) => void;
  handleMapLayersTreeMouseLeave: () => void;
  clickPlaceIndicator: {
    nodeId: string;
    lineDepth: number;
    position: "before" | "after";
  } | null;
}

export default function GroupLayerTree({
  mapTools,
  catalogTools,
  activeToolIds,
  mapName,
  layerActivationRows,
  pendingDraft = null,
  onLayerSwitcherDraftChange,
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
  /** Visual-only radio selection under exclusive parents (not part of dirty/save). */
  const [exclusiveRadioPreviewByParent, setExclusiveRadioPreviewByParent] =
    useState<Record<string, string>>({});
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
  const [moveZoneByTab, setMoveZoneByTab] = useState<MoveZoneByTab>(() =>
    createEmptyMoveZoneByTab(),
  );
  const [previewTab, setPreviewTab] =
    useState<LayerSwitcherPreviewTab>("layers");
  /** null = Tree has not reported opens yet (treat as all open with initialOpen). */
  const [openNodeIds, setOpenNodeIds] = useState<Set<string> | null>(null);
  const [backgroundOrderedIds, setBackgroundOrderedIds] = useState<string[]>(
    [],
  );
  const [drawOrderOrderedIds, setDrawOrderOrderedIds] = useState<string[]>([]);
  const baselineSignatureRef = useRef<string>("");
  const baselineReadyRef = useRef(false);
  const loadedLayerSwitcherKeyRef = useRef<string | null>(null);
  const loadedLayerswitcherToolIdRef = useRef<number | null>(null);
  const pendingDraftRef = useRef(pendingDraft);
  const onLayerSwitcherDraftChangeRef = useRef(onLayerSwitcherDraftChange);
  const mapLayersTreeRef = useRef<MapLayersTreeExpandHandle | null>(null);
  const moveZoneStorageKeyRef = useRef<string | null>(null);

  const moveZoneItems = moveZoneByTab[previewTab];
  const setMoveZoneItems = useCallback(
    (updater: SetStateAction<MoveZoneItem[]>) => {
      setMoveZoneByTab((current) => {
        const previous = current[previewTab];
        const next =
          typeof updater === "function" ? updater(previous) : updater;
        if (next === previous) {
          return current;
        }
        return { ...current, [previewTab]: next };
      });
    },
    [previewTab],
  );

  useEffect(() => {
    pendingDraftRef.current = pendingDraft;
  }, [pendingDraft]);

  useEffect(() => {
    onLayerSwitcherDraftChangeRef.current = onLayerSwitcherDraftChange;
  }, [onLayerSwitcherDraftChange]);

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

  const activeLayerswitcherName = useMemo(() => {
    if (!activeLayerswitcher) {
      return "";
    }

    const optionsTitle = activeLayerswitcherOptions?.title;
    if (typeof optionsTitle === "string" && optionsTitle.trim()) {
      return optionsTitle.trim();
    }

    const catalogTool = catalogTools?.find(
      (tool) => Number(tool.id) === activeLayerswitcher.toolId,
    );
    if (catalogTool) {
      return getCatalogToolDisplayName(catalogTool);
    }

    return getToolDisplayName(activeLayerswitcher);
  }, [activeLayerswitcher, activeLayerswitcherOptions, catalogTools]);

  // Persist Flyttzon per map + active LayerSwitcher (survives tab switches).
  useEffect(() => {
    if (moveZoneStorageKeyRef.current == null || !activeLayerswitcher) {
      return;
    }
    const expectedKey = `${mapName ?? ""}:${activeLayerswitcher.toolId}`;
    if (moveZoneStorageKeyRef.current !== expectedKey) {
      return;
    }
    saveMoveZoneByTabToStorage(
      mapName,
      activeLayerswitcher.toolId,
      moveZoneByTab,
    );
  }, [activeLayerswitcher, mapName, moveZoneByTab]);

  const activeLayerIds = useMemo(() => {
    if (!layerActivationRows) {
      return null;
    }
    return new Set(
      layerActivationRows
        .filter(
          (row) => row.active && (row.layerKind ?? "display") === "display",
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

  // Layers parked in Move Zone from Draworder stay in Maplayers but leave the
  // draw-order list until dropped back. Derive from that tab's zone + tree.
  const drawOrderParkedIds = useMemo(() => {
    const parked = new Set<string>();
    for (const item of moveZoneByTab.drawOrder) {
      if (item.kind !== "layer") {
        continue;
      }
      if (isLayerStillInMapLayersTree(treeData, item.sourceId)) {
        parked.add(item.sourceId);
      }
    }
    return parked;
  }, [moveZoneByTab.drawOrder, treeData]);

  // Preserve user order; append newly eligible layers alphabetically.
  const effectiveDrawOrderOrderedIds = useMemo(() => {
    void drawOrderLayersKey;
    return resolveEffectiveDrawOrderOrderedIds(
      drawOrderOrderedIds,
      drawOrderLayers,
      drawOrderParkedIds,
    );
  }, [
    drawOrderLayers,
    drawOrderLayersKey,
    drawOrderOrderedIds,
    drawOrderParkedIds,
  ]);

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
        drawOrderParkedIds,
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
      drawOrderParkedIds,
    ],
  );

  useLayoutEffect(() => {
    if (!activeLayerswitcher || !menuSynced || !baselineReadyRef.current) {
      onLayerSwitcherDraftChangeRef.current?.(null);
      return;
    }

    if (
      layerSwitcherEditorSnapshot.signature === baselineSignatureRef.current
    ) {
      onLayerSwitcherDraftChangeRef.current?.(null);
      return;
    }

    onLayerSwitcherDraftChangeRef.current?.(layerSwitcherEditorSnapshot.draft);
  }, [activeLayerswitcher, layerSwitcherEditorSnapshot, menuSynced]);

  const prevActiveDisplayLayerIdsRef = useRef<Set<string> | null>(null);
  const prevBackgroundLayerIdsRef = useRef<Set<string> | null>(null);

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
    setBackgroundOrderedIds((current) => {
      const next = current.filter((id) => !deactivatedSet.has(id));
      return next.length === current.length ? current : next;
    });
    setDrawOrderOrderedIds((current) => {
      const next = current.filter((id) => !deactivatedSet.has(id));
      return next.length === current.length ? current : next;
    });
    setMoveZoneByTab((current) => {
      const strip = (items: MoveZoneItem[]) =>
        items.filter(
          (item) =>
            !(item.kind === "layer" && deactivatedSet.has(item.sourceId)),
        );
      const next: MoveZoneByTab = {
        layers: strip(current.layers),
        background: strip(current.background),
        drawOrder: strip(current.drawOrder),
      };
      if (
        next.layers.length === current.layers.length &&
        next.background.length === current.background.length &&
        next.drawOrder.length === current.drawOrder.length
      ) {
        return current;
      }
      return next;
    });
  }, [activeLayerIds]);

  useEffect(() => {
    prevActiveDisplayLayerIdsRef.current = null;
    prevBackgroundLayerIdsRef.current = null;
  }, [layerActivationResetKey]);

  // BACKGROUND toggle: stay in the left catalog until dragged into Bakgrund.
  // Newly BACKGROUND layers leave Kartlager / Ritordning; untoggled leave Bakgrund.
  useEffect(() => {
    if (loadedLayerSwitcherKeyRef.current == null) {
      prevBackgroundLayerIdsRef.current = mapBackgroundLayerIds;
      return;
    }

    const previous = prevBackgroundLayerIdsRef.current;
    prevBackgroundLayerIdsRef.current = mapBackgroundLayerIds;

    if (previous == null) {
      return;
    }

    const becameBackground = [...mapBackgroundLayerIds].filter(
      (id) => !previous.has(id),
    );
    const leftBackground = [...previous].filter(
      (id) => !mapBackgroundLayerIds.has(id),
    );

    if (becameBackground.length === 0 && leftBackground.length === 0) {
      return;
    }

    const becameSet = new Set(becameBackground);
    const leftSet = new Set(leftBackground);

    if (becameSet.size > 0) {
      setTreeData((current) => {
        const next = current.filter((node) => {
          if (node.data?.kind !== "layer") {
            return true;
          }
          return !becameSet.has(node.data.sourceId);
        });
        return next.length === current.length ? current : next;
      });
      setDrawOrderOrderedIds((current) => {
        const next = current.filter((id) => !becameSet.has(id));
        return next.length === current.length ? current : next;
      });
    }

    if (leftSet.size > 0) {
      setBackgroundOrderedIds((current) => {
        const next = current.filter((id) => mapBackgroundLayerIds.has(id));
        return next.length === current.length ? current : next;
      });
    }

    const removeFromZones = new Set([...becameSet, ...leftSet]);
    setMoveZoneByTab((current) => {
      const strip = (items: MoveZoneItem[]) =>
        items.filter(
          (item) =>
            !(item.kind === "layer" && removeFromZones.has(item.sourceId)),
        );
      const next: MoveZoneByTab = {
        layers: strip(current.layers),
        background: strip(current.background),
        drawOrder: strip(current.drawOrder),
      };
      if (
        next.layers.length === current.layers.length &&
        next.background.length === current.background.length &&
        next.drawOrder.length === current.drawOrder.length
      ) {
        return current;
      }
      return next;
    });
  }, [mapBackgroundLayerIds]);

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

  const visibleNodeIds = useMemo(() => {
    if (!search.trim()) {
      return null;
    }

    return new Set(
      filterTreeBySearch(treeData, search).map((node) => String(node.id)),
    );
  }, [search, treeData]);

  // Hook return collapses to `error` under type-aware ESLint in this file
  // (large DnD/Tree import graph). Re-bind through local types from `../types`.
  const clickPlace = useMapLayersClickPlace({
    treeData,
    setTreeData,
    moveZoneItems,
    setMoveZoneItems,
    setVisibleIds,
    backgroundMode,
    drawOrderMode,
    openNodeIds,
    visibleNodeIds,
  }) as unknown as MapLayersClickPlaceBindings;
  const {
    clickPick,
    setClickPick,
    clickMode,
    handleInteractionModeChange,
    clearClickPickAndResetToDrag,
    handleCatalogClickPick,
    handleTreeClickInteract,
    handleClickPlaceToRoot,
    handleClickPlaceToRootStart,
    handleClickPlaceRootEdgeHover,
    handleClickPlaceRootEndHover,
    handleClickPlaceToMoveZone,
    handleMoveZoneClickPick,
    clickPickCount,
    clickPickLabel,
    canClickPlaceToRoot,
    clickPickEdgeById,
    hoveredSubtreeIds,
    handleMapLayersNodeHover,
    handleMapLayersTreeMouseLeave,
    clickPlaceIndicator,
  } = clickPlace;

  const handlePreviewTabChange = useCallback(
    (tab: LayerSwitcherPreviewTab) => {
      if (tab === previewTab) {
        return;
      }
      setPreviewTab(tab);
      clearClickPickAndResetToDrag();
    },
    [clearClickPickAndResetToDrag, previewTab],
  );

  const [treeGroupsFullyExpanded, setTreeGroupsFullyExpanded] = useState(true);

  const handleToggleAllGroups = useCallback(() => {
    if (treeGroupsFullyExpanded) {
      mapLayersTreeRef.current?.collapseAll();
      setTreeGroupsFullyExpanded(false);
    } else {
      mapLayersTreeRef.current?.expandAll();
      setTreeGroupsFullyExpanded(true);
    }
  }, [treeGroupsFullyExpanded]);

  const toolGroupsFromOptions = useMemo(
    () => getClientGroupsFromToolOptions(activeLayerswitcherOptions),
    [activeLayerswitcherOptions],
  );
  const toolBaselayersFromOptions = useMemo(
    () => getClientBaselayersFromToolOptions(activeLayerswitcherOptions),
    [activeLayerswitcherOptions],
  );

  const toolGroupsJson = useMemo(
    () => JSON.stringify(toolGroupsFromOptions),
    [toolGroupsFromOptions],
  );

  const toolBaselayersJson = useMemo(
    () =>
      JSON.stringify(toolBaselayersFromOptions.map((entry) => entry.layerId)),
    [toolBaselayersFromOptions],
  );

  // Load Kartlager / Bakgrund / Ritordning from the *active* LayerSwitcher's
  // Tool.options (not shared map DB state). An empty tool → empty tree.
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate local editor state from active tool/draft */
  useEffect(() => {
    if (!activeLayerswitcher) {
      loadedLayerSwitcherKeyRef.current = null;
      loadedLayerswitcherToolIdRef.current = null;
      moveZoneStorageKeyRef.current = null;
      baselineSignatureRef.current = "";
      baselineReadyRef.current = false;
      setTreeData([]);
      setVisibleIds(new Set());
      setGroupDisplaySettings({});
      setLayerDisplaySettings({});
      setBackgroundOrderedIds([]);
      setDrawOrderOrderedIds([]);
      setMoveZoneByTab(createEmptyMoveZoneByTab());
      onLayerSwitcherDraftChangeRef.current?.(null);
      return;
    }

    const activeToolId = activeLayerswitcher.toolId;
    const switchedLayerswitcher =
      loadedLayerswitcherToolIdRef.current !== activeToolId;
    if (switchedLayerswitcher) {
      loadedLayerswitcherToolIdRef.current = activeToolId;
      // Drop unsaved edits from the previously active LayerSwitcher.
      onLayerSwitcherDraftChangeRef.current?.(null);
    }

    const activeLayerIdsKey = activeLayerIds
      ? [...activeLayerIds].sort().join("|")
      : "";
    const loadKey = `${activeToolId}|${toolGroupsJson}|${toolBaselayersJson}|${layerActivationResetKey}|${activeLayerIdsKey}`;

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

    const pending = switchedLayerswitcher ? null : pendingDraftRef.current;
    const restoringDraft = pending != null;
    const rawGroupsToLoad = restoringDraft
      ? pending.groups
      : toolGroupsFromOptions;
    const normalizedBaselayers: {
      layerId: string;
      visibleAtStart: boolean;
      infobox: string;
    }[] = restoringDraft
      ? pending.baselayers.map((entry) => ({
          layerId: entry.layerId,
          visibleAtStart: entry.visibleAtStart ?? false,
          infobox: entry.infobox ?? "",
        }))
      : toolBaselayersFromOptions.map((entry) => ({
          layerId: entry.layerId,
          visibleAtStart: entry.visibleAtStart,
          infobox: entry.infobox,
        }));
    const prunedLoad =
      activeLayerIds != null
        ? pruneLayerSwitcherDraftToActiveLayers(
            { groups: rawGroupsToLoad, baselayers: normalizedBaselayers },
            activeLayerIds,
          )
        : { groups: rawGroupsToLoad, baselayers: normalizedBaselayers };
    const groupsToLoad = prunedLoad.groups;
    const baselayersToLoad = prunedLoad.baselayers;

    const intermediate = clientGroupsToLayerSwitcherTree(groupsToLoad);
    const nodes = applyMapLayersSiblingOrder(
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
    const loadedBackgroundOrder = baselayersToLoad.map(
      (entry) => entry.layerId,
    );
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
    setExclusiveRadioPreviewByParent({});
    setGroupDisplaySettings(hydrated.groupDisplaySettings);
    setLayerDisplaySettings(loadedLayerSettings);
    setBackgroundOrderedIds(loadedBackgroundOrder);
    setDrawOrderOrderedIds(loadedDrawOrderIds);

    const placedFromTree = collectPlacedSourceIds(nodes);
    const storedZones = loadMoveZoneByTabFromStorage(
      mapName,
      activeLayerswitcher.toolId,
    );
    const prunedZones = pruneMoveZoneByTabAgainstPlaced(storedZones, {
      treeLayerIds: placedFromTree.layerIds,
      treeGroupIds: placedFromTree.groupIds,
      backgroundIds: new Set(loadedBackgroundOrder),
      drawOrderIds: new Set(loadedDrawOrderIds),
    });
    moveZoneStorageKeyRef.current = `${mapName ?? ""}:${activeLayerswitcher.toolId}`;
    setMoveZoneByTab(prunedZones);
    saveMoveZoneByTabToStorage(
      mapName,
      activeLayerswitcher.toolId,
      prunedZones,
    );
  }, [
    activationBackgroundOrder,
    activeLayerIds,
    activeLayerswitcher,
    groupNames,
    layerActivationResetKey,
    layerNames,
    mapBackgroundLayerIds,
    mapName,
    toolBaselayersFromOptions,
    toolBaselayersJson,
    toolGroupsFromOptions,
    toolGroupsJson,
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

  const {
    canAcceptMoveZoneDropToDrawOrder,
    handleMoveZoneDropToDrawOrder,
    canAcceptMoveZoneDropToBackground,
    handleMoveZoneDropToBackground,
    handleDropToMoveZone,
    canAcceptCatalogDropToMoveZone,
    handleDropCatalogToMoveZone,
  } = useMapLayersMoveZone({
    treeData,
    setTreeData,
    moveZoneItems,
    setMoveZoneItems,
    setVisibleIds,
    setDrawOrderOrderedIds,
    setBackgroundOrderedIds,
    drawOrderMode,
    backgroundMode,
    effectiveDrawOrderOrderedIds,
    effectiveBackgroundOrderedIds,
    layerNames,
    placedIds,
  });

  const {
    addCatalogItemsToParent,
    handleCatalogDropToRoot,
    canAcceptCatalogDropToRoot,
    handleMoveZoneDropToRoot,
    canAcceptMoveZoneDropToRoot,
    handleDrop,
    handleDropTreeItemToRoot,
    canAcceptTreeItemToRoot,
  } = useMapLayersTreeDnd({
    treeData,
    setTreeData,
    setMoveZoneItems,
    backgroundMode,
  });

  const syncLayerVisibleAtStartFromIds = useCallback(
    (
      nextVisibleIds: Set<string>,
      layerNodeIds: Iterable<GroupLayerTreeNode["id"]>,
    ) => {
      setLayerDisplaySettings((current) => {
        const next = { ...current };
        for (const layerNodeId of layerNodeIds) {
          const layerNode = treeData.find((entry) => entry.id === layerNodeId);
          if (layerNode?.data?.kind !== "layer") {
            continue;
          }
          next[layerNode.data.sourceId] = {
            ...(next[layerNode.data.sourceId] ??
              DEFAULT_LAYER_DISPLAY_SETTINGS),
            layerVisibleAtStart: nextVisibleIds.has(String(layerNodeId)),
          };
        }
        return next;
      });
    },
    [treeData],
  );

  const handleToggleExclusiveRadioPreview = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node || node.data?.kind !== "layer") {
        return;
      }
      const parentKey = String(node.parent);
      const childKey = String(nodeId);
      setExclusiveRadioPreviewByParent((current) => {
        if (current[parentKey] === childKey) {
          const next = { ...current };
          delete next[parentKey];
          return next;
        }
        return { ...current, [parentKey]: childKey };
      });
    },
    [treeData],
  );

  const handleToggleLayerVisibility = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const node = treeData.find((entry) => entry.id === nodeId);
      if (!node || node.data?.kind !== "layer") {
        return;
      }

      if (isParentGroupExclusive(treeData, nodeId, groupDisplaySettings)) {
        handleToggleExclusiveRadioPreview(nodeId);
        return;
      }

      const nextVisibleIds = toggleLayerVisibility(visibleIds, nodeId);
      setVisibleIds(nextVisibleIds);
      syncLayerVisibleAtStartFromIds(nextVisibleIds, [nodeId]);
    },
    [
      groupDisplaySettings,
      handleToggleExclusiveRadioPreview,
      syncLayerVisibleAtStartFromIds,
      treeData,
      visibleIds,
    ],
  );

  const handleToggleGroupVisibility = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      const nextVisibleIds = toggleGroupVisibility(
        treeData,
        visibleIds,
        nodeId,
      );
      setVisibleIds(nextVisibleIds);
      syncLayerVisibleAtStartFromIds(
        nextVisibleIds,
        getDescendantLayerNodeIds(treeData, nodeId),
      );
    },
    [syncLayerVisibleAtStartFromIds, treeData, visibleIds],
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

        return applyMapLayersSiblingOrder(updatedTree);
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
      const parentExclusive = isParentGroupExclusive(
        treeData,
        nodeId,
        groupDisplaySettings,
      );
      const layerVisibleAtStart = parentExclusive
        ? (layerDisplaySettings[sourceId]?.layerVisibleAtStart ?? false)
        : values.layerVisibleAtStart;

      setLayerDisplaySettings((current) => ({
        ...current,
        [sourceId]: {
          ...(current[sourceId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
          layerVisibleAtStart,
          layerInfoBox: values.layerInfoBox,
        },
      }));

      if (!parentExclusive) {
        setVisibleIds((current) => {
          const next = new Set(current);
          const key = String(nodeId);
          if (layerVisibleAtStart) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return next;
        });
      }

      setLayerEditDialogTarget(null);
    },
    [
      groupDisplaySettings,
      layerDisplaySettings,
      layerEditDialogTarget,
      treeData,
    ],
  );

  const handleTreeGroupFormSubmit = useCallback(
    async (values: GroupFormValues) => {
      if (!editDialogTarget) {
        return;
      }

      const displaySettings = toDisplaySettings({
        ...values,
        toggled: values.exclusive ? false : values.toggled,
      });

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

  const layerEditVisibleAtStartDisabled = useMemo(() => {
    if (!layerEditDialogTarget) {
      return false;
    }
    return isParentGroupExclusive(
      treeData,
      layerEditDialogTarget.nodeId,
      groupDisplaySettings,
    );
  }, [groupDisplaySettings, layerEditDialogTarget, treeData]);

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
    <MapLayersDndProvider>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(200px, 240px) minmax(0, 1fr)",
            xl: "minmax(220px, 280px) minmax(0, 1fr)",
          },
          gap: { xs: 2, lg: 3 },
          alignItems: "start",
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
          clickModeActive={clickMode}
          clickPick={clickPick}
          onCatalogClickPick={handleCatalogClickPick}
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
          mapName={mapName}
          activeLayerswitcherName={activeLayerswitcherName}
          activeTab={previewTab}
          onActiveTabChange={handlePreviewTabChange}
          showFilter={previewOptions.showFilter}
          showQuickAccess={previewOptions.showQuickAccess}
          showDrawOrderView={previewOptions.showDrawOrderView}
          enableQuickAccessPresets={previewOptions.enableQuickAccessPresets}
          enableUserQuickAccessFavorites={
            previewOptions.enableUserQuickAccessFavorites
          }
          allGroupsExpanded={treeGroupsFullyExpanded}
          onToggleAllGroups={
            !backgroundMode && !drawOrderMode
              ? handleToggleAllGroups
              : undefined
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
              onMoveZoneDrop={handleMoveZoneDropToDrawOrder}
              canAcceptMoveZoneItem={canAcceptMoveZoneDropToDrawOrder}
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
              onMoveZoneDrop={handleMoveZoneDropToBackground}
              canAcceptMoveZoneItem={canAcceptMoveZoneDropToBackground}
            />
          ) : visibleNodeIds?.size === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("map.drawOrderNoSearchResults")}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {clickMode && clickPickCount > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "action.selected",
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                    {clickPickCount === 1
                      ? t("groupsDevelopment.clickDropHolding", {
                          name: clickPickLabel,
                        })
                      : t("groupsDevelopment.clickDropHoldingMany", {
                          count: clickPickCount,
                        })}
                  </Typography>
                  <Button size="small" onClick={() => setClickPick(null)}>
                    {t("common.cancel")}
                  </Button>
                </Box>
              ) : null}
              {treeData.length === 0 ? (
                <GroupLayerTreeDropZone
                  emptyLabel={t("groupsDevelopment.emptyMapLayers")}
                  emptyActionLabel={t("common.addToGroup")}
                  onEmptyAction={handleOpenRootAddDialog}
                  onCatalogDrop={handleCatalogDropToRoot}
                  canAcceptCatalogItem={canAcceptCatalogDropToRoot}
                  onMoveZoneDrop={handleMoveZoneDropToRoot}
                  canAcceptMoveZoneItem={canAcceptMoveZoneDropToRoot}
                  onTreeDropToRoot={handleDropTreeItemToRoot}
                  canAcceptTreeItemToRoot={canAcceptTreeItemToRoot}
                  clickPlaceActive={canClickPlaceToRoot}
                  onClickPlace={handleClickPlaceToRoot}
                  onClickPlaceHoverChange={handleClickPlaceRootEndHover}
                />
              ) : (
                <GroupLayerTreeDropZone
                  onCatalogDrop={handleCatalogDropToRoot}
                  canAcceptCatalogItem={canAcceptCatalogDropToRoot}
                  onMoveZoneDrop={handleMoveZoneDropToRoot}
                  canAcceptMoveZoneItem={canAcceptMoveZoneDropToRoot}
                  onTreeDropToRoot={handleDropTreeItemToRoot}
                  canAcceptTreeItemToRoot={canAcceptTreeItemToRoot}
                  clickPlaceActive={canClickPlaceToRoot}
                  onClickPlace={handleClickPlaceToRoot}
                  onClickPlaceHoverChange={handleClickPlaceRootEndHover}
                >
                  <MapLayersTreeView
                    ref={mapLayersTreeRef}
                    treeData={treeData}
                    visibleIds={visibleIds}
                    exclusiveRadioPreviewByParent={
                      exclusiveRadioPreviewByParent
                    }
                    visibleNodeIds={visibleNodeIds}
                    groupDisplaySettings={groupDisplaySettings}
                    clickMode={clickMode}
                    clickPickIsNull={clickPick == null}
                    hoveredSubtreeIds={hoveredSubtreeIds}
                    clickPickEdgeById={clickPickEdgeById}
                    clickPlaceIndicator={clickPlaceIndicator}
                    canClickPlaceToRoot={canClickPlaceToRoot}
                    onClickPlaceRootStart={handleClickPlaceToRootStart}
                    onHoverRootEdge={handleClickPlaceRootEdgeHover}
                    onChangeOpen={setOpenNodeIds}
                    onDrop={handleDrop}
                    onTreeMouseLeave={handleMapLayersTreeMouseLeave}
                    onTreeClickInteract={handleTreeClickInteract}
                    onHoverSubtree={handleMapLayersNodeHover}
                    onToggleLayerVisibility={handleToggleLayerVisibility}
                    onToggleGroupVisibility={handleToggleGroupVisibility}
                    onAddToGroup={handleOpenAddDialog}
                    onRemoveFromTree={handleRemoveFromTree}
                    onEditGroupMetadata={handleOpenEditDialog}
                    onEditLayerSettings={handleOpenLayerEditDialog}
                  />
                </GroupLayerTreeDropZone>
              )}
            </Box>
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
          disableVisibleAtStart={layerEditVisibleAtStartDisabled}
          onClose={() => setLayerEditDialogTarget(null)}
          onSubmit={handleLayerFormSubmit}
        />
      </Box>

      {moveZoneHostEl
        ? createPortal(
            <MapLayersMoveZone
              items={moveZoneItems}
              onDropFromTree={handleDropToMoveZone}
              onDropFromCatalog={handleDropCatalogToMoveZone}
              canAcceptCatalogItem={canAcceptCatalogDropToMoveZone}
              clickMode={clickMode}
              onInteractionModeChange={
                backgroundMode || drawOrderMode
                  ? undefined
                  : handleInteractionModeChange
              }
              pickedItemKeys={
                clickPick?.source === "moveZone"
                  ? clickPick.items.map((item) => item.key)
                  : []
              }
              onClickPlace={
                clickMode &&
                clickPick != null &&
                clickPick.source !== "moveZone"
                  ? handleClickPlaceToMoveZone
                  : undefined
              }
              onItemClickPick={clickMode ? handleMoveZoneClickPick : undefined}
            />,
            moveZoneHostEl,
          )
        : null}
    </MapLayersDndProvider>
  );
}
