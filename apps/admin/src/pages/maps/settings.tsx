import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactElement,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { Trans, useTranslation } from "react-i18next";
import {
  TextField,
  useTheme,
  Box,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import BuildIcon from "@mui/icons-material/Build";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MapIcon from "@mui/icons-material/Map";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import CookieIcon from "@mui/icons-material/Cookie";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import { FieldValues, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMapByName,
  useUpdateMap,
  useUpdateMapTools,
  useUpdateMapContent,
  useUpdateMapLayers,
  useUpdateMapLayerSwitcher,
  useMapLayerSwitcher,
  useDeleteMap,
  useMaps,
  useToolsByMapName,
  useMapContentByName,
} from "../../api/maps";
import type { MapContentApiResponse, MapGroup, MapLayer } from "../../api/maps";
import { getMapContentByName } from "../../api/maps";
import DialogWrapper from "../../components/flexible-dialog";
import {
  buildMapSettingsFormValues,
  buildMapUpdatePayload,
} from "./map-settings-form-values";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import { HttpError } from "../../lib/http-error";
import FormContainer from "../../components/form-components/form-container";
import MapSettingsForm, {
  type MapSettingsSection,
} from "./components/map-settings-form";
import MapThemesTab from "./components/map-themes-tab";
import MapContentPanel from "./components/map-content-panel";
import {
  buildMapLayerActivationRows,
  mapLayerActivationSignature,
  mapLayerActivationToPayload,
  type MapLayerActivationRow,
} from "./components/map-layers-panel";
import { pruneLayerSwitcherDraftToActiveLayers } from "../groups-development/utils/client-groups";
import {
  buildMapLayerTree,
  buildServerMapContentItems,
  entityIdFromItemId,
  mapLayerDrawOrderSignatureForActiveLayers,
  mapPlacementSignatureForActiveLayers,
  mapContentToPayloads,
  mapLayerTreeToPayload,
  syncLayerDrawOrderWithPlacement,
  syncPlacementVisibleAtStartFromDrawOrder,
  addLayerToPlacementIfMissing,
  insertLayerInDrawOrder,
  removeLayerFromDrawOrderTree,
} from "./map-group-placement-utils";
import { TreeItemData } from "../../components/layerswitcher-dnd";
import { useTools } from "../../api/tools";
import type { KartlagerDraft } from "../groups-development/types";
import { useGroups } from "../../api/groups";
import { useLayers } from "../../api/layers";
import type { ToolWindowPosition, ToolZone } from "../../api/maps";
import MapToolsPanel from "./components/map-tools-panel";
import {
  EMPTY_TOOL_ZONES,
  buildToolTypesById,
  buildToolsDraftState,
  findToolZoneForId,
  getCatalogToolDisplayName,
  getToolDisplayName,
  mapToolsToZones,
  moveToolToZone,
  removeToolFromZones,
  serverToolsSignature,
  targetToZoneKey,
  toolsDraftSignature,
  zoneKeyToTarget,
  zonesToToolsPayload,
  type MapToolsDraftState,
  type ToolWindowSize,
  type ToolZones,
} from "./map-tools-utils";
import { useProjections } from "../../api/services";
import useAppStateStore from "../../store/use-app-state-store";
import { TreeItems } from "dnd-kit-sortable-tree";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";

const MAP_PAGE_TABS = [
  { key: "settings", labelKey: "common.settings", icon: <SettingsIcon /> },
  { key: "menu", labelKey: "maps.tab.mapContent", icon: <LayersIcon /> },
  { key: "tools", labelKey: "common.tools", icon: <BuildIcon /> },
  { key: "themes", labelKey: "common.themes", icon: <StyleIcon /> },
] as const;

const MAP_SETTINGS_SECTIONS: {
  key: MapSettingsSection;
  labelKey: string;
  icon: ReactElement;
}[] = [
  { key: "map", labelKey: "map.baseSettings", icon: <MapIcon /> },
  {
    key: "controls",
    labelKey: "map.settingsSection.controls",
    icon: <TouchAppIcon />,
  },
  {
    key: "appearance",
    labelKey: "map.settingsSection.appearance",
    icon: <PaletteIcon />,
  },
  {
    key: "content",
    labelKey: "map.settingsSection.content",
    icon: <CookieIcon />,
  },
  {
    key: "search",
    labelKey: "common.searchSettings",
    icon: <ManageSearchIcon />,
  },
];

const VALID_MAP_SETTINGS_SECTIONS = new Set<MapSettingsSection>(
  MAP_SETTINGS_SECTIONS.map((section) => section.key),
);

interface ToolsDraft {
  mapName: string;
  zones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  inactiveTargets: Record<number, ToolZone>;
}

export default function MapSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mapId } = useParams();
  const { data: maps } = useMaps();
  const mapName = maps?.find((m) => m.id == mapId)?.name;
  const { data: map, isLoading, isError } = useMapByName(mapName ?? "");
  const { mutateAsync: updateMap, status: updateStatus } = useUpdateMap();
  const { mutateAsync: updateMapTools } = useUpdateMapTools();
  const { mutateAsync: updateMapContent } = useUpdateMapContent();
  const { mutateAsync: updateMapLayers } = useUpdateMapLayers();
  const { mutateAsync: updateMapLayerSwitcher } = useUpdateMapLayerSwitcher();
  const { mutateAsync: deleteMap, isPending: isDeletingMap } = useDeleteMap();
  const { data: layerSwitcherState } = useMapLayerSwitcher(mapName ?? "");
  const { palette } = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const saveInFlightRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "settings") as
    | "menu"
    | "settings"
    | "tools"
    | "themes";
  const setActiveTab = (tab: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );

  const settingsSectionFromUrl = searchParams.get("settingsTab");
  const normalizedSettingsSection: MapSettingsSection | null =
    settingsSectionFromUrl === "ui"
      ? "appearance"
      : (settingsSectionFromUrl as MapSettingsSection | null);
  const settingsSection: MapSettingsSection =
    normalizedSettingsSection &&
    VALID_MAP_SETTINGS_SECTIONS.has(normalizedSettingsSection)
      ? normalizedSettingsSection
      : "map";
  const setSettingsSection = (section: MapSettingsSection) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "settings");
        next.set("settingsTab", section);
        return next;
      },
      { replace: true },
    );
  };

  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");
  const showSettingsSearchUi =
    activeTab === "settings" && settingsSection === "search";
  const settingsSearchTerm = showSettingsSearchUi ? settingsSearchQuery : "";
  const { data: groups = [] } = useGroups();
  const { data: layers = [], isFetched: layersFetched } = useLayers();
  const catalogLayers = useMemo(
    () =>
      layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        layerKind: layer.layerKind,
      })),
    [layers],
  );
  const catalogGroups = useMemo(
    () =>
      groups.map((group) => ({
        id: group.id,
        name: group.name,
        layerCount: group.layerCount ?? 0,
        nestedGroupCount: group.nestedGroupCount ?? 0,
        nestingLevel: group.nestingLevel ?? 1,
      })),
    [groups],
  );
  const { data: mapTools } = useToolsByMapName(mapName ?? "");
  const { data: catalogTools } = useTools();
  const {
    data: mapContent,
    isError: mapContentError,
    isLoading: mapContentLoading,
  } = useMapContentByName(mapName ?? "");
  const mapLayers = mapContent?.layers;
  const mapGroups = mapContent?.groups;
  const { data: projections } = useProjections();
  const { defaultCoordinates } = useAppStateStore.getState();

  const projectionOptions = useMemo(
    () =>
      (projections ?? [])
        .filter((projection) => projection.code.startsWith("EPSG:"))
        .map((projection) => ({
          title: projection.code,
          value: projection.code,
        })),
    [projections],
  );

  // Drop zone state for map content (direct layers + group placements).
  const [mapContentDZ, setMapContentDZ] = useState<TreeItems<TreeItemData>>(
    [],
  );
  const [mapLayerDrawOrderDZ, setMapLayerDrawOrderDZ] = useState<
    TreeItems<TreeItemData>
  >([]);
  const [layerActivationRows, setLayerActivationRows] = useState<
    MapLayerActivationRow[]
  >([]);
  const [layerActivationCommittedSignature, setLayerActivationCommittedSignature] =
    useState("");
  const layerActivationWasDirtyRef = useRef(false);
  const layerActivationRowsRef = useRef(layerActivationRows);
  const layerActivationCommittedSignatureRef = useRef(
    layerActivationCommittedSignature,
  );
  layerActivationRowsRef.current = layerActivationRows;
  layerActivationCommittedSignatureRef.current =
    layerActivationCommittedSignature;
  const [layerActivationResetKey, setLayerActivationResetKey] = useState(0);
  const [menuSynced, setMenuSynced] = useState(false);

  const buildEnrichedServerMapContentItems = useCallback(
    (layers: MapLayer[], groups: MapGroup[]): TreeItems<TreeItemData> => {
      const items = buildServerMapContentItems(layers, groups);
      const catalogById = new Map(
        catalogGroups.map((group) => [group.id, group]),
      );

      return items.map((node) => {
        if (node.type !== "group") return node;
        const groupId = entityIdFromItemId(node.id);
        const catalog = catalogById.get(groupId);
        return {
          ...node,
          layerCount: catalog?.layerCount,
          nestedGroupCount: catalog?.nestedGroupCount,
        };
      });
    },
    [catalogGroups],
  );

  const applyMenuStateFromServer = useCallback(
    (layers: MapLayer[], groups: MapGroup[]) => {
      const activationRows = buildMapLayerActivationRows(catalogLayers, layers);
      setMapContentDZ(buildEnrichedServerMapContentItems(layers, groups));
      setMapLayerDrawOrderDZ(buildMapLayerTree(layers));
      setLayerActivationRows(activationRows);
      setLayerActivationCommittedSignature(
        mapLayerActivationSignature(activationRows),
      );
    },
    [buildEnrichedServerMapContentItems, catalogLayers],
  );

  const serverMapContentItems = useMemo<TreeItems<TreeItemData>>(
    () =>
      buildEnrichedServerMapContentItems(mapLayers ?? [], mapGroups ?? []),
    [buildEnrichedServerMapContentItems, mapLayers, mapGroups],
  );

  const serverLayerDrawOrderItems = useMemo<TreeItems<TreeItemData>>(
    () => buildMapLayerTree(mapLayers ?? []),
    [mapLayers],
  );

  const serverLayerActivationRows = useMemo(
    () => buildMapLayerActivationRows(catalogLayers, mapLayers ?? []),
    [catalogLayers, mapLayers],
  );

  const activeCatalogLayerIds = useMemo(
    () =>
      new Set(
        layerActivationRows
          .filter((row) => row.active)
          .map((row) => row.layerId),
      ),
    [layerActivationRows],
  );

  const placementDirtyRaw = useMemo(() => {
    if (!mapName || mapLayers === undefined || mapGroups === undefined) {
      return false;
    }
    return (
      mapPlacementSignatureForActiveLayers(
        mapContentDZ,
        activeCatalogLayerIds,
      ) !==
      mapPlacementSignatureForActiveLayers(
        serverMapContentItems,
        activeCatalogLayerIds,
      )
    );
  }, [
    activeCatalogLayerIds,
    mapContentDZ,
    serverMapContentItems,
    mapName,
    mapLayers,
    mapGroups,
  ]);

  const drawOrderDirtyRaw = useMemo(() => {
    if (!mapName || mapLayers === undefined) {
      return false;
    }
    return (
      mapLayerDrawOrderSignatureForActiveLayers(
        mapLayerDrawOrderDZ,
        activeCatalogLayerIds,
      ) !==
      mapLayerDrawOrderSignatureForActiveLayers(
        serverLayerDrawOrderItems,
        activeCatalogLayerIds,
      )
    );
  }, [
    activeCatalogLayerIds,
    mapLayerDrawOrderDZ,
    serverLayerDrawOrderItems,
    mapName,
    mapLayers,
  ]);

  const layerActivationDirtyRaw = useMemo(() => {
    if (!mapName || mapLayers === undefined || !layersFetched || !menuSynced) {
      return false;
    }
    return (
      mapLayerActivationSignature(layerActivationRows) !==
      layerActivationCommittedSignature
    );
  }, [
    layerActivationRows,
    layerActivationCommittedSignature,
    layersFetched,
    mapLayers,
    mapName,
    menuSynced,
  ]);

  const contentDirtyRaw =
    placementDirtyRaw || drawOrderDirtyRaw || layerActivationDirtyRaw;

  useEffect(() => {
    setMenuSynced(false);
    setLayerActivationCommittedSignature("");
    layerActivationWasDirtyRef.current = false;
  }, [mapName]);

  useEffect(() => {
    if (
      !mapName ||
      mapLayers === undefined ||
      mapGroups === undefined ||
      !layersFetched
    ) {
      return;
    }
    if (!menuSynced) {
      applyMenuStateFromServer(mapLayers, mapGroups);
      setMenuSynced(true);
      return;
    }
    if (contentDirtyRaw) {
      return;
    }

    const serverActivationSignature = mapLayerActivationSignature(
      serverLayerActivationRows,
    );
    const localActivationSignature = mapLayerActivationSignature(
      layerActivationRowsRef.current,
    );
    const committedSignature = layerActivationCommittedSignatureRef.current;
    const localMatchesCommitted =
      localActivationSignature === committedSignature;

    // After Lager save, local rows reflect the commit but refetched server rows
    // can lag one render — refresh placement/draw only until server catches up.
    if (
      localMatchesCommitted &&
      serverActivationSignature !== committedSignature
    ) {
      setMapContentDZ(serverMapContentItems);
      setMapLayerDrawOrderDZ(serverLayerDrawOrderItems);
      return;
    }

    applyMenuStateFromServer(mapLayers, mapGroups);
  }, [
    mapName,
    mapLayers,
    mapGroups,
    layersFetched,
    serverMapContentItems,
    serverLayerDrawOrderItems,
    serverLayerActivationRows,
    menuSynced,
    contentDirtyRaw,
    applyMenuStateFromServer,
  ]);

  useEffect(() => {
    if (layerActivationDirtyRaw) {
      layerActivationWasDirtyRef.current = true;
      return;
    }
    if (!layerActivationWasDirtyRef.current) {
      return;
    }
    layerActivationWasDirtyRef.current = false;
    setKartlagerDraft(null);
    setLayerActivationResetKey((key) => key + 1);
  }, [layerActivationDirtyRaw]);

  const handleLayerActivationRowsChange = useCallback(
    (rows: MapLayerActivationRow[]) => {
      const nextSignature = mapLayerActivationSignature(rows);
      if (
        menuSynced &&
        layerActivationCommittedSignature &&
        nextSignature === layerActivationCommittedSignature
      ) {
        setLayerActivationRows(serverLayerActivationRows);
        layerActivationWasDirtyRef.current = false;
        setKartlagerDraft(null);
        setLayerActivationResetKey((key) => key + 1);
        return;
      }
      setLayerActivationRows(rows);
    },
    [
      layerActivationCommittedSignature,
      menuSynced,
      serverLayerActivationRows,
    ],
  );

  const handleMapContentChange = useCallback(
    (items: TreeItems<TreeItemData>) => {
      setMapContentDZ(items);
      setMapLayerDrawOrderDZ((prev) =>
        syncLayerDrawOrderWithPlacement(items, prev),
      );
    },
    [],
  );

  const handleMapDrawOrderChange = useCallback(
    (items: TreeItems<TreeItemData>) => {
      setMapLayerDrawOrderDZ(items);
      setMapContentDZ((prev) =>
        syncPlacementVisibleAtStartFromDrawOrder(prev, items),
      );
    },
    [],
  );

  const handleInsertLayerToDrawOrder = useCallback(
    (layer: { id: string; name: string }, insertIndex: number) => {
      setMapContentDZ((prev) => addLayerToPlacementIfMissing(prev, layer));
      setMapLayerDrawOrderDZ((prev) =>
        insertLayerInDrawOrder(prev, layer, insertIndex),
      );
    },
    [],
  );

  const handleRemoveLayerFromDrawOrder = useCallback((layerId: string) => {
    setMapLayerDrawOrderDZ((prev) =>
      removeLayerFromDrawOrderTree(prev, layerId),
    );
  }, []);

  const contentDirty = menuSynced && contentDirtyRaw;
  const serverToolZones = useMemo(
    () => (mapTools ? mapToolsToZones(mapTools) : null),
    [mapTools],
  );
  const serverToolsDraftState = useMemo<MapToolsDraftState | null>(
    () => (mapTools ? buildToolsDraftState(mapTools) : null),
    [mapTools],
  );
  const [toolsDraft, setToolsDraft] = useState<ToolsDraft | null>(null);
  const toolsDraftRef = useRef<ToolsDraft | null>(null);
  const flushMapToolEditsRef = useRef<(() => void) | null>(null);
  const [hasPendingWindowSizeInput, setHasPendingWindowSizeInput] =
    useState(false);
  const [kartlagerDraft, setKartlagerDraft] = useState<KartlagerDraft | null>(
    null,
  );
  const kartlagerDirty = kartlagerDraft != null && !layerActivationDirtyRaw;
  const kartlagerMapNameRef = useRef(mapName);
  const [kartlagerMoveZoneVisible, setKartlagerMoveZoneVisible] =
    useState(false);
  const kartlagerMoveZoneHostRef = useRef<HTMLDivElement | null>(null);

  if (kartlagerMapNameRef.current !== mapName) {
    kartlagerMapNameRef.current = mapName;
    if (kartlagerDraft != null) {
      setKartlagerDraft(null);
    }
  }

  const handleKartlagerDraftChange = useCallback(
    (draft: KartlagerDraft | null) => {
      setKartlagerDraft(draft);
    },
    [],
  );

  const handleGroupsDevelopmentActiveChange = useCallback(
    (active: boolean) => {
      setKartlagerMoveZoneVisible(active);
    },
    [],
  );

  useEffect(() => {
    toolsDraftRef.current = toolsDraft;
  }, [toolsDraft]);

  const applyToolsDraft = useCallback((next: ToolsDraft) => {
    toolsDraftRef.current = next;
    setToolsDraft(next);
  }, []);

  const toolZones =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.zones
      : (serverToolZones ?? EMPTY_TOOL_ZONES);

  const activeToolIds =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.activeToolIds
      : (serverToolsDraftState?.activeToolIds ?? new Set<number>());

  const windowPositions =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.windowPositions
      : (serverToolsDraftState?.windowPositions ?? {});

  const windowSizes =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.windowSizes
      : (serverToolsDraftState?.windowSizes ?? {});

  const toolTypesById = useMemo(
    () => buildToolTypesById(catalogTools ?? [], mapTools ?? []),
    [catalogTools, mapTools],
  );

  const toolsDirty = useMemo(() => {
    if (toolsDraft == null || toolsDraft.mapName !== mapName || !mapTools) {
      return false;
    }
    return (
      serverToolsSignature(mapTools, toolTypesById) !==
      toolsDraftSignature(
        toolsDraft.zones,
        toolsDraft.activeToolIds,
        toolsDraft.windowPositions,
        toolsDraft.windowSizes,
        toolsDraft.inactiveTargets,
        toolTypesById,
      )
    );
  }, [toolsDraft, mapName, mapTools, toolTypesById]);

  const resolveToolsDraft = useCallback(
    (prev: ToolsDraft | null): ToolsDraft => {
      if (prev != null && prev.mapName === mapName) return prev;

      return {
        mapName: mapName ?? "",
        zones: serverToolZones ?? EMPTY_TOOL_ZONES,
        activeToolIds: new Set<number>(serverToolsDraftState?.activeToolIds ?? []),
        windowPositions: { ...(serverToolsDraftState?.windowPositions ?? {}) },
        windowSizes: { ...(serverToolsDraftState?.windowSizes ?? {}) },
        inactiveTargets: { ...(serverToolsDraftState?.inactiveTargets ?? {}) },
      };
    },
    [mapName, serverToolZones, serverToolsDraftState],
  );

  const resolveToolName = useCallback(
    (toolId: number) => {
      const catalogTool = catalogTools?.find((tool) => Number(tool.id) === toolId);
      if (catalogTool) return getCatalogToolDisplayName(catalogTool);

      const mapTool = mapTools?.find((tool) => tool.toolId === toolId);
      if (mapTool) return getToolDisplayName(mapTool);

      return String(toolId);
    },
    [catalogTools, mapTools],
  );

  const updateToolZone = useCallback(
    (zone: keyof ToolZones, items: TreeItems<TreeItemData>) => {
      setToolsDraft((prev) => {
        const base = resolveToolsDraft(prev);
        return {
          ...base,
          zones: { ...base.zones, [zone]: items },
        };
      });
    },
    [resolveToolsDraft],
  );

  const toggleToolActive = useCallback(
    (toolId: number, active: boolean) => {
      setToolsDraft((prev) => {
        const base = resolveToolsDraft(prev);
        const nextActiveToolIds = new Set(base.activeToolIds);
        let nextZones = base.zones;
        const nextWindowPositions = { ...base.windowPositions };
        const nextWindowSizes = { ...base.windowSizes };
        const nextInactiveTargets = { ...base.inactiveTargets };

        const deactivateTool = (id: number) => {
          nextActiveToolIds.delete(id);
          const zone = findToolZoneForId(nextZones, id);
          if (zone) {
            nextInactiveTargets[id] = zoneKeyToTarget(zone);
          } else {
            delete nextInactiveTargets[id];
          }
          nextZones = removeToolFromZones(nextZones, id);
        };

        if (active) {
          const toolType = toolTypesById.get(toolId) ?? "";
          if (toolType) {
            for (const activeId of nextActiveToolIds) {
              if (
                activeId !== toolId &&
                toolTypesById.get(activeId) === toolType
              ) {
                deactivateTool(activeId);
              }
            }
          }

          nextActiveToolIds.add(toolId);
          if (!nextWindowPositions[toolId]) {
            nextWindowPositions[toolId] = "right";
          }
          // Restore the placement remembered from when it was disabled.
          const remembered = nextInactiveTargets[toolId];
          if (remembered) {
            nextZones = moveToolToZone(
              nextZones,
              toolId,
              resolveToolName(toolId),
              targetToZoneKey(remembered),
            );
            delete nextInactiveTargets[toolId];
          }
        } else {
          deactivateTool(toolId);
        }

        return {
          mapName: mapName ?? "",
          zones: nextZones,
          activeToolIds: nextActiveToolIds,
          windowPositions: nextWindowPositions,
          windowSizes: nextWindowSizes,
          inactiveTargets: nextInactiveTargets,
        };
      });
    },
    [mapName, resolveToolsDraft, resolveToolName, toolTypesById],
  );

  const setToolTarget = useCallback(
    (toolId: number, target: ToolZone | null) => {
      setToolsDraft((prev) => {
        const base = resolveToolsDraft(prev);
        if (!base.activeToolIds.has(toolId)) return prev;

        return {
          mapName: mapName ?? "",
          zones: moveToolToZone(
            base.zones,
            toolId,
            resolveToolName(toolId),
            target ? targetToZoneKey(target) : null,
          ),
          activeToolIds: new Set(base.activeToolIds),
          windowPositions: { ...base.windowPositions },
          windowSizes: { ...base.windowSizes },
          inactiveTargets: { ...base.inactiveTargets },
        };
      });
    },
    [mapName, resolveToolsDraft, resolveToolName],
  );

  const setToolWindowPosition = useCallback(
    (toolId: number, position: ToolWindowPosition) => {
      setToolsDraft((prev) => {
        const base = resolveToolsDraft(prev);
        if (!base.activeToolIds.has(toolId)) return prev;

        return {
          mapName: mapName ?? "",
          zones: base.zones,
          activeToolIds: new Set(base.activeToolIds),
          windowPositions: {
            ...base.windowPositions,
            [toolId]: position,
          },
          windowSizes: { ...base.windowSizes },
          inactiveTargets: { ...base.inactiveTargets },
        };
      });
    },
    [mapName, resolveToolsDraft],
  );

  const setToolWindowSize = useCallback(
    (toolId: number, size: Partial<ToolWindowSize>) => {
      const base = resolveToolsDraft(toolsDraftRef.current);
      if (!base.activeToolIds.has(toolId)) return;

      const current = base.windowSizes[toolId] ?? {};
      const nextSize: ToolWindowSize = { ...current };

      if (Object.prototype.hasOwnProperty.call(size, "width")) {
        if (size.width === undefined) delete nextSize.width;
        else nextSize.width = size.width;
      }

      if (Object.prototype.hasOwnProperty.call(size, "height")) {
        if (size.height === undefined) delete nextSize.height;
        else nextSize.height = size.height;
      }

      applyToolsDraft({
        mapName: mapName ?? "",
        zones: base.zones,
        activeToolIds: new Set(base.activeToolIds),
        windowPositions: { ...base.windowPositions },
        windowSizes: {
          ...base.windowSizes,
          [toolId]: nextSize,
        },
        inactiveTargets: { ...base.inactiveTargets },
      });
    },
    [mapName, resolveToolsDraft, applyToolsDraft],
  );

  const backgroundImage = "/mapbackground.png";

  const mapFormBaseline = useMemo(
    () => (map ? buildMapSettingsFormValues(map) : null),
    [map],
  );

  const mapFormSyncKey = map ? map.name : null;

  const [committedFormBaseline, setCommittedFormBaseline] =
    useState<FieldValues | null>(null);
  const [syncedMapFormKey, setSyncedMapFormKey] = useState<string | null>(null);

  if (mapFormSyncKey !== syncedMapFormKey) {
    setSyncedMapFormKey(mapFormSyncKey);
    setCommittedFormBaseline(null);
  }

  const formBaseline = committedFormBaseline ?? mapFormBaseline;

  const {
    register,
    control,
    getValues,
    formState: { isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    values: formBaseline ?? undefined,
  });

  const mapSettingsDirty = useMemo(
    () =>
      isDirty ||
      toolsDirty ||
      hasPendingWindowSizeInput ||
      contentDirty ||
      kartlagerDirty,
    [
      isDirty,
      toolsDirty,
      hasPendingWindowSizeInput,
      contentDirty,
      kartlagerDirty,
    ],
  );

  const savePending = isSaving || updateStatus === "pending";

  const handleUpdateMap = async (formData: FieldValues) => {
    if (!map || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsSaving(true);

    try {
      flushMapToolEditsRef.current?.();

      let didSave = false;
      const currentToolsDraft = toolsDraftRef.current;
      const shouldSaveTools =
        currentToolsDraft != null &&
        mapTools != null &&
        serverToolsSignature(mapTools, toolTypesById) !==
          toolsDraftSignature(
            currentToolsDraft.zones,
            currentToolsDraft.activeToolIds,
            currentToolsDraft.windowPositions,
            currentToolsDraft.windowSizes,
            currentToolsDraft.inactiveTargets,
            toolTypesById,
          );

      // Persist placements first (keyed by the current name) so a simultaneous
      // rename doesn't target a no-longer-existing map name.
      if (shouldSaveTools) {
        const toolsPayload = zonesToToolsPayload(
          currentToolsDraft.zones,
          currentToolsDraft.activeToolIds,
          currentToolsDraft.windowPositions,
          currentToolsDraft.windowSizes,
          currentToolsDraft.inactiveTargets,
          mapTools ?? [],
          toolTypesById,
        );
        await updateMapTools({
          mapName: map.name,
          tools: toolsPayload,
        });
        toolsDraftRef.current = null;
        setToolsDraft(null);
        setHasPendingWindowSizeInput(false);
        didSave = true;
      }

      if (contentDirty && layerActivationDirtyRaw) {
        const baselayerIds = new Set(
          (kartlagerDraft?.baselayers ?? layerSwitcherState?.baselayers ?? []).map(
            (entry) => entry.layerId,
          ),
        );
        await updateMapLayers({
          mapName: map.name,
          layers: mapLayerActivationToPayload(
            layerActivationRows,
            baselayerIds,
          ),
          replaceBackground: true,
          replaceForeground: true,
        });
        const activeIds = new Set(
          layerActivationRows
            .filter((row) => row.active)
            .map((row) => row.layerId),
        );
        const base = kartlagerDraft ??
          layerSwitcherState ?? {
            groups: [],
            baselayers: [],
          };
        await updateMapLayerSwitcher({
          mapName: map.name,
          content: pruneLayerSwitcherDraftToActiveLayers(base, activeIds),
        });
        setKartlagerDraft(null);
        layerActivationWasDirtyRef.current = false;

        const contentData = await queryClient.fetchQuery<MapContentApiResponse>(
          {
            queryKey: ["mapContent", map.name],
            queryFn: () => getMapContentByName(map.name),
          },
        );
        applyMenuStateFromServer(contentData.layers, contentData.groups);
        setLayerActivationResetKey((key) => key + 1);
        await queryClient.refetchQueries({
          queryKey: ["mapLayerSwitcher", map.name],
        });
        didSave = true;
      }

      if (contentDirty && placementDirtyRaw) {
        await updateMapContent({
          mapName: map.name,
          content: mapContentToPayloads(mapContentDZ, mapLayerDrawOrderDZ),
        });
        didSave = true;
      } else if (contentDirty && drawOrderDirtyRaw) {
        await updateMapLayers({
          mapName: map.name,
          layers: mapLayerTreeToPayload(mapLayerDrawOrderDZ),
        });
        didSave = true;
      }

      if (kartlagerDraft && !layerActivationDirtyRaw) {
        await updateMapLayerSwitcher({
          mapName: map.name,
          content: {
            groups: kartlagerDraft.groups,
            baselayers: kartlagerDraft.baselayers,
          },
        });
        setKartlagerDraft(null);
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: ["mapContent", map.name],
          }),
          queryClient.refetchQueries({
            queryKey: ["mapLayerSwitcher", map.name],
          }),
        ]);
        didSave = true;
      }

      if (isDirty) {
        const payload = buildMapUpdatePayload(formData, map);
        await updateMap({
          mapName: map.name,
          data: payload,
        });
        setCommittedFormBaseline(formData);
        didSave = true;
      }

      if (didSave) {
        toast.success(t("maps.updateMapSuccess", { name: map.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Failed to update map:", error);
      toast.error(t("maps.updateMapFailed", { name: map.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleExternalSubmit = () => {
    void handleUpdateMap(getValues());
  };

  const isDeleteConfirmNameMatching =
    Boolean(map?.name) && deleteConfirmName === map?.name;

  const handleDeleteClick = () => {
    if (isDeletingMap || map?.locked) return;
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingMap) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmName("");
  };

  const handleDeleteMap = async () => {
    if (!map?.name || !isDeleteConfirmNameMatching || map.locked) return;

    try {
      await deleteMap(map.name);
      toast.success(t("maps.deleteMapSuccess", { name: map.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      setIsDeleteDialogOpen(false);
      setDeleteConfirmName("");
      void navigate("/maps");
    } catch (error) {
      console.error("Failed to delete map:", error);
      toast.error(t("maps.deleteMapFailed", { name: map.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!map) {
    throw new HttpError(404, "Map not found");
  }
  if (isError) return <div>Error fetching map details.</div>;

  return (
    <Page
      title={
        map?.name
          ? `${t("common.settings")} - ${map.name}`
          : t("common.settings")
      }
    >
      <SettingsPageTabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[...MAP_PAGE_TABS]}
      />
      <FormActionPanel
        updateStatus={savePending ? "pending" : updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={map?.createdBy}
        createdDate={map?.createdDate}
        lastSavedBy={map?.lastSavedBy}
        lastSavedDate={map?.lastSavedDate}
        isDirty={mapSettingsDirty && !savePending}
        sidebarExtra={
          kartlagerMoveZoneVisible ? (
            <Box
              ref={kartlagerMoveZoneHostRef}
              sx={{
                mt: 2,
                width: "100%",
                textAlign: "left",
              }}
            />
          ) : null
        }
        warning={
          <Box sx={{ mt: 1 }}>
            {map.locked ? (
              <Alert severity="info">{t("maps.deleteLockedWarning")}</Alert>
            ) : (
              <Alert severity="warning">{t("maps.deleteMapWarning")}</Alert>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteClick}
              disabled={isDeletingMap || map.locked}
              sx={{
                mt: 2,
                width: "100%",
                justifyContent: "center",
                borderStyle: "dashed",
              }}
            >
              {t("maps.deleteMapButton")}
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: activeTab === "settings" ? "block" : "none" }}>
          <FormContainer
            onSubmit={(e) => {
              e.preventDefault();
              void handleUpdateMap(getValues());
            }}
            formRef={formRef}
            noValidate
          >
            <SettingsPageTabs
              value={settingsSection}
              onChange={setSettingsSection}
              variant="section"
              tabs={MAP_SETTINGS_SECTIONS.map((section) => ({
                key: section.key,
                labelKey: section.labelKey,
                icon: section.icon,
              }))}
            />

            {showSettingsSearchUi && (
              <TextField
                placeholder={`${t("common.searchSettings")}...`}
                fullWidth
                autoFocus
                value={settingsSearchQuery}
                onChange={(e) => setSettingsSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <ManageSearchIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  },
                }}
                sx={{ mb: 2 }}
              />
            )}

            <MapSettingsForm
              register={register}
              control={control}
              activeSection={settingsSection}
              settingsSearchTerm={settingsSearchTerm}
              showSettingsSearchUi={showSettingsSearchUi}
              getValues={getValues}
              defaultCoordinates={defaultCoordinates}
              projectionOptions={projectionOptions}
            />
          </FormContainer>
        </Box>

        {activeTab === "menu" &&
          (mapContentLoading ||
          (mapContent === undefined && !mapContentError) ? (
            <SquareSpinnerComponent />
          ) : mapContentError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("maps.contentLoadError")}
            </Alert>
          ) : (
            <MapContentPanel
              catalogLayers={catalogLayers}
              catalogGroups={catalogGroups}
              layerActivationRows={layerActivationRows}
              onLayerActivationRowsChange={handleLayerActivationRowsChange}
              placementItems={mapContentDZ}
              onPlacementItemsChange={handleMapContentChange}
              drawOrderItems={mapLayerDrawOrderDZ}
              onDrawOrderItemsChange={handleMapDrawOrderChange}
              onInsertLayerToDrawOrder={handleInsertLayerToDrawOrder}
              onRemoveLayerFromDrawOrder={handleRemoveLayerFromDrawOrder}
              mapTools={mapTools}
              catalogTools={catalogTools}
              activeToolIds={activeToolIds}
              layerSwitcherState={layerSwitcherState}
              kartlagerDraft={kartlagerDraft}
              onKartlagerDraftChange={handleKartlagerDraftChange}
              layerActivationResetKey={layerActivationResetKey}
              onGroupsDevelopmentActiveChange={
                handleGroupsDevelopmentActiveChange
              }
              moveZoneHostRef={kartlagerMoveZoneHostRef}
            />
          ))}

        {activeTab === "tools" && (
          <MapToolsPanel
            mapTools={mapTools}
            catalogTools={catalogTools}
            toolZones={toolZones}
            activeToolIds={activeToolIds}
            windowPositions={windowPositions}
            windowSizes={windowSizes}
            onUpdateToolZone={updateToolZone}
            onToggleToolActive={toggleToolActive}
            onToolTargetChange={setToolTarget}
            onToolWindowPositionChange={setToolWindowPosition}
            onToolWindowSizeChange={setToolWindowSize}
            flushPendingEditsRef={flushMapToolEditsRef}
            onPendingWindowSizeDirtyChange={setHasPendingWindowSizeInput}
            backgroundImage={backgroundImage}
          />
        )}

        {activeTab === "themes" && mapName && (
          <MapThemesTab mapName={mapName} />
        )}
      </FormActionPanel>
      <DialogWrapper
        fullWidth
        open={isDeleteDialogOpen}
        title={t("maps.deleteTitle")}
        onClose={handleCloseDeleteDialog}
        actions={
          <>
            <Button
              variant="text"
              onClick={handleCloseDeleteDialog}
              color="primary"
              disabled={isDeletingMap}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={isDeletingMap || !isDeleteConfirmNameMatching}
              onClick={() => {
                void handleDeleteMap();
              }}
              startIcon={
                isDeletingMap ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
            >
              {t("maps.delete")}
            </Button>
          </>
        }
      >
        <Typography>
          <Trans
            i18nKey="maps.deleteMapConfirmMessage"
            values={{ name: map?.name ?? "" }}
            components={{ strong: <strong /> }}
          />
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t("maps.deleteMapWarning")}
        </Alert>
        <TextField
          fullWidth
          autoComplete="off"
          margin="normal"
          label={t("maps.deleteMapTypeNameLabel")}
          helperText={
            <Trans
              i18nKey="maps.deleteMapTypeNameHelper"
              values={{ name: map?.name ?? "" }}
              components={{ strong: <strong /> }}
            />
          }
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          disabled={isDeletingMap}
        />
      </DialogWrapper>
      <UnsavedChangesGuard when={mapSettingsDirty} />
    </Page>
  );
}
