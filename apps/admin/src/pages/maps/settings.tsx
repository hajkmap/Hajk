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
import CollectionsIcon from "@mui/icons-material/Collections";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import CookieIcon from "@mui/icons-material/Cookie";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import { FieldValues, useForm } from "react-hook-form";
import {
  useMapByName,
  useUpdateMap,
  useUpdateMapTools,
  useUpdateMapLayers,
  useUpdateMapGroups,
  useDeleteMap,
  useMaps,
  useToolsByMapName,
  useLayersByMapName,
  useGroupsByMapName,
  type MapGroup,
  type MapLayerPlacement,
  type MapGroupPlacement,
} from "../../api/maps";
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
import {
  LayerSwitcherDnD,
  TreeItemData,
  ID_DELIMITER,
} from "../../components/layerswitcher-dnd";
import { useLayers } from "../../api/layers";
import { useGroups } from "../../api/groups";
import MapToolsPanel from "./components/map-tools-panel";
import {
  EMPTY_TOOL_ZONES,
  mapToolsToZones,
  toolZonesSignature,
  zonesToToolsPayload,
  type ToolZones,
} from "./map-tools-utils";
import { useProjections } from "../../api/services";
import useAppStateStore from "../../store/use-app-state-store";
import { TreeItems } from "dnd-kit-sortable-tree";
import { SettingsPageTabs } from "../../components/settings-page-tabs";

const MAP_PAGE_TABS = [
  { key: "settings", labelKey: "common.settings", icon: <SettingsIcon /> },
  { key: "menu", labelKey: "common.layerGroups", icon: <LayersIcon /> },
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

/** Extracts the trailing entity id from a drop-zone item id (`type::id`). */
function entityIdFromItemId(itemId: string | number): string {
  const parts = String(itemId).split(ID_DELIMITER);
  return parts[parts.length - 1];
}

/** Builds a nested group tree (for the drop zone) from GroupsOnMaps rows. */
function buildGroupTree(rows: MapGroup[]): TreeItems<TreeItemData> {
  const byParent = new Map<string | null, MapGroup[]>();
  rows.forEach((row) => {
    const key = row.parentGroupId ?? null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(row);
    else byParent.set(key, [row]);
  });

  const build = (parentPlacementId: string | null): TreeItems<TreeItemData> =>
    (byParent.get(parentPlacementId) ?? []).map((row) => ({
      id: `group${ID_DELIMITER}${row.groupId}`,
      name: row.name,
      type: "group" as const,
      canHaveChildren: true,
      children: build(row.id),
    }));

  return build(null);
}

/** Flattens the layers drop zone into the `PUT /maps/:name/layers` payload. */
function layersToPayload(items: TreeItems<TreeItemData>): MapLayerPlacement[] {
  return items.map((item, index) => ({
    layerId: entityIdFromItemId(item.id),
    zIndex: index,
    visibleAtStart: item.visibleAtStart ?? false,
  }));
}

/** Stable signature for the layers zone (order + visibility), for dirty checks. */
function layersSignature(items: TreeItems<TreeItemData>): string {
  return JSON.stringify(
    items.map((item) => ({
      id: entityIdFromItemId(item.id),
      visibleAtStart: item.visibleAtStart ?? false,
    })),
  );
}

/**
 * Flattens the groups tree into the `PUT /maps/:name/groups` payload. Fresh
 * placement ids are generated each save (the backend fully replaces the set),
 * and nesting is expressed via `parentGroupId`.
 */
function groupTreeToPayload(
  items: TreeItems<TreeItemData>,
): MapGroupPlacement[] {
  const result: MapGroupPlacement[] = [];
  const walk = (
    nodes: TreeItems<TreeItemData>,
    parentPlacementId: string | null,
  ) => {
    nodes.forEach((node) => {
      const placementId = crypto.randomUUID();
      result.push({
        id: placementId,
        groupId: entityIdFromItemId(node.id),
        parentGroupId: parentPlacementId,
      });
      if (node.children?.length) walk(node.children, placementId);
    });
  };
  walk(items, null);
  return result;
}

/** Stable signature for the groups tree (structure + order), for dirty checks. */
function groupsSignature(items: TreeItems<TreeItemData>): string {
  const walk = (
    nodes: TreeItems<TreeItemData>,
    parentGroupId: string | null,
  ): { groupId: string; parent: string | null }[] =>
    nodes.flatMap((node) => {
      const groupId = entityIdFromItemId(node.id);
      return [
        { groupId, parent: parentGroupId },
        ...(node.children?.length ? walk(node.children, groupId) : []),
      ];
    });
  return JSON.stringify(walk(items, null));
}

export default function MapSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mapId } = useParams();
  const { data: maps } = useMaps();
  const mapName = maps?.find((m) => m.id == mapId)?.name;
  const { data: map, isLoading, isError } = useMapByName(mapName ?? "");
  const { mutateAsync: updateMap, status: updateStatus } = useUpdateMap();
  const { mutateAsync: updateMapTools } = useUpdateMapTools();
  const { mutateAsync: updateMapLayers } = useUpdateMapLayers();
  const { mutateAsync: updateMapGroups } = useUpdateMapGroups();
  const { mutateAsync: deleteMap, isPending: isDeletingMap } = useDeleteMap();
  const { palette } = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
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
  const { data: layers = [] } = useLayers();
  const { data: groups = [] } = useGroups();
  const { data: mapTools } = useToolsByMapName(mapName ?? "");
  const { data: mapLayers } = useLayersByMapName(mapName ?? "");
  const { data: mapGroups } = useGroupsByMapName(mapName ?? "");
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

  // Drop zone states
  const [backgroundLayersDZ, setBackgroundLayersDZ] = useState<
    TreeItems<TreeItemData>
  >([]);
  const [groupLayersDZ, setGroupLayersDZ] = useState<TreeItems<TreeItemData>>(
    [],
  );

  // Server baselines for the menu tab (layers placed directly on the map and
  // the map's group placements). Used both to seed the drop zones and to
  // detect unsaved changes.
  const serverLayerItems = useMemo<TreeItems<TreeItemData>>(
    () =>
      (mapLayers ?? [])
        .filter((layer) => layer.mapId != null)
        .slice()
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((layer) => ({
          id: `layer${ID_DELIMITER}${layer.id}`,
          name: layer.name,
          type: "layer" as const,
          canHaveChildren: false,
          visibleAtStart: layer.visibleAtStart ?? false,
        })),
    [mapLayers],
  );
  const serverGroupItems = useMemo<TreeItems<TreeItemData>>(
    () => buildGroupTree(mapGroups ?? []),
    [mapGroups],
  );

  const layersDirtyRaw = useMemo(() => {
    if (!mapName || mapLayers === undefined) return false;
    return (
      layersSignature(backgroundLayersDZ) !== layersSignature(serverLayerItems)
    );
  }, [backgroundLayersDZ, serverLayerItems, mapName, mapLayers]);

  const groupsDirtyRaw = useMemo(() => {
    if (!mapName || mapGroups === undefined) return false;
    return groupsSignature(groupLayersDZ) !== groupsSignature(serverGroupItems);
  }, [groupLayersDZ, serverGroupItems, mapName, mapGroups]);

  const [menuSynced, setMenuSynced] = useState(false);

  useEffect(() => {
    setMenuSynced(false);
  }, [mapName]);

  useEffect(() => {
    if (!mapName || mapLayers === undefined || mapGroups === undefined) {
      return;
    }
    if (!menuSynced) {
      setBackgroundLayersDZ(serverLayerItems);
      setGroupLayersDZ(serverGroupItems);
      setMenuSynced(true);
      return;
    }
    if (layersDirtyRaw || groupsDirtyRaw) {
      return;
    }
    setBackgroundLayersDZ(serverLayerItems);
    setGroupLayersDZ(serverGroupItems);
  }, [
    mapName,
    mapLayers,
    mapGroups,
    serverLayerItems,
    serverGroupItems,
    menuSynced,
    layersDirtyRaw,
    groupsDirtyRaw,
  ]);

  const layersDirty = menuSynced && layersDirtyRaw;
  const groupsDirty = menuSynced && groupsDirtyRaw;
  const serverToolZones = useMemo(
    () => (mapTools ? mapToolsToZones(mapTools) : null),
    [mapTools],
  );
  const [toolsDraft, setToolsDraft] = useState<{
    mapName: string;
    zones: ToolZones;
  } | null>(null);

  const toolZones =
    toolsDraft != null && toolsDraft.mapName === mapName
      ? toolsDraft.zones
      : (serverToolZones ?? EMPTY_TOOL_ZONES);

  // True when the local tool placement draft differs from what the server has.
  const toolsDirty = useMemo(() => {
    if (toolsDraft == null || toolsDraft.mapName !== mapName) return false;
    return (
      toolZonesSignature(toolsDraft.zones) !==
      toolZonesSignature(serverToolZones ?? EMPTY_TOOL_ZONES)
    );
  }, [toolsDraft, mapName, serverToolZones]);

  const updateToolZone = useCallback(
    (zone: keyof ToolZones, items: TreeItems<TreeItemData>) => {
      setToolsDraft((prev) => {
        const base =
          prev != null && prev.mapName === mapName
            ? prev.zones
            : (serverToolZones ?? EMPTY_TOOL_ZONES);

        return {
          mapName: mapName ?? "",
          zones: { ...base, [zone]: items },
        };
      });
    },
    [mapName, serverToolZones],
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

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    values: formBaseline ?? undefined,
  });

  const handleUpdateMap = async (formData: FieldValues) => {
    if (!map) return;

    try {
      // Persist placements first (keyed by the current name) so a simultaneous
      // rename doesn't target a no-longer-existing map name.
      if (toolsDirty && toolsDraft && mapTools) {
        await updateMapTools({
          mapName: map.name,
          tools: zonesToToolsPayload(toolsDraft.zones, mapTools),
        });
        setToolsDraft(null);
      }

      if (layersDirty) {
        await updateMapLayers({
          mapName: map.name,
          layers: layersToPayload(backgroundLayersDZ),
        });
      }

      if (groupsDirty) {
        await updateMapGroups({
          mapName: map.name,
          groups: groupTreeToPayload(groupLayersDZ),
        });
      }

      if (isDirty) {
        const payload = buildMapUpdatePayload(formData, map);
        await updateMap({
          mapName: map.name,
          data: payload,
        });
        setCommittedFormBaseline(formData);
      }
      toast.success(t("maps.updateMapSuccess", { name: map.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Failed to update map:", error);
      toast.error(t("maps.updateMapFailed", { name: map.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
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
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={map?.createdBy}
        createdDate={map?.createdDate}
        lastSavedBy={map?.lastSavedBy}
        lastSavedDate={map?.lastSavedDate}
        isDirty={isDirty || toolsDirty || layersDirty || groupsDirty}
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
              void handleSubmit((data: FieldValues) => {
                void handleUpdateMap(data);
              })(e);
            }}
            formRef={formRef}
            noValidate={false}
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
          (mapLayers === undefined || mapGroups === undefined ? (
            <SquareSpinnerComponent />
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <LayerSwitcherDnD
                  layers={layers}
                  showSourceLayerStatus
                  dropZones={[
                    {
                      id: "layers",
                      title: t("map.layerStructure.directLayers.title"),
                      helpText: t("map.layerStructure.directLayers.help"),
                      clientBucketLabel: t(
                        "map.layerStructure.directLayers.clientBucket",
                      ),
                      titleIcon: <LayersIcon />,
                      items: backgroundLayersDZ,
                      onItemsChange: setBackgroundLayersDZ,
                      showLayerPlacementStatus: true,
                      acceptedItemTypes: ["layer"],
                      allowNesting: false,
                    },
                  ]}
                />
                <LayerSwitcherDnD
                  groups={groups}
                  dropZones={[
                    {
                      id: "groups",
                      title: t("map.layerStructure.layerGroups.title"),
                      helpText: t("map.layerStructure.layerGroups.help"),
                      clientBucketLabel: t(
                        "map.layerStructure.layerGroups.clientBucket",
                      ),
                      titleIcon: <CollectionsIcon />,
                      items: groupLayersDZ,
                      onItemsChange: setGroupLayersDZ,
                      acceptedItemTypes: ["group"],
                      allowNesting: true,
                    },
                  ]}
                />
              </Box>
            </>
          ))}

        {activeTab === "tools" && (
          <MapToolsPanel
            mapTools={mapTools}
            toolZones={toolZones}
            onUpdateToolZone={updateToolZone}
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
    </Page>
  );
}
