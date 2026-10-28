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
  IconButton,
  type SxProps,
  type Theme,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import BuildIcon from "@mui/icons-material/Build";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MapIcon from "@mui/icons-material/Map";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import PaletteIcon from "@mui/icons-material/Palette";
import CookieIcon from "@mui/icons-material/Cookie";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { FieldValues, useForm, useWatch } from "react-hook-form";
import {
  useMapByName,
  useUpdateMap,
  useUpdateMapTools,
  useDeleteMap,
  useMaps,
  useToolsByMapName,
} from "../../api/maps";
import DialogWrapper from "../../components/flexible-dialog";
import {
  buildMapSettingsFormValues,
  buildMapUpdatePayload,
} from "./map-settings-form-values";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import PresenceNotice from "../../components/presence-notice";
import { toast } from "react-toastify";
import { HttpError } from "../../lib/http-error";
import FormContainer from "../../components/form-components/form-container";
import MapSettingsForm, {
  type MapSettingsSection,
} from "./components/map-settings-form";
import MapContentPanel from "./components/map-content-panel";
import { useTools } from "../../api/tools";
import type { ToolWindowPosition, ToolZone } from "../../api/maps";
import MapToolsPanel from "./components/map-tools-panel";
import type { MapControlVisibility } from "./components/map-tools-list";
import {
  EMPTY_TOOL_ZONES,
  buildToolTypesById,
  buildToolsDraftState,
  getCatalogToolDisplayName,
  getMapToolFieldConfig,
  getToolDisplayName,
  isToolsDraftDirty,
  mapToolsToZones,
  activeColumnOrder,
  applyOrderedToolsToZones,
  moveToolToZone,
  removeToolFromZones,
  targetToZoneKey,
  toolIdFromZoneItemId,
  zonesToToolsPayload,
  type MapToolsDraftState,
  type ToolWindowSize,
  type ToolZones,
} from "./map-tools-utils";
import {
  findNextAvailableToolIndex,
  findToolPlacement,
  getTakenIndexesForPlacement,
} from "./tool-placement-indexes";
import { type ToolColumnOrder } from "./map-tools-layout";
import { useProjections } from "../../api/services";
import { isLayerTreeConflict } from "../../api/layer-tree";
import { usePresence } from "../../api/presence";
import useAppStateStore from "../../store/use-app-state-store";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";
import {
  isLayerTreeDraftFor,
  LayerTreeConflictDialog,
  useSaveLayerTree,
  type LayerTreeDraft,
} from "../../components/layer-tree-editor";

const MAP_PAGE_TABS = [
  { key: "settings", labelKey: "common.settings", icon: <SettingsIcon /> },
  { key: "menu", labelKey: "maps.tab.mapContent", icon: <LayersIcon /> },
  { key: "tools", labelKey: "common.tools", icon: <BuildIcon /> },
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
  indexes: Record<number, number>;
  inactiveTargets: Record<number, ToolZone>;
}

export default function MapSettings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mapId } = useParams();
  const { data: maps } = useMaps();
  const mapIdNumber = mapId != null ? Number(mapId) : NaN;
  const mapName = maps?.find((m) => m.id === mapIdNumber)?.name;
  const { data: map, isLoading, isError } = useMapByName(mapName ?? "");
  const { mutateAsync: updateMap, status: updateStatus } = useUpdateMap();
  const { mutateAsync: updateMapTools } = useUpdateMapTools();
  const { mutateAsync: deleteMap, isPending: isDeletingMap } = useDeleteMap();
  const { palette } = useTheme();
  const [deleteWarningExpanded, setDeleteWarningExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const saveInFlightRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "settings") as
    | "menu"
    | "settings"
    | "tools";
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
  const [settingFocus, setSettingFocus] = useState<{
    field: string;
    tick: number;
  } | null>(null);
  const locateMapSetting = (setting: {
    section: "controls" | "content";
    field: string;
  }) => {
    setSettingFocus((current) => ({
      field: setting.field,
      tick: (current?.tick ?? 0) + 1,
    }));
    setSettingsSection(setting.section);
  };
  const showSettingsSearchUi =
    activeTab === "settings" && settingsSection === "search";
  const settingsSearchTerm = showSettingsSearchUi ? settingsSearchQuery : "";
  const { data: mapTools } = useToolsByMapName(mapName ?? "");
  const { data: catalogTools } = useTools();
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

  // The map's layer tree, saved with the rest of the map (see handleUpdateMap).
  const [layerTreeDraft, setLayerTreeDraft] = useState<LayerTreeDraft | null>(
    null,
  );
  const { save: saveLayerTree } = useSaveLayerTree();
  /** Someone else saved the tree meanwhile, so its save was refused. */
  const [layerTreeConflict, setLayerTreeConflict] = useState(false);
  const layerTreeDirty = isLayerTreeDraftFor(layerTreeDraft, "map", mapName);

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
  const [mapLayersMoveZoneVisible, setMapLayersMoveZoneVisible] =
    useState(false);
  const mapLayersMoveZoneHostRef = useRef<HTMLDivElement | null>(null);

  // With Lagerordning open, the move zone has its place by the save button.
  const handleLayerTreeOpenChange = useCallback((active: boolean) => {
    setMapLayersMoveZoneVisible(active);
    if (!active) {
      setDeleteWarningExpanded(false);
    }
  }, []);

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

  const indexes =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.indexes
      : (serverToolsDraftState?.indexes ?? {});

  const toolTypesById = useMemo(
    () => buildToolTypesById(catalogTools ?? [], mapTools ?? []),
    [catalogTools, mapTools],
  );

  const toolsDirty = useMemo(() => {
    if (toolsDraft == null || toolsDraft.mapName !== mapName || !mapTools) {
      return false;
    }
    return isToolsDraftDirty(mapTools, toolsDraft, toolTypesById);
  }, [toolsDraft, mapName, mapTools, toolTypesById]);

  const resolveToolsDraft = useCallback(
    (prev: ToolsDraft | null): ToolsDraft => {
      if (prev != null && prev.mapName === mapName) return prev;

      return {
        mapName: mapName ?? "",
        zones: serverToolZones ?? EMPTY_TOOL_ZONES,
        activeToolIds: new Set<number>(
          serverToolsDraftState?.activeToolIds ?? [],
        ),
        windowPositions: { ...(serverToolsDraftState?.windowPositions ?? {}) },
        windowSizes: { ...(serverToolsDraftState?.windowSizes ?? {}) },
        indexes: { ...(serverToolsDraftState?.indexes ?? {}) },
        inactiveTargets: { ...(serverToolsDraftState?.inactiveTargets ?? {}) },
      };
    },
    [mapName, serverToolZones, serverToolsDraftState],
  );

  const resolveToolName = useCallback(
    (toolId: number) => {
      const catalogTool = catalogTools?.find(
        (tool) => Number(tool.id) === toolId,
      );
      if (catalogTool) return getCatalogToolDisplayName(catalogTool);

      const mapTool = mapTools?.find((tool) => tool.toolId === toolId);
      if (mapTool) return getToolDisplayName(mapTool);

      return String(toolId);
    },
    [catalogTools, mapTools],
  );

  const toggleToolActive = useCallback(
    (toolId: number, active: boolean) => {
      setToolsDraft((prev) => {
        const base = resolveToolsDraft(prev);
        const nextActiveToolIds = new Set(base.activeToolIds);
        let nextZones = base.zones;
        const nextWindowPositions = { ...base.windowPositions };
        const nextWindowSizes = { ...base.windowSizes };
        const nextIndexes = { ...base.indexes };
        const nextInactiveTargets = { ...base.inactiveTargets };
        const mapToolIds = new Set(
          (mapTools ?? []).map((tool) => tool.toolId),
        );

        const clearDraftOnlyToolMeta = (id: number) => {
          // Tools never persisted on the map should leave no draft residue so
          // toggling Active back to the server value clears Save dirty state.
          if (mapToolIds.has(id) || nextInactiveTargets[id] != null) return;
          delete nextWindowPositions[id];
          delete nextWindowSizes[id];
          delete nextIndexes[id];
        };

        const deactivateTool = (id: number) => {
          nextActiveToolIds.delete(id);
          delete nextInactiveTargets[id];
          nextZones = removeToolFromZones(nextZones, id);
          clearDraftOnlyToolMeta(id);
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
          const fields = getMapToolFieldConfig(toolType);
          if (fields.windowPosition && !nextWindowPositions[toolId]) {
            nextWindowPositions[toolId] = "right";
          }
          if (fields.index) {
            nextIndexes[toolId] ??= 0;
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

          const placement = findToolPlacement(
            toolId,
            nextZones,
            nextActiveToolIds,
          );
          const currentIndex = nextIndexes[toolId];
          if (placement !== "" && currentIndex != null) {
            const taken = getTakenIndexesForPlacement(
              placement,
              nextIndexes,
              nextZones,
              nextActiveToolIds,
              toolTypesById,
              toolId,
              mapTools ?? [],
            );
            if (taken.has(currentIndex)) {
              nextIndexes[toolId] = findNextAvailableToolIndex(
                currentIndex,
                1,
                taken,
              );
            }
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
          indexes: nextIndexes,
          inactiveTargets: nextInactiveTargets,
        };
      });
    },
    [
      mapName,
      mapTools,
      resolveToolsDraft,
      resolveToolName,
      toolTypesById,
    ],
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
          indexes: { ...base.indexes },
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
        indexes: { ...base.indexes },
        inactiveTargets: { ...base.inactiveTargets },
      });
    },
    [mapName, resolveToolsDraft, applyToolsDraft],
  );

  const addToolToPlacement = useCallback(
    (toolId: number, target: ToolZone) => {
      const base = resolveToolsDraft(toolsDraftRef.current);
      const nextActiveToolIds = new Set(base.activeToolIds);
      let nextZones = base.zones;
      const nextWindowPositions = { ...base.windowPositions };
      const nextWindowSizes = { ...base.windowSizes };
      const nextIndexes = { ...base.indexes };
      const nextInactiveTargets = { ...base.inactiveTargets };
      const mapToolIds = new Set((mapTools ?? []).map((tool) => tool.toolId));

      const clearDraftOnlyToolMeta = (id: number) => {
        if (mapToolIds.has(id) || nextInactiveTargets[id] != null) return;
        delete nextWindowPositions[id];
        delete nextWindowSizes[id];
        delete nextIndexes[id];
      };

      const deactivateTool = (id: number) => {
        nextActiveToolIds.delete(id);
        delete nextInactiveTargets[id];
        nextZones = removeToolFromZones(nextZones, id);
        clearDraftOnlyToolMeta(id);
      };

      const toolType = toolTypesById.get(toolId) ?? "";
      const fields = getMapToolFieldConfig(toolType);
      if (toolType) {
        for (const activeId of [...nextActiveToolIds]) {
          if (activeId !== toolId && toolTypesById.get(activeId) === toolType) {
            deactivateTool(activeId);
          }
        }
      }

      nextActiveToolIds.add(toolId);
      delete nextInactiveTargets[toolId];

      if (fields.windowPosition && !nextWindowPositions[toolId]) {
        nextWindowPositions[toolId] = "right";
      }

      if (fields.target) {
        nextZones = moveToolToZone(
          nextZones,
          toolId,
          resolveToolName(toolId),
          targetToZoneKey(target),
        );

        const zoneKey = targetToZoneKey(target);
        let maxIndex = -1;
        for (const item of nextZones[zoneKey]) {
          const id = toolIdFromZoneItemId(item.id);
          if (id === toolId || !Number.isFinite(id)) continue;
          const index = nextIndexes[id];
          if (index != null && index > maxIndex) maxIndex = index;
        }
        nextIndexes[toolId] = maxIndex + 1;
      }

      applyToolsDraft({
        mapName: mapName ?? "",
        zones: nextZones,
        activeToolIds: nextActiveToolIds,
        windowPositions: nextWindowPositions,
        windowSizes: nextWindowSizes,
        indexes: nextIndexes,
        inactiveTargets: nextInactiveTargets,
      });
    },
    [
      applyToolsDraft,
      mapName,
      mapTools,
      resolveToolName,
      resolveToolsDraft,
      toolTypesById,
    ],
  );

  const commitToolColumns = useCallback(
    (orderedByZone: ToolColumnOrder) => {
      const base = resolveToolsDraft(toolsDraftRef.current);
      const nextIndexes = { ...base.indexes };
      const nextActive = new Set(base.activeToolIds);
      const nextInactive = { ...base.inactiveTargets };
      const previous = activeColumnOrder(
        base.zones,
        base.activeToolIds,
        base.indexes,
      );

      (Object.keys(orderedByZone) as ToolZone[]).forEach((zone) => {
        const nextIds = orderedByZone[zone];
        const previousIds = previous[zone];
        const unchanged =
          previousIds.length === nextIds.length &&
          previousIds.every((toolId, index) => toolId === nextIds[index]);

        nextIds.forEach((toolId, index) => {
          if (!unchanged) nextIndexes[toolId] = index;
          nextActive.add(toolId);
          delete nextInactive[toolId];
        });
      });

      applyToolsDraft({
        mapName: mapName ?? "",
        zones: applyOrderedToolsToZones(orderedByZone, resolveToolName),
        activeToolIds: nextActive,
        windowPositions: { ...base.windowPositions },
        windowSizes: { ...base.windowSizes },
        indexes: nextIndexes,
        inactiveTargets: nextInactive,
      });
    },
    [applyToolsDraft, mapName, resolveToolName, resolveToolsDraft],
  );

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

  const cookieButtonOn =
    useWatch({ control, name: "options.showCookieNoticeButton" }) === true;
  const userAvatarOn =
    useWatch({ control, name: "options.showUserAvatar" }) === true;
  const introductionButtonOn =
    useWatch({
      control,
      name: "options.introductionShowControlButton",
    }) === true;
  const mapResetterOn =
    useWatch({ control, name: "options.mapresetter" }) === true;
  const mapSelectorOn =
    useWatch({ control, name: "options.mapselector" }) === true;
  const mapSelectorIsButton =
    useWatch({ control, name: "options.mapSelectorStyle" }) !== "dropdown";
  const mapCleanerOn =
    useWatch({ control, name: "options.mapcleaner" }) === true;
  const themeTogglerOn =
    useWatch({ control, name: "options.showThemeToggler" }) === true;
  const recentPluginsOn =
    useWatch({ control, name: "options.showRecentlyUsedPlugins" }) === true;
  const mapControls = useMemo<MapControlVisibility>(
    () => ({
      showCookieNoticeButton: cookieButtonOn,
      showUserAvatar: userAvatarOn,
      showIntroductionButton: introductionButtonOn,
      mapresetter: mapResetterOn,
      showMapSelectorButton: mapSelectorOn && mapSelectorIsButton,
      mapcleaner: mapCleanerOn,
      showThemeToggler: themeTogglerOn,
      showRecentlyUsedPlugins: recentPluginsOn,
    }),
    [
      cookieButtonOn,
      introductionButtonOn,
      mapCleanerOn,
      mapSelectorIsButton,
      mapResetterOn,
      mapSelectorOn,
      recentPluginsOn,
      themeTogglerOn,
      userAvatarOn,
    ],
  );

  const mapSettingsDirty = useMemo(
    () => isDirty || toolsDirty || hasPendingWindowSizeInput || layerTreeDirty,
    [isDirty, toolsDirty, hasPendingWindowSizeInput, layerTreeDirty],
  );

  // Spara saves every tab's changes: the tabs that have some are marked, and
  // named under the button.
  const unsavedTabs: Record<(typeof MAP_PAGE_TABS)[number]["key"], boolean> = {
    settings: isDirty,
    menu: layerTreeDirty,
    tools: toolsDirty || hasPendingWindowSizeInput,
  };
  const unsavedTabNames = MAP_PAGE_TABS.filter(
    (tab) => unsavedTabs[tab.key],
  ).map((tab) => t(tab.labelKey));

  // Told to the other tabs on this map from every tab of the page; their tree
  // changes are shown in the tree, the rest by the save button on the tabs
  // without the tree.
  const presenceResource = mapName
    ? { type: "map" as const, id: mapName }
    : null;
  const { data: presence } = usePresence(presenceResource, [
    ...(layerTreeDirty ? (["tree"] as const) : []),
    ...(isDirty ? (["settings"] as const) : []),
    ...(toolsDirty || hasPendingWindowSizeInput ? (["tools"] as const) : []),
  ]);
  const presenceNotice = (
    placement: "tree" | "sidebar",
    sx?: SxProps<Theme>,
  ) =>
    presenceResource ? (
      <PresenceNotice
        resource={presenceResource}
        presence={presence}
        placement={placement}
        draft={layerTreeDraft}
        onReload={() => setLayerTreeDraft(null)}
        sx={sx}
      />
    ) : null;

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
        isToolsDraftDirty(mapTools, currentToolsDraft, toolTypesById);

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
          currentToolsDraft.indexes,
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

      // Before the map's own fields, like the tools: saved after a rename it
      // would go to the old name. A tree someone else has saved meanwhile is
      // refused, but the rest is still saved.
      let treeRefused = false;
      if (layerTreeDirty && layerTreeDraft) {
        try {
          await saveLayerTree(layerTreeDraft);
          setLayerTreeDraft(null);
          didSave = true;
        } catch (error) {
          if (!isLayerTreeConflict(error)) throw error;
          treeRefused = true;
          setLayerTreeConflict(true);
        }
      }

      if (isDirty) {
        const payload = buildMapUpdatePayload(formData, map);
        await updateMap({
          mapName: map.name,
          data: payload,
        });
        setCommittedFormBaseline(formData);
        didSave = true;
        // A refused draft follows the map's new name, so it still counts as
        // unsaved.
        const newName = payload.name;
        if (treeRefused && newName && newName !== map.name) {
          setLayerTreeDraft((draft) =>
            draft ? { ...draft, ownerId: newName } : draft,
          );
        }
      }

      if (didSave) {
        toast.success(
          t(
            treeRefused
              ? "maps.updateMapSuccessExceptTree"
              : "maps.updateMapSuccess",
            { name: map.name },
          ),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          },
        );
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
        tabs={MAP_PAGE_TABS.map((tab) => ({
          ...tab,
          unsaved: unsavedTabs[tab.key],
        }))}
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
        saveNote={
          unsavedTabNames.length > 0
            ? t("maps.unsavedTabs", {
                tabs: new Intl.ListFormat(i18n.language, {
                  type: "conjunction",
                }).format(unsavedTabNames),
              })
            : undefined
        }
        notice={mapLayersMoveZoneVisible ? null : presenceNotice("sidebar")}
        sidebarExtra={
          mapLayersMoveZoneVisible || activeTab === "tools" ? (
            <Box
              ref={mapLayersMoveZoneHostRef}
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
            {mapLayersMoveZoneVisible || activeTab === "tools" ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <IconButton
                    size="small"
                    color={map.locked ? "info" : "warning"}
                    aria-label={
                      map.locked
                        ? t("maps.deleteLockedWarning")
                        : t("maps.deleteMapWarning")
                    }
                    aria-expanded={deleteWarningExpanded}
                    onClick={() => {
                      setDeleteWarningExpanded((open) => !open);
                    }}
                  >
                    {map.locked ? (
                      <InfoOutlinedIcon fontSize="small" />
                    ) : (
                      <WarningAmberIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
                {deleteWarningExpanded ? (
                  <Alert
                    severity={map.locked ? "info" : "warning"}
                    sx={{
                      mt: 1,
                      alignItems: "flex-start",
                      "& .MuiAlert-message": {
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                        overflowWrap: "anywhere",
                      },
                    }}
                  >
                    {map.locked
                      ? t("maps.deleteLockedWarning")
                      : t("maps.deleteMapWarning")}
                  </Alert>
                ) : null}
              </Box>
            ) : (
              <Alert
                severity={map.locked ? "info" : "warning"}
                sx={{
                  alignItems: "flex-start",
                  "& .MuiAlert-message": {
                    fontSize: "0.8rem",
                    lineHeight: 1.4,
                    overflowWrap: "anywhere",
                  },
                }}
              >
                {map.locked
                  ? t("maps.deleteLockedWarning")
                  : t("maps.deleteMapWarning")}
              </Alert>
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
              highlightField={settingFocus?.field ?? null}
              highlightTick={settingFocus?.tick ?? 0}
            />
          </FormContainer>
        </Box>

        {activeTab === "menu" && (
          <MapContentPanel
            mapName={mapName}
            mapTools={mapTools}
            catalogTools={catalogTools}
            activeToolIds={activeToolIds}
            onLayerTreeOpenChange={handleLayerTreeOpenChange}
            moveZoneHostRef={mapLayersMoveZoneHostRef}
            layerTreeDraft={layerTreeDraft}
            onLayerTreeDraftChange={setLayerTreeDraft}
            notice={presenceNotice("tree", { mt: 1 })}
          />
        )}

        {activeTab === "tools" && (
          <MapToolsPanel
            mapTools={mapTools}
            catalogTools={catalogTools}
            toolZones={toolZones}
            activeToolIds={activeToolIds}
            windowPositions={windowPositions}
            windowSizes={windowSizes}
            indexes={indexes}
            onToggleToolActive={toggleToolActive}
            onAddToolToPlacement={addToolToPlacement}
            onCommitToolColumns={commitToolColumns}
            onToolWindowPositionChange={setToolWindowPosition}
            onToolWindowSizeChange={setToolWindowSize}
            flushPendingEditsRef={flushMapToolEditsRef}
            onPendingWindowSizeDirtyChange={setHasPendingWindowSizeInput}
            moveZoneHostRef={mapLayersMoveZoneHostRef}
            mapControls={mapControls}
            onLocateSetting={locateMapSetting}
          />
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
      <LayerTreeConflictDialog
        mode="map"
        ownerId={map.name}
        open={layerTreeConflict}
        onClose={() => setLayerTreeConflict(false)}
        onReload={() => {
          setLayerTreeConflict(false);
          setLayerTreeDraft(null);
        }}
      />
      <UnsavedChangesGuard when={mapSettingsDirty} />
    </Page>
  );
}
