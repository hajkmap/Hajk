import { useState, useRef, useMemo, useEffect, type ReactElement } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  TextField,
  useTheme,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import LayersIcon from "@mui/icons-material/Layers";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { GridRowId } from "@mui/x-data-grid";
import type { GridRowSelectionModel } from "@mui/x-data-grid";
import {
  isGridRowSelected,
  normalizeRowSelectionModel,
} from "./row-selection-model";
import { Controller, FieldValues, useForm, useWatch } from "react-hook-form";
import UsedInMapsGrid from "./used-in-maps-grid";
import {
  useLayerById,
  useDeleteLayer,
  LayerUpdateInput,
  useUpdateLayer,
  infoClickFormat,
  sortType,
  searchOutputFormat,
  useServiceByLayerId,
  useCreateAndUpdateRoleOnLayer,
  useGetRoleOnLayerByLayerId,
} from "../../api/layers";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import {
  useServices,
  useServiceCapabilities,
  SERVICE_TYPE,
} from "../../api/services";
import AvailableLayersGrid from "./available-layers-grid";
import { useRoles } from "../../api/users";
import { HttpError } from "../../lib/http-error";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import LayerInfoClickModal from "./components/layer-infoclick-modal";
import EditingLayerSettings from "./components/editing-layer-settings";
import {
  defaultEditingGeometryTypes,
  geometryTypesFromOptions,
} from "./types/editing-layer";
import DialogWrapper from "../../components/flexible-dialog";
import type { EditableFieldConfig } from "./types/editing-layer";
import type { EditingGeometryTypes } from "./types/editing-layer";
import { buildLayerUpdatePayload } from "../../api/layers/build-layer-payload";
import {
  getLayerCategoryFromPathname,
  getLayerSettingsVisibility,
  LayerSettingsTab,
  normalizeLayerCategory,
} from "./layer-category";
import {
  buildLayerSettingsFormValues,
  getLayerGeometryField,
  resolveGeometryFieldFromPayload,
} from "./layer-settings-form-values";
import {
  FieldLabelAbove,
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../components/form-components/field-label-with-help";
import FormFieldGrid, { FormFieldRow } from "../../components/form-components/form-field-grid";
import SearchablePanel from "../../components/form-components/searchable-panel";
import { SettingsSearchField } from "../../components/form-components/searchable-field";
import { useSettingsSearchLabels } from "../../hooks/use-settings-search-labels";
import { useLayerFieldLabels } from "./use-layer-field-labels";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";

const ALL_SETTINGS_TABS: {
  key: LayerSettingsTab;
  labelKey: string;
  icon: ReactElement;
}[] = [
  { key: "general", labelKey: "common.settings", icon: <SettingsIcon /> },
  { key: "display", labelKey: "layers.display", icon: <TuneIcon /> },
  {
    key: "metadata",
    labelKey: "layers.metadataTab",
    icon: <InfoOutlinedIcon />,
  },
  { key: "infoclick", labelKey: "common.infoclick", icon: <TouchAppIcon /> },
  {
    key: "editing",
    labelKey: "layers.editing.tab",
    icon: <EditNoteIcon />,
  },
  {
    key: "layers",
    labelKey: "layers.availableLayers",
    icon: <LayersIcon />,
  },
  {
    key: "search",
    labelKey: "common.searchSettings",
    icon: <ManageSearchIcon />,
  },
];

export default function LayerSettings() {
  const { t } = useTranslation();
  const settingsSearchLabels = useSettingsSearchLabels();
  const { fieldLabel } = useLayerFieldLabels();
  const { layerId } = useParams<{ layerId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromService = searchParams.get("fromService");
  const { data: layer, isLoading, isError } = useLayerById(layerId ?? "");
  const { mutateAsync: updateLayer, status: updateStatus } = useUpdateLayer();
  const { mutateAsync: createRoleOnLayer } = useCreateAndUpdateRoleOnLayer();
  const { mutateAsync: removeLayer, isPending: isDeletingLayer } =
    useDeleteLayer(layer?.serviceId ?? fromService ?? "");
  const queryClient = useQueryClient();
  const { palette } = useTheme();
  const { data: services } = useServices();
  const { data: roles } = useRoles();
  const { data: roleOnLayer } = useGetRoleOnLayerByLayerId(layerId ?? "");

  const formRef = useRef<HTMLFormElement | null>(null);
  const { data: service, isLoading: serviceLoading } = useServiceByLayerId(
    layer?.id ?? "",
    !!layer?.id,
  );

  const handleCancelNewLayer =
    fromService && layerId
      ? async () => {
          await removeLayer(layerId);
          void navigate(`/services/${fromService}?tab=layers`);
        }
      : undefined;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDeletingLayer) return;
    event.preventDefault();
    event.stopPropagation();
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingLayer) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmNameMatching =
    Boolean(layer?.name) && deleteConfirmName === layer?.name;

  const getLayersListPath = () => {
    const category = getLayerCategoryFromPathname(location.pathname);
    if (category === "search") return "/search-layers";
    if (category === "editing") return "/editing-layers";
    return "/display-layers";
  };

  const handleConfirmDelete = async () => {
    if (!layer?.id || !layer.name || !isDeleteConfirmNameMatching) return;
    try {
      await removeLayer(layer.id);
      toast.success(t("layers.deleteLayerSuccess", { name: layer.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      handleCloseDeleteDialog();
      if (fromService) {
        void navigate(`/services/${fromService}?tab=layers`);
      } else {
        void navigate(getLayersListPath());
      }
    } catch (error) {
      console.error("Failed to delete layer:", error);
      toast.error(t("layers.deleteLayerFailed", { name: layer.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  const tabFromUrl = searchParams.get("tab") as LayerSettingsTab | null;

  const layerCategory = useMemo(
    () =>
      getLayerCategoryFromPathname(location.pathname) ??
      normalizeLayerCategory(layer?.layerKind),
    [location.pathname, layer?.layerKind],
  );

  const settingsVisibility = useMemo(
    () => getLayerSettingsVisibility(layerCategory),
    [layerCategory],
  );

  const visibleTabs = useMemo(
    () =>
      ALL_SETTINGS_TABS.filter((tab) =>
        settingsVisibility.tabs.includes(tab.key),
      ),
    [settingsVisibility.tabs],
  );

  const activeTab =
    tabFromUrl && settingsVisibility.tabs.includes(tabFromUrl)
      ? tabFromUrl
      : settingsVisibility.tabs[0];
  const setActiveTab = (tab: LayerSettingsTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    if (tabFromUrl && !settingsVisibility.tabs.includes(tabFromUrl)) {
      setSearchParams({ tab: settingsVisibility.tabs[0] }, { replace: true });
    }
  }, [tabFromUrl, settingsVisibility.tabs, setSearchParams]);
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");
  const showSettingsSearchUi = activeTab === "search";
  const showGeneralTab = activeTab === "general" || showSettingsSearchUi;
  const showDisplayTab = activeTab === "display" || showSettingsSearchUi;
  const showMetadataTab = activeTab === "metadata" || showSettingsSearchUi;
  const showInfoclickTab = activeTab === "infoclick" || showSettingsSearchUi;
  const showEditingTab = activeTab === "editing" || showSettingsSearchUi;
  const settingsSearchTerm = showSettingsSearchUi ? settingsSearchQuery : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectGridId, setSelectGridId] = useState<GridRowSelectionModel>();
  const [useCustomDpiList, setUseCustomDpiList] = useState<boolean>(false);
  const [customDpiList, setCustomDpiList] = useState<
    { pxRatio: number; dpi: number }[]
  >([
    { pxRatio: 0, dpi: 90 },
    { pxRatio: 2, dpi: 180 },
  ]);
  const [editingGeometryTypes, setEditingGeometryTypes] =
    useState<EditingGeometryTypes>(defaultEditingGeometryTypes());
  const [editingEditableFields, setEditingEditableFields] = useState<
    EditableFieldConfig[]
  >([]);
  const [editingNonEditableFields, setEditingNonEditableFields] = useState<
    EditableFieldConfig[]
  >([]);
  const {
    layers: getCapLayers,
    styles: getCapStyles,
    isError: capabilitiesError,
    isLoading: capabilitiesLoading,
    refetch: refetchCapabilities,
  } = useServiceCapabilities({
    baseUrl: service?.url ?? "",
    type:
      service?.type === SERVICE_TYPE.WMS
        ? SERVICE_TYPE.WMS
        : service?.type === SERVICE_TYPE.WMTS
          ? SERVICE_TYPE.WMS
          : service?.type === SERVICE_TYPE.WFS
            ? SERVICE_TYPE.WFS
            : service?.type === SERVICE_TYPE.WFST
              ? SERVICE_TYPE.WFS
              : service?.type === SERVICE_TYPE.VECTOR
                ? SERVICE_TYPE.WFS
                : service?.type,
  });

  const styles = layer?.selectedLayers.flatMap(
    (key) => getCapStyles[key] || [],
  );
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const layerFormBaseline = useMemo(
    () =>
      layer ? buildLayerSettingsFormValues(layer, roleOnLayer?.roleId) : null,
    [layer, roleOnLayer?.roleId],
  );

  const layerEditingDefaults = useMemo(() => {
    if (!layer) return null;
    const opts =
      layer.options &&
      typeof layer.options === "object" &&
      !Array.isArray(layer.options)
        ? layer.options
        : {};
    return {
      geometryTypes: geometryTypesFromOptions(opts),
      editableFields: Array.isArray(opts.editableFields)
        ? (opts.editableFields as EditableFieldConfig[])
        : [],
      nonEditableFields: Array.isArray(opts.nonEditableFields)
        ? (opts.nonEditableFields as EditableFieldConfig[])
        : [],
    };
  }, [layer]);

  const layerFormSyncKey = layer
    ? `${layer.id}:${roleOnLayer?.roleId ?? ""}`
    : null;

  const [committedFormBaseline, setCommittedFormBaseline] =
    useState<FieldValues | null>(null);
  const [syncedLayerFormKey, setSyncedLayerFormKey] = useState<string | null>(
    null,
  );

  if (layerFormSyncKey !== syncedLayerFormKey) {
    setSyncedLayerFormKey(layerFormSyncKey);
    setCommittedFormBaseline(null);
    if (layerEditingDefaults) {
      setEditingGeometryTypes(layerEditingDefaults.geometryTypes);
      setEditingEditableFields(layerEditingDefaults.editableFields);
      setEditingNonEditableFields(layerEditingDefaults.nonEditableFields);
    }
  }

  const formBaseline = committedFormBaseline ?? layerFormBaseline;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    values: formBaseline ?? undefined,
  });

  const watchRoleIdInput = useWatch({ control, name: "roleId" }) as
    | string
    | undefined;
  const watchGeometryField = useWatch({
    control,
    name: "searchSettings.geometryField",
  }) as string | undefined;
  const watchSingleTile = useWatch({ control, name: "singleTile" }) as
    | boolean
    | undefined;

  const normalizedSelection = useMemo(
    () => normalizeRowSelectionModel(selectGridId),
    [selectGridId],
  );

  const filteredLayers = useMemo(() => {
    if (!getCapLayers) return [];

    const searchAndSelectedFilteredLayers = getCapLayers
      .map((layer, index) => {
        const isSelected = isGridRowSelected(index, normalizedSelection);
        return {
          id: index,
          layer,
          infoClick: "",
          publications: "",
          selected: isSelected,
        };
      })
      .filter(
        (layer) =>
          layer?.selected || // Disable lint here since ?? is messing with the data-grid search logic
          layer.layer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        const aMatches = a.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const bMatches = b.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    return searchAndSelectedFilteredLayers;
  }, [getCapLayers, searchTerm, normalizedSelection]);

  const selectedRowsData = useMemo(() => {
    if (!normalizedSelection) return undefined;

    const selectedIds: GridRowId[] =
      normalizedSelection.type === "include"
        ? Array.from(normalizedSelection.ids)
        : filteredLayers
            .map((row) => row.id)
            .filter((id) => !normalizedSelection.ids.has(id));

    return selectedIds.map((id) => filteredLayers.find((row) => row.id === id));
  }, [normalizedSelection, filteredLayers]);

  const selectedRowObjects = useMemo(
    () => selectedRowsData?.map((row) => row?.layer ?? ""),
    [selectedRowsData],
  );

  const selectedLayersDirty = useMemo(() => {
    if (selectGridId === undefined) return false;
    const saved = [...(layer?.selectedLayers ?? [])].sort();
    const current = [...(selectedRowObjects ?? [])].filter(Boolean).sort();
    if (saved.length !== current.length) return true;
    return saved.some((value, index) => value !== current[index]);
  }, [layer?.selectedLayers, selectedRowObjects, selectGridId]);

  const [openInfoClickModal, setOpenInfoClickModal] = useState(false);
  const [selectedInfoClickLayer, setSelectedInfoClickLayer] =
    useState<string>("");

  const handleLayerClick = (layerName: string) => {
    setSelectedInfoClickLayer(layerName);
    setOpenInfoClickModal(true);
  };

  const handleCloseModal = () => {
    setOpenInfoClickModal(false);
    setSelectedInfoClickLayer("");
  };

  const handleSaveLayerInfoClick = async (data: {
    caption?: string;
    legendUrl?: string;
    legendIcon?: string;
    style?: string;
    queryable?: boolean;
    infoclickIcon?: string;
    searchDisplayName?: string;
    secondaryLabelFields?: string;
    searchShortDisplayName?: string;
    searchUrl?: string;
    searchPropertyName?: string;
    searchOutputFormat?: string;
    searchGeometryField?: string;
    definition?: string;
    format: string;
    sortProperty?: string;
    sortMethod: string;
    sortDescending: boolean;
  }) => {
    // Store per-layer-instance settings in layer.options.layersInfo
    if (!layer) return;

    // Get existing layersInfo from options or initialize empty object
    const existingLayersInfo =
      (layer.options?.layersInfo as Record<
        string,
        {
          caption?: string;
          legendUrl?: string;
          legendIcon?: string;
          style?: string;
          queryable?: boolean;
          infoclickIcon?: string;
          searchDisplayName?: string;
          secondaryLabelFields?: string;
          searchShortDisplayName?: string;
          searchUrl?: string;
          searchPropertyName?: string;
          searchOutputFormat?: string;
          searchGeometryField?: string;
          definition?: string;
          format?: string;
          sortProperty?: string;
          sortMethod?: string;
          sortDescending?: boolean;
        }
      >) ?? {};

    // Update only the selected layer's settings
    // Merge with existing settings for this layer instance to preserve unchanged fields
    const existingLayerInstanceSettings =
      existingLayersInfo[selectedInfoClickLayer] ?? {};

    // Only include fields that have actual values (not empty strings or undefined)
    const layerInstanceData: Record<string, unknown> = {
      ...existingLayerInstanceSettings,
    };

    // Update fields that were provided (including falsy values like false for booleans)
    if (data.caption !== undefined)
      layerInstanceData.caption = data.caption || undefined;
    if (data.legendUrl !== undefined)
      layerInstanceData.legendUrl = data.legendUrl || undefined;
    if (data.legendIcon !== undefined)
      layerInstanceData.legendIcon = data.legendIcon || undefined;
    if (data.style !== undefined)
      layerInstanceData.style = data.style || undefined;
    if (data.queryable !== undefined)
      layerInstanceData.queryable = data.queryable;
    if (data.infoclickIcon !== undefined)
      layerInstanceData.infoclickIcon = data.infoclickIcon || undefined;
    if (data.searchDisplayName !== undefined)
      layerInstanceData.searchDisplayName = data.searchDisplayName || undefined;
    if (data.secondaryLabelFields !== undefined)
      layerInstanceData.secondaryLabelFields =
        data.secondaryLabelFields || undefined;
    if (data.searchShortDisplayName !== undefined)
      layerInstanceData.searchShortDisplayName =
        data.searchShortDisplayName || undefined;
    if (data.searchUrl !== undefined)
      layerInstanceData.searchUrl = data.searchUrl || undefined;
    if (data.searchPropertyName !== undefined)
      layerInstanceData.searchPropertyName =
        data.searchPropertyName || undefined;
    if (data.searchOutputFormat !== undefined)
      layerInstanceData.searchOutputFormat =
        data.searchOutputFormat || undefined;
    if (data.searchGeometryField !== undefined)
      layerInstanceData.searchGeometryField =
        data.searchGeometryField || undefined;
    if (data.definition !== undefined)
      layerInstanceData.definition = data.definition || undefined;
    if (data.format !== undefined) layerInstanceData.format = data.format;
    if (data.sortProperty !== undefined)
      layerInstanceData.sortProperty = data.sortProperty || undefined;
    if (data.sortMethod !== undefined)
      layerInstanceData.sortMethod = data.sortMethod;
    if (data.sortDescending !== undefined)
      layerInstanceData.sortDescending = data.sortDescending;

    const updatedLayersInfo = {
      ...existingLayersInfo,
      [selectedInfoClickLayer]: layerInstanceData,
    };

    // Merge with existing options to preserve all other fields
    const existingOptions: Record<string, unknown> =
      layer.options &&
      typeof layer.options === "object" &&
      !Array.isArray(layer.options)
        ? layer.options
        : {};
    const mergedOptions: Record<string, unknown> = {
      ...existingOptions,
      layersInfo: updatedLayersInfo,
      keyword: existingOptions.keyword ?? "",
      category: existingOptions.category ?? "",
      layerDisplayDescription: existingOptions.layerDisplayDescription ?? "",
      geoWebCache: existingOptions.geoWebCache ?? false,
      showAttributeTableButton:
        existingOptions.showAttributeTableButton ?? false,
    };

    const currentValues = {
      name: layer.name ?? "",
      serviceId: layer.serviceId ?? "",
      selectedLayers: layer.selectedLayers ?? [],
      internalName: layer.internalName ?? "",
      description: layer.description ?? "",
      hidpi: layer.hidpi ?? false,
      tiled: layer.tiled ?? false,
      singleTile: layer.singleTile ?? false,
      customRatio: layer.customRatio,
      timeSliderVisible: layer.timeSliderVisible ?? false,
      timeSliderStart: layer.timeSliderStart ?? "",
      timeSliderEnd: layer.timeSliderEnd ?? "",
      hideExpandArrow: layer.hideExpandArrow ?? false,
      zIndex: layer.zIndex ?? 0,
      style: layer.style ?? "",
      opacity: layer.opacity,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      minMaxZoomAlertOnToggleOnly: layer.minMaxZoomAlertOnToggleOnly ?? false,
      infoClickActive: layer.infoClickActive ?? false,
      showMetadata: layer.showMetadata ?? false,
      legendUrl: layer.legendUrl ?? "",
      legendIconUrl: layer.legendIconUrl ?? "",
      legendOptions: layer.legendOptions ?? "",
      options: mergedOptions,
      metadata: {
        title: layer.metadata?.title ?? "",
        description: layer.metadata?.description ?? "",
        owner: layer.metadata?.owner ?? "",
        url: layer.metadata?.url ?? "",
        urlTitle: layer.metadata?.urlTitle ?? "",
        attribution: layer.metadata?.attribution ?? "",
      },
      searchSettings: {
        active: layer.searchSettings?.active ?? false,
        url: layer.searchSettings?.url ?? "",
        searchFields: layer.searchSettings?.searchFields ?? [],
        outputFormat: layer.searchSettings?.outputFormat ?? "",
        geometryField: getLayerGeometryField(layer),
        primaryDisplayFields: layer.searchSettings?.primaryDisplayFields ?? [],
        secondaryDisplayFields:
          layer.searchSettings?.secondaryDisplayFields ?? [],
        shortDisplayFields: layer.searchSettings?.shortDisplayFields ?? [],
      },
      infoClickSettings: {
        definition: layer.infoClickSettings?.definition,
        icon: layer.infoClickSettings?.icon,
        format: layer.infoClickSettings?.format ?? "application/json",
        sortProperty: layer.infoClickSettings?.sortProperty,
        sortMethod: layer.infoClickSettings?.sortMethod ?? "text",
        sortDescending: layer.infoClickSettings?.sortDescending ?? false,
      },
    };

    try {
      await handleUpdateLayer(currentValues);
      // Manually update the query cache to ensure layersInfo is included
      // The API response might not include the full nested options structure
      queryClient.setQueryData(
        ["layers", layer.id],
        (oldData: typeof layer) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            options: {
              ...oldData.options,
              layersInfo: updatedLayersInfo,
            },
          };
        },
      );
      toast.success(
        t("layers.updateLayerInfoClickSuccess", {
          layerName: selectedInfoClickLayer,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
    } catch (error) {
      console.error("Failed to update layer infoclick settings:", error);
      toast.error(
        t("layers.updateLayerInfoClickFailed", {
          layerName: selectedInfoClickLayer,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
    }
  };

  const handleUpdateDpiList = (
    index: number,
    key: "pxRatio" | "dpi",
    value: string,
  ) => {
    if (value.includes(".") || value.includes(",")) {
      return; // Don't allow decimals
    }
    const numValue = parseInt(value, 10) || 0;
    const newList = [...customDpiList];
    newList[index] = { ...newList[index], [key]: numValue };
    setCustomDpiList(newList);
  };

  const handleRemoveDpiListRow = (index: number) => {
    if (customDpiList.length <= 1) {
      return; // Keep at least one row
    }
    const newList = [...customDpiList];
    newList.splice(index, 1);
    setCustomDpiList(newList);
  };

  const handleAddDpiListRow = () => {
    setCustomDpiList([...customDpiList, { pxRatio: 0, dpi: 90 }]);
  };

  const handleUpdateLayer = async (layerData: LayerUpdateInput) => {
    try {
      // Preserve existing options (including layersInfo) and merge with new options
      const existingOptions =
        layer?.options &&
        typeof layer.options === "object" &&
        !Array.isArray(layer.options)
          ? layer.options
          : ({} as Record<string, unknown>);
      const newOptions =
        layerData.options &&
        typeof layerData.options === "object" &&
        !Array.isArray(layerData.options)
          ? layerData.options
          : ({} as Record<string, unknown>);

      // Use layersInfo from newOptions if provided, otherwise preserve from existingOptions
      const layersInfoToUse =
        newOptions.layersInfo &&
        typeof newOptions.layersInfo === "object" &&
        !Array.isArray(newOptions.layersInfo)
          ? newOptions.layersInfo
          : existingOptions.layersInfo &&
              typeof existingOptions.layersInfo === "object" &&
              !Array.isArray(existingOptions.layersInfo)
            ? existingOptions.layersInfo
            : undefined;

      const updatedOptions: Record<string, unknown> = {
        ...existingOptions,
        ...newOptions,
        // Use the appropriate layersInfo (new takes precedence)
        ...(layersInfoToUse && { layersInfo: layersInfoToUse }),
        // Override with new values if provided
        keyword: newOptions.keyword ?? existingOptions.keyword,
        category: newOptions.category ?? existingOptions.category,
        geoWebCache: newOptions.geoWebCache ?? existingOptions.geoWebCache,
        showAttributeTableButton:
          newOptions.showAttributeTableButton ??
          existingOptions.showAttributeTableButton,
        layerDisplayDescription:
          newOptions.layerDisplayDescription ??
          existingOptions.layerDisplayDescription,
        ...(settingsVisibility.showEditingSettingsPanel && {
          editPoint: editingGeometryTypes.editPoint,
          editMultiPoint: editingGeometryTypes.editMultiPoint,
          editLine: editingGeometryTypes.editLine,
          editMultiLine: editingGeometryTypes.editMultiLine,
          editPolygon: editingGeometryTypes.editPolygon,
          editMultiPolygon: editingGeometryTypes.editMultiPolygon,
          allowMultiGeometries: editingGeometryTypes.allowMultiGeometries,
          editableFields: editingEditableFields,
          nonEditableFields: editingNonEditableFields,
        }),
      };

      const geometryField = resolveGeometryFieldFromPayload(
        layerData as Record<string, unknown>,
      );

      const payload = buildLayerUpdatePayload(layerCategory, {
        name: layerData.name,
        serviceId: layerData.serviceId,
        selectedLayers: layerData.selectedLayers,
        internalName: layerData.internalName,
        description: layerData.description,
        geometryField,
        hidpi: layerData.hidpi,
        tiled: layerData.tiled,
        singleTile: layerData.singleTile,
        customRatio: layerData.customRatio,
        timeSliderVisible: layerData.timeSliderVisible,
        timeSliderStart: layerData.timeSliderStart,
        timeSliderEnd: layerData.timeSliderEnd,
        hideExpandArrow: layerData.hideExpandArrow,
        zIndex: layerData.zIndex,
        style: layerData.style,
        opacity: layerData.opacity,
        minMaxZoomAlertOnToggleOnly: layerData.minMaxZoomAlertOnToggleOnly,
        minZoom: layerData.minZoom,
        maxZoom: layerData.maxZoom,
        infoClickActive: layerData?.infoClickActive,
        showMetadata: layerData?.showMetadata,
        legendUrl: layerData?.legendUrl,
        legendIconUrl: layerData?.legendIconUrl,
        legendOptions: layerData?.legendOptions,
        options: updatedOptions,
        metadata: {
          title: layerData?.metadata?.title,
          description: layerData?.metadata?.description,
          owner: layerData?.metadata?.owner,
          url: layerData?.metadata?.url,
          urlTitle: layerData?.metadata?.urlTitle,
          attribution: layerData?.metadata?.attribution,
        },
        searchSettings: {
          active: layerData?.searchSettings?.active,
          url: layerData?.searchSettings?.url,
          searchFields: layerData?.searchSettings?.searchFields,
          outputFormat: layerData?.searchSettings?.outputFormat,
          geometryField,
          primaryDisplayFields: layerData?.searchSettings?.primaryDisplayFields,
          secondaryDisplayFields:
            layerData?.searchSettings?.secondaryDisplayFields,
          shortDisplayFields: layerData?.searchSettings?.shortDisplayFields,
        },
        infoClickSettings: {
          sortDescending: layerData?.infoClickSettings?.sortDescending,
          definition: layerData?.infoClickSettings?.definition,
          icon: layerData?.infoClickSettings?.icon,
          sortProperty: layerData?.infoClickSettings?.sortProperty,
          format: layerData?.infoClickSettings?.format,
          sortMethod: layerData?.infoClickSettings?.sortMethod,
        },
      });

      await updateLayer({
        layerId: layer?.id ?? "",
        data: payload,
      });
      toast.success(t("layers.updateLayerSuccess", { name: layerData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });

      if (watchRoleIdInput) {
        await createRoleOnLayer({
          layerId: layer?.id ?? "",
          roleId: watchRoleIdInput,
        });
      }

      // Reset form with updated data to clear dirty state after successful save
      // This ensures the form reflects the saved state
      if (layer) {
        const savedBaseline: FieldValues = {
          name: layerData.name,
          serviceId: layerData.serviceId,
          internalName: layerData.internalName,
          description: layerData.description,
          hidpi: layerData.hidpi,
          tiled: layerData.tiled,
          singleTile: layerData.singleTile,
          customRatio: layerData.customRatio,
          timeSliderVisible: layerData.timeSliderVisible,
          timeSliderStart: layerData.timeSliderStart,
          timeSliderEnd: layerData.timeSliderEnd,
          hideExpandArrow: layerData.hideExpandArrow,
          zIndex: layerData.zIndex,
          style: layerData.style,
          opacity: layerData.opacity,
          minZoom: layerData.minZoom,
          maxZoom: layerData.maxZoom,
          minMaxZoomAlertOnToggleOnly: layerData.minMaxZoomAlertOnToggleOnly,
          infoClickActive: layerData.infoClickActive,
          showMetadata: layerData.showMetadata,
          legendUrl: layerData.legendUrl,
          legendIconUrl: layerData.legendIconUrl,
          legendOptions: layerData.legendOptions,
          useCustomDpiList: false,
          roleId: watchRoleIdInput,
          metadata: {
            title: layerData.metadata?.title,
            description: layerData.metadata?.description,
            owner: layerData.metadata?.owner,
            url: layerData.metadata?.url,
            urlTitle: layerData.metadata?.urlTitle,
            attribution: layerData.metadata?.attribution,
          },
          searchSettings: {
            active: layerData.searchSettings?.active,
            url: layerData.searchSettings?.url,
            searchFields: (layerData.searchSettings?.searchFields ?? []).join(
              ", ",
            ),
            primaryDisplayFields: (
              layerData.searchSettings?.primaryDisplayFields ?? []
            ).join(", "),
            secondaryDisplayFields: (
              layerData.searchSettings?.secondaryDisplayFields ?? []
            ).join(", "),
            shortDisplayFields: (
              layerData.searchSettings?.shortDisplayFields ?? []
            ).join(", "),
            geometryField:
              resolveGeometryFieldFromPayload(
                layerData as Record<string, unknown>,
              ) ?? "",
            outputFormat: layerData.searchSettings?.outputFormat,
          },
          infoClickSettings: {
            definition: layerData.infoClickSettings?.definition,
            icon: layerData.infoClickSettings?.icon,
            format: layerData.infoClickSettings?.format,
            sortProperty: layerData.infoClickSettings?.sortProperty,
            sortMethod: layerData.infoClickSettings?.sortMethod,
            sortDescending: layerData.infoClickSettings?.sortDescending,
          },
          options: {
            keyword: layerData.options?.keyword,
            category: layerData.options?.category,
            layerDisplayDescription: layerData.options?.layerDisplayDescription,
            geoWebCache: layerData.options?.geoWebCache,
            showAttributeTableButton:
              layerData.options?.showAttributeTableButton,
            editPoint: editingGeometryTypes.editPoint,
            editMultiPoint: editingGeometryTypes.editMultiPoint,
            editLine: editingGeometryTypes.editLine,
            editMultiLine: editingGeometryTypes.editMultiLine,
            editPolygon: editingGeometryTypes.editPolygon,
            editMultiPolygon: editingGeometryTypes.editMultiPolygon,
            allowMultiGeometries: editingGeometryTypes.allowMultiGeometries,
            editableFields: editingEditableFields,
            nonEditableFields: editingNonEditableFields,
          },
        };
        setCommittedFormBaseline(savedBaseline);
      }
    } catch (error) {
      console.error("Failed to update layer:", error);
      toast.error(t("layers.updateLayerFailed", { name: layer?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // removed createOnSubmitHandler; handled inline in FormContainer onSubmit

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!layer) {
    throw new HttpError(404, "Layer not found");
  }
  if (isError) return <div>Error fetching layer details.</div>;

  return (
    <Page
      title={
        layer?.name
          ? `${t("common.settings")} - ${layer.name}`
          : t("common.settings")
      }
    >
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        onCancel={handleCancelNewLayer}
        saveButtonText="Spara"
        backLink={
          service
            ? {
                label: t("services.goToService"),
                href: `/services/${service.id}?tab=layers`,
              }
            : undefined
        }
        createdBy={layer?.createdBy}
        createdDate={layer?.createdDate}
        lastSavedBy={layer?.lastSavedBy}
        lastSavedDate={layer?.lastSavedDate}
        isDirty={isDirty || selectedLayersDirty}
        warning={
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteClick}
              sx={{
                width: "100%",
                justifyContent: "center",
                borderStyle: "dashed",
              }}
            >
              {t("common.delete")}
            </Button>
          </Box>
        }
      >
        <SettingsPageTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={visibleTabs}
        />
        <FormContainer
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit((data: FieldValues) => {
              const toNumber = (v: unknown) => {
                if (typeof v === "string") {
                  const trimmed = v.trim();
                  if (trimmed === "") return undefined;
                  const n = Number(trimmed);
                  return Number.isNaN(n) ? undefined : n;
                }
                if (typeof v === "number") {
                  return Number.isNaN(v) ? undefined : v;
                }
                return undefined;
              };
              const toArray = (v: unknown) =>
                Array.isArray(v)
                  ? (v as string[])
                  : typeof v === "string"
                    ? v
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                    : undefined;

              if (selectedRowObjects?.length === 0) {
                toast.warning(t("layers.noLayersSelected"), {
                  position: "bottom-left",
                  theme: palette.mode,
                  hideProgressBar: true,
                });
                return;
              }

              const normalized = buildLayerUpdatePayload(layerCategory, {
                name: data.name,
                serviceId: data.serviceId,
                internalName: data.internalName,
                description: data.description,
                opacity: toNumber(data.opacity),
                minZoom: toNumber(data.minZoom),
                maxZoom: toNumber(data.maxZoom),
                minMaxZoomAlertOnToggleOnly: data.minMaxZoomAlertOnToggleOnly,
                tiled: data.tiled,
                singleTile: data.singleTile,
                hidpi: data.hidpi,
                customRatio: toNumber(data.customRatio),
                timeSliderVisible: data.timeSliderVisible,
                timeSliderStart: data.timeSliderStart,
                timeSliderEnd: data.timeSliderEnd,
                hideExpandArrow: data.hideExpandArrow,
                zIndex: toNumber(data.zIndex),
                showMetadata: data.showMetadata,
                infoClickActive: data.infoClickActive,
                style: data.style,
                legendUrl: data.legendUrl,
                legendIconUrl: data.legendIconUrl,
                legendOptions: data.legendOptions,
                metadata: data.metadata,
                searchSettings: {
                  active: (data.searchSettings as { active?: boolean })?.active,
                  url: (data.searchSettings as { url?: string })?.url,
                  searchFields: toArray(
                    (data.searchSettings as { searchFields?: unknown })
                      ?.searchFields,
                  ),
                  primaryDisplayFields: toArray(
                    (data.searchSettings as { primaryDisplayFields?: unknown })
                      ?.primaryDisplayFields,
                  ),
                  secondaryDisplayFields: toArray(
                    (
                      data.searchSettings as {
                        secondaryDisplayFields?: unknown;
                      }
                    )?.secondaryDisplayFields,
                  ),
                  shortDisplayFields: toArray(
                    (data.searchSettings as { shortDisplayFields?: unknown })
                      ?.shortDisplayFields,
                  ),
                  geometryField: (
                    data.searchSettings as { geometryField?: string }
                  )?.geometryField,
                  outputFormat: (
                    data.searchSettings as { outputFormat?: string }
                  )?.outputFormat,
                },
                infoClickSettings: data.infoClickSettings,
                options: {
                  keyword: (data.options as { keyword?: string })?.keyword,
                  category: (data.options as { category?: string })?.category,
                  layerDisplayDescription: (
                    data.options as { layerDisplayDescription?: string }
                  )?.layerDisplayDescription,
                  geoWebCache: (data.options as { geoWebCache?: boolean })
                    ?.geoWebCache,
                  showAttributeTableButton: (
                    data.options as { showAttributeTableButton?: boolean }
                  )?.showAttributeTableButton,
                  ...(settingsVisibility.showEditingSettingsPanel && {
                    editPoint: editingGeometryTypes.editPoint,
                    editMultiPoint: editingGeometryTypes.editMultiPoint,
                    editLine: editingGeometryTypes.editLine,
                    editMultiLine: editingGeometryTypes.editMultiLine,
                    editPolygon: editingGeometryTypes.editPolygon,
                    editMultiPolygon: editingGeometryTypes.editMultiPolygon,
                    allowMultiGeometries:
                      editingGeometryTypes.allowMultiGeometries,
                    editableFields: editingEditableFields,
                    nonEditableFields: editingNonEditableFields,
                  }),
                },
                selectedLayers: selectedRowObjects,
              });

              void handleUpdateLayer(normalized);
            })(e);
          }}
          formRef={formRef}
          noValidate={false}
        >
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
                    <ManageSearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />
          )}
          <Box sx={{ display: showGeneralTab ? "block" : "none" }}>
            <SearchablePanel
              panelTitleKeywords={settingsSearchLabels("common.information")}
              keywords={[
                ...settingsSearchLabels(
                  "common.name",
                  "layers.common.service",
                  "layers.internalName",
                  "layers.copyRight",
                  "map.description",
                  "layers.keyword",
                  "layers.category",
                ),
                "namn",
                "name",
                "tjänst",
                "intern",
                "beskrivning",
                "nyckelord",
                "kategori",
              ]}
              fields={[
                "name",
                "serviceId",
                "internalName",
                "description",
                "options.keyword",
                "options.category",
                "metadata.attribution",
              ]}
              allValues={showSettingsSearchUi ? getValues() : undefined}
              searchTerm={settingsSearchTerm}
            >
              <FormPanel title={t("common.information")}>
                <FormFieldGrid>
                  <SettingsSearchField
                    labelKeys={["common.name"]}
                    fields={["name"]}
                    synonyms={["namn", "name"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="common.name"
                        helpKey="layers.help.name"
                        fullWidth
                        {...register("name", {
                          required: `${t("common.required")}`,
                        })}
                        error={!!errors.name}
                        helperText={
                          (errors.name as unknown as { message?: string })
                            ?.message
                        }
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.common.service"]}
                    fields={["serviceId"]}
                    synonyms={["tjänst", "service"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <Controller
                        name="serviceId"
                        control={control}
                        render={({ field }) => (
                          <SelectWithHelp
                            labelKey="layers.common.service"
                            helpKey="layers.help.service"
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {(services ?? []).map((service) => (
                              <MenuItem key={service.id} value={service.id}>
                                {service.name}({service.type})
                              </MenuItem>
                            ))}
                          </SelectWithHelp>
                        )}
                      />
                    </FormFieldRow>
                    {service && (
                      <FormFieldRow>
                        <Alert
                          severity="info"
                          variant="outlined"
                          sx={{ py: 0.5, my: 0 }}
                        >
                          <Typography variant="body2" component="span">
                            {t("layers.serviceConnectionSummary", {
                              type: service.type,
                              url: service.url,
                              version: service.version,
                              imageFormat: service.imageFormat,
                              projection: service.projection?.code ?? "—",
                            })}
                          </Typography>
                        </Alert>
                      </FormFieldRow>
                    )}
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.internalName"]}
                    fields={["internalName"]}
                    synonyms={["intern", "internal"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.internalName"
                        helpKey="layers.help.internalName"
                        fullWidth
                        {...register("internalName")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.copyRight"]}
                    fields={["metadata.attribution"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.copyRight"
                        helpKey="layers.help.attribution"
                        fullWidth
                        {...register("metadata.attribution")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["map.description"]}
                    fields={["description"]}
                    synonyms={["beskrivning", "description"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="map.description"
                        helpKey="layers.help.description"
                        fullWidth
                        multiline
                        rows={3}
                        {...register("description")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.keyword"]}
                    fields={["options.keyword"]}
                    synonyms={["nyckelord", "keyword"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.keyword"
                        helpKey="layers.help.keyword"
                        fullWidth
                        {...register("options.keyword")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.category"]}
                    fields={["options.category"]}
                    synonyms={["kategori", "category"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.category"
                        helpKey="layers.help.category"
                        fullWidth
                        {...register("options.category")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                </FormFieldGrid>
              </FormPanel>
            </SearchablePanel>

            <SearchablePanel
              panelTitleKeywords={settingsSearchLabels("layers.permissions")}
              keywords={[
                ...settingsSearchLabels("layers.permission"),
                "behörighet",
                "permission",
                "roll",
                "role",
              ]}
              fields={["roleId"]}
              allValues={showSettingsSearchUi ? getValues() : undefined}
              searchTerm={settingsSearchTerm}
            >
              <FormPanel title={t("layers.permissions")}>
                <FormFieldGrid>
                  <SettingsSearchField
                    labelKeys={["layers.permission"]}
                    fields={["roleId"]}
                    synonyms={["behörighet", "roll", "role"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <Controller
                        name="roleId"
                        control={control}
                        render={({ field }) => (
                          <SelectWithHelp
                            labelKey="layers.permission"
                            helpKey="layers.help.permission"
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {(roles ?? []).map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                {role.title}
                              </MenuItem>
                            ))}
                          </SelectWithHelp>
                        )}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                </FormFieldGrid>
              </FormPanel>
            </SearchablePanel>

            {layerId && <UsedInMapsGrid layerId={layerId} />}
          </Box>

          <Box sx={{ display: showDisplayTab ? "block" : "none" }}>
            {settingsVisibility.showDisplayRequestOptions && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels(
                  "services.settings.request",
                )}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.hidpi",
                    "layers.tiled",
                    "layers.singleTile",
                    "layers.geoWebCache",
                    "layers.customRatio",
                  ),
                  "förfrågan",
                  "request",
                  "hidpi",
                  "tiled",
                ]}
                fields={[
                  "hidpi",
                  "tiled",
                  "singleTile",
                  "options.geoWebCache",
                  "customRatio",
                ]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("services.settings.request")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={[
                        "layers.hidpi",
                        "layers.tiled",
                        "layers.singleTile",
                        "layers.geoWebCache",
                      ]}
                      fields={[
                        "hidpi",
                        "tiled",
                        "singleTile",
                        "options.geoWebCache",
                      ]}
                      synonyms={["hidpi", "tiled", "geoWebCache", "gwc"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <Controller
                            name="hidpi"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.hidpi",
                                  "layers.help.hidpi",
                                )}
                              />
                            )}
                          />
                          <Controller
                            name="tiled"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.tiled",
                                  "layers.help.tiled",
                                )}
                              />
                            )}
                          />
                          <Controller
                            name="singleTile"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.singleTile",
                                  "layers.help.singleTile",
                                )}
                              />
                            )}
                          />
                          <Controller
                            name="options.geoWebCache"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.geoWebCache",
                                  "layers.help.geoWebCache",
                                )}
                              />
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                    {watchSingleTile ? (
                      <SettingsSearchField
                        labelKeys={["layers.customRatio"]}
                        fields={["customRatio"]}
                        searchTerm={settingsSearchTerm}
                        allValues={
                          showSettingsSearchUi ? getValues() : undefined
                        }
                      >
                        <FormFieldRow>
                          <TextFieldWithHelp
                            labelKey="layers.customRatio"
                            helpKey="layers.help.customRatio"
                            fullWidth
                            type="number"
                            slotProps={{
                              htmlInput: { step: 1 },
                            }}
                            {...register("customRatio")}
                          />
                        </FormFieldRow>
                      </SettingsSearchField>
                    ) : null}
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}

            {settingsVisibility.showDisplayRequestOptions && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels("layers.customDpi")}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.customDpi",
                    "layers.useCustomDpiList",
                    "layers.pxRatio",
                    "layers.dpi",
                    "layers.addDpiRow",
                  ),
                  "dpi",
                ]}
                fields={["useCustomDpiList"]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("layers.customDpi")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["layers.useCustomDpiList"]}
                      fields={["useCustomDpiList"]}
                      synonyms={["dpi list", "dpi-lista"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Controller
                                name="useCustomDpiList"
                                control={control}
                                render={({ field }) => (
                                  <Checkbox
                                    {...field}
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) => {
                                      field.onChange(e.target.checked);
                                      setUseCustomDpiList(e.target.checked);
                                    }}
                                  />
                                )}
                              />
                            }
                            label={fieldLabel(
                              "layers.useCustomDpiList",
                              "layers.help.useCustomDpiList",
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                    {useCustomDpiList && (
                      <SettingsSearchField
                        labelKeys={[
                          "layers.pxRatio",
                          "layers.dpi",
                          "layers.addDpiRow",
                        ]}
                        synonyms={[
                          "dpi",
                          "px ratio",
                          "pixel ratio",
                          "pixelratio",
                        ]}
                        searchTerm={settingsSearchTerm}
                        allValues={
                          showSettingsSearchUi ? getValues() : undefined
                        }
                      >
                        <FormFieldGrid>
                          {customDpiList.map((item, index) => (
                            <FormFieldRow key={index}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <TextFieldWithHelp
                                  labelKey="layers.pxRatio"
                                  helpKey="layers.help.pxRatio"
                                  type="number"
                                  value={item.pxRatio}
                                  onChange={(e) =>
                                    handleUpdateDpiList(
                                      index,
                                      "pxRatio",
                                      e.target.value,
                                    )
                                  }
                                  sx={{ width: 150 }}
                                />
                                <TextFieldWithHelp
                                  labelKey="layers.dpi"
                                  helpKey="layers.help.dpi"
                                  type="number"
                                  value={item.dpi}
                                  onChange={(e) =>
                                    handleUpdateDpiList(
                                      index,
                                      "dpi",
                                      e.target.value,
                                    )
                                  }
                                  sx={{ width: 150 }}
                                />
                                <IconButton
                                  onClick={() => handleRemoveDpiListRow(index)}
                                  disabled={customDpiList.length <= 1}
                                  color="error"
                                  aria-label={t("common.delete")}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </FormFieldRow>
                          ))}
                          <FormFieldRow>
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={handleAddDpiListRow}
                            >
                              {t("layers.addDpiRow")}
                            </Button>
                          </FormFieldRow>
                        </FormFieldGrid>
                      </SettingsSearchField>
                    )}
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}

            <SearchablePanel
              panelTitleKeywords={settingsSearchLabels("layers.settings")}
              keywords={[
                ...settingsSearchLabels(
                  "layers.opacity",
                  "layers.minZoom",
                  "layers.maxZoom",
                  "layers.zIndex",
                  "layers.style",
                  "layers.legendOptions",
                  "layers.minMaxZoomAlertOnToggleOnly",
                ),
                "opacitet",
                "opacity",
                "teckenförklaring",
              ]}
              fields={[
                "opacity",
                "minZoom",
                "maxZoom",
                "zIndex",
                "style",
                "legendOptions",
              ]}
              allValues={showSettingsSearchUi ? getValues() : undefined}
              searchTerm={settingsSearchTerm}
            >
              <FormPanel title={t("layers.settings")}>
                <FormFieldGrid>
                  {settingsVisibility.showDisplayRequestOptions && (
                    <SettingsSearchField
                      labelKeys={["layers.style"]}
                      fields={["style"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <Controller
                          name="style"
                          control={control}
                          render={({ field }) => (
                            <SelectWithHelp
                              labelKey="layers.style"
                              helpKey="layers.help.style"
                              {...field}
                              displayEmpty
                              value={(field.value as string) ?? ""}
                              renderValue={(value: unknown) =>
                                value === "" ? "<default>" : String(value)
                              }
                            >
                              <MenuItem value="">{"<default>"}</MenuItem>
                              {(styles ?? []).map((s) => (
                                <MenuItem key={s.name} value={s.name}>
                                  {s.name}
                                </MenuItem>
                              ))}
                            </SelectWithHelp>
                          )}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                  )}
                  <SettingsSearchField
                    labelKeys={["layers.opacity"]}
                    fields={["opacity"]}
                    synonyms={["opacitet", "opacity"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.opacity"
                        helpKey="layers.help.opacity"
                        fullWidth
                        type="number"
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            max: 1,
                            step: 0.01,
                          },
                        }}
                        {...register("opacity", {
                          valueAsNumber: true,
                          min: { value: 0, message: t("layers.opacityRange") },
                          max: { value: 1, message: t("layers.opacityRange") },
                        })}
                        error={!!errors.opacity}
                        helperText={
                          (errors.opacity as unknown as { message?: string })
                            ?.message
                        }
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.minZoom"]}
                    fields={["minZoom"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.minZoom"
                        helpKey="layers.help.minZoom"
                        fullWidth
                        type="number"
                        slotProps={{
                          htmlInput: { step: 1 },
                        }}
                        helperText={t("layers.zoomNegativeOneHint")}
                        {...register("minZoom")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.maxZoom"]}
                    fields={["maxZoom"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.maxZoom"
                        helpKey="layers.help.maxZoom"
                        fullWidth
                        type="number"
                        slotProps={{
                          htmlInput: { step: 1 },
                        }}
                        helperText={t("layers.zoomNegativeOneHint")}
                        {...register("maxZoom")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.zIndex"]}
                    fields={["zIndex"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.zIndex"
                        helpKey="layers.help.zIndex"
                        fullWidth
                        type="number"
                        slotProps={{
                          htmlInput: { step: 1 },
                        }}
                        {...register("zIndex")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.legendOptions"]}
                    fields={["legendOptions"]}
                    synonyms={["teckenförklaring", "legend"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.legendOptions"
                        helpKey="layers.help.legendOptions"
                        fullWidth
                        {...register("legendOptions")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.minMaxZoomAlertOnToggleOnly"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <FormGroup>
                        <Controller
                          name="minMaxZoomAlertOnToggleOnly"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(field.value as boolean)}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              }
                              label={fieldLabel(
                                "layers.minMaxZoomAlertOnToggleOnly",
                                "layers.help.minMaxZoomAlertOnToggleOnly",
                              )}
                            />
                          )}
                        />
                      </FormGroup>
                    </FormFieldRow>
                  </SettingsSearchField>
                </FormFieldGrid>
              </FormPanel>
            </SearchablePanel>

            {settingsVisibility.showDisplayRequestOptions && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels("layers.timeSlider")}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.timeSlider",
                    "layers.timeSliderVisible",
                    "layers.timeSliderStart",
                    "layers.timeSliderEnd",
                  ),
                  "tidsreglage",
                  "slider",
                ]}
                fields={[
                  "timeSliderVisible",
                  "timeSliderStart",
                  "timeSliderEnd",
                ]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("layers.timeSlider")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["layers.timeSliderVisible"]}
                      fields={["timeSliderVisible"]}
                      synonyms={["tidsreglage synlig", "visible"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <Controller
                            name="timeSliderVisible"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.timeSliderVisible",
                                  "layers.help.timeSliderVisible",
                                )}
                              />
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.timeSliderStart"]}
                      fields={["timeSliderStart"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.timeSliderStart"
                          helpKey="layers.help.timeSliderStart"
                          fullWidth
                          {...register("timeSliderStart")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.timeSliderEnd"]}
                      fields={["timeSliderEnd"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.timeSliderEnd"
                          helpKey="layers.help.timeSliderEnd"
                          fullWidth
                          {...register("timeSliderEnd")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}

            {settingsVisibility.showDisplayRequestOptions && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels(
                  "layers.layerSwitcher",
                )}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.layerSwitcher",
                    "layers.hideExpandArrow",
                  ),
                  "layerswitcher",
                ]}
                fields={["hideExpandArrow"]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("layers.layerSwitcher")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["layers.hideExpandArrow"]}
                      fields={["hideExpandArrow"]}
                      synonyms={["expand", "pil", "arrow"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <Controller
                            name="hideExpandArrow"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.hideExpandArrow",
                                  "layers.help.hideExpandArrow",
                                )}
                              />
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}
          </Box>

          <Box sx={{ display: showMetadataTab ? "block" : "none" }}>
            <SearchablePanel
              panelTitleKeywords={settingsSearchLabels("layers.metadataTab")}
              keywords={[
                ...settingsSearchLabels(
                  "layers.metadataTab",
                  "layers.showMetadata",
                  "layers.showAttributeTableButton",
                  "layers.metadata.title",
                  "layers.metadata.owner",
                  "layers.metadata.description",
                  "layers.metadata.urlTitle",
                  "layers.metadata.url",
                  "layers.layerDisplayDescription",
                ),
                "metadata",
                "ägare",
                "owner",
                "beskrivning",
                "description",
                "url",
                "attribut",
                "attribute",
                "tabell",
              ]}
              fields={[
                "showMetadata",
                "options.showAttributeTableButton",
                "metadata.title",
                "metadata.owner",
                "metadata.description",
                "metadata.url",
                "metadata.urlTitle",
                "options.layerDisplayDescription",
              ]}
              allValues={showSettingsSearchUi ? getValues() : undefined}
              searchTerm={settingsSearchTerm}
            >
              <FormPanel title={t("layers.metadataTab")}>
                <FormFieldGrid>
                  <SettingsSearchField
                    labelKeys={[
                      "layers.showMetadata",
                      "layers.showAttributeTableButton",
                    ]}
                    fields={[
                      "showMetadata",
                      "options.showAttributeTableButton",
                    ]}
                    synonyms={["attributtabell", "attribute table"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <FormGroup>
                        <Controller
                          name="showMetadata"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(field.value as boolean)}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              }
                              label={fieldLabel(
                                "layers.showMetadata",
                                "layers.help.showMetadata",
                              )}
                            />
                          )}
                        />
                        <Controller
                          name="options.showAttributeTableButton"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(field.value as boolean)}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              }
                              label={fieldLabel(
                                "layers.showAttributeTableButton",
                                "layers.help.showAttributeTableButton",
                              )}
                            />
                          )}
                        />
                      </FormGroup>
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.metadata.title"]}
                    fields={["metadata.title"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.metadata.title"
                        helpKey="layers.help.metadataTitle"
                        fullWidth
                        {...register("metadata.title")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.metadata.owner"]}
                    fields={["metadata.owner"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.metadata.owner"
                        helpKey="layers.help.metadataOwner"
                        fullWidth
                        {...register("metadata.owner")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.metadata.description"]}
                    fields={["metadata.description"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.metadata.description"
                        helpKey="layers.help.metadataDescription"
                        fullWidth
                        multiline
                        rows={6}
                        {...register("metadata.description")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.metadata.urlTitle"]}
                    fields={["metadata.urlTitle"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.metadata.urlTitle"
                        helpKey="layers.help.metadataUrlTitle"
                        fullWidth
                        {...register("metadata.urlTitle")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.metadata.url"]}
                    fields={["metadata.url"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.metadata.url"
                        helpKey="layers.help.metadataUrl"
                        fullWidth
                        {...register("metadata.url")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                  <SettingsSearchField
                    labelKeys={["layers.layerDisplayDescription"]}
                    fields={["options.layerDisplayDescription"]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <FormFieldRow>
                      <TextFieldWithHelp
                        labelKey="layers.layerDisplayDescription"
                        helpKey="layers.help.layerDisplayDescription"
                        fullWidth
                        multiline
                        rows={3}
                        {...register("options.layerDisplayDescription")}
                      />
                    </FormFieldRow>
                  </SettingsSearchField>
                </FormFieldGrid>
              </FormPanel>
            </SearchablePanel>
          </Box>

          <Box sx={{ display: showInfoclickTab ? "block" : "none" }}>
            {settingsVisibility.showInfoClickSettingsPanel && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels("common.infoclick")}
                keywords={[
                  ...settingsSearchLabels(
                    "common.infoclick",
                    "layers.infobox",
                    "layers.infoClickIcon",
                    "layers.sortByAttribute",
                    "layers.infoClickFormat",
                    "layers.infoClickSortMethod",
                  ),
                  "infoclick",
                  "infoklick",
                  "infobox",
                  "ikon",
                  "icon",
                  "sortering",
                  "sort",
                  "format",
                ]}
                fields={[
                  "infoClickActive",
                  "infoClickSettings.definition",
                  "infoClickSettings.icon",
                  "infoClickSettings.sortProperty",
                  "infoClickSettings.format",
                  "infoClickSettings.sortMethod",
                ]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("common.infoclick")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["common.infoclick"]}
                      fields={["infoClickActive"]}
                      synonyms={["infoklick", "active"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <Controller
                            name="infoClickActive"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "common.infoclick",
                                  "layers.help.infoClickActive",
                                )}
                              />
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.infobox"]}
                      fields={["infoClickSettings.definition"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.infobox"
                          helpKey="layers.help.infobox"
                          fullWidth
                          multiline
                          rows={3}
                          {...register("infoClickSettings.definition")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.infoClickIcon"]}
                      fields={["infoClickSettings.icon"]}
                      synonyms={["ikon", "icon"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.infoClickIcon"
                          helpKey="layers.help.infoClickIcon"
                          fullWidth
                          {...register("infoClickSettings.icon")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.sortByAttribute"]}
                      fields={["infoClickSettings.sortProperty"]}
                      synonyms={["sortering", "sort"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.sortByAttribute"
                          helpKey="layers.help.sortByAttribute"
                          fullWidth
                          {...register("infoClickSettings.sortProperty")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.infoClickFormat"]}
                      fields={["infoClickSettings.format"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <Controller
                          name="infoClickSettings.format"
                          control={control}
                          render={({ field }) => (
                            <SelectWithHelp
                              labelKey="layers.infoClickFormat"
                              helpKey="layers.help.infoClickFormat"
                              {...field}
                              value={(field.value as string) ?? ""}
                            >
                              {infoClickFormat.map((format) => (
                                <MenuItem
                                  key={format.value}
                                  value={format.value}
                                >
                                  {format.title}
                                </MenuItem>
                              ))}
                            </SelectWithHelp>
                          )}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.infoClickSortMethod"]}
                      fields={["infoClickSettings.sortMethod"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <Controller
                          name="infoClickSettings.sortMethod"
                          control={control}
                          render={({ field }) => (
                            <SelectWithHelp
                              labelKey="layers.infoClickSortMethod"
                              helpKey="layers.help.infoClickSortMethod"
                              {...field}
                              value={(field.value as string) ?? ""}
                            >
                              {sortType.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.title}
                                </MenuItem>
                              ))}
                            </SelectWithHelp>
                          )}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}

            {settingsVisibility.showDisplayFieldsPanel && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels(
                  "layers.settings.displayFields",
                )}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.settings.displayFields",
                    "layers.primaryDisplayFields",
                    "layers.secondaryDisplayFields",
                    "layers.shortDisplayFields",
                  ),
                  "visningsfält",
                  "display",
                ]}
                fields={[
                  "searchSettings.primaryDisplayFields",
                  "searchSettings.secondaryDisplayFields",
                  "searchSettings.shortDisplayFields",
                ]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("layers.settings.displayFields")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["layers.primaryDisplayFields"]}
                      fields={["searchSettings.primaryDisplayFields"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.primaryDisplayFields"
                          helpKey="layers.help.primaryDisplayFields"
                          fullWidth
                          {...register("searchSettings.primaryDisplayFields")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.secondaryDisplayFields"]}
                      fields={["searchSettings.secondaryDisplayFields"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.secondaryDisplayFields"
                          helpKey="layers.help.secondaryDisplayFields"
                          fullWidth
                          {...register("searchSettings.secondaryDisplayFields")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.shortDisplayFields"]}
                      fields={["searchSettings.shortDisplayFields"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.shortDisplayFields"
                          helpKey="layers.help.shortDisplayFields"
                          fullWidth
                          {...register("searchSettings.shortDisplayFields")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}

            {settingsVisibility.showSearchSettingsPanel && (
              <SearchablePanel
                panelTitleKeywords={settingsSearchLabels(
                  "layers.settings.searchSettings",
                )}
                keywords={[
                  ...settingsSearchLabels(
                    "layers.settings.searchSettings",
                    "layers.searchSettings.active",
                    "layers.searchSettings.url",
                    "layers.searchSettings.searchFields",
                    "layers.searchSettings.outputFormat",
                    "layers.searchSettings.geometryField",
                  ),
                  "sök",
                  "search",
                  "url",
                  "fält",
                  "fields",
                  "geometri",
                  "geometry",
                  "format",
                ]}
                fields={[
                  "searchSettings.active",
                  "searchSettings.url",
                  "searchSettings.searchFields",
                  "searchSettings.outputFormat",
                  "searchSettings.geometryField",
                ]}
                allValues={showSettingsSearchUi ? getValues() : undefined}
                searchTerm={settingsSearchTerm}
              >
                <FormPanel title={t("layers.settings.searchSettings")}>
                  <FormFieldGrid>
                    <SettingsSearchField
                      labelKeys={["layers.searchSettings.active"]}
                      fields={["searchSettings.active"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <FormGroup>
                          <Controller
                            name="searchSettings.active"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={Boolean(field.value as boolean)}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                }
                                label={fieldLabel(
                                  "layers.searchSettings.active",
                                  "layers.help.searchActive",
                                )}
                              />
                            )}
                          />
                        </FormGroup>
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.searchSettings.url"]}
                      fields={["searchSettings.url"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.searchSettings.url"
                          helpKey="layers.help.searchUrl"
                          fullWidth
                          helperText={
                            service &&
                            [
                              SERVICE_TYPE.WFS,
                              SERVICE_TYPE.WFST,
                              SERVICE_TYPE.VECTOR,
                            ].includes(service.type)
                              ? t("layers.searchSettings.urlServiceHint", {
                                  url: service.url,
                                })
                              : undefined
                          }
                          {...register("searchSettings.url")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.searchSettings.searchFields"]}
                      fields={["searchSettings.searchFields"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.searchSettings.searchFields"
                          helpKey="layers.help.searchFields"
                          fullWidth
                          helperText={t("layers.searchFieldsHelp")}
                          {...register("searchSettings.searchFields")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.searchSettings.outputFormat"]}
                      fields={["searchSettings.outputFormat"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <Box>
                          <FieldLabelAbove
                            htmlFor="searchSettings-outputFormat"
                            label={t("layers.searchSettings.outputFormat")}
                            help={String(t("layers.help.searchOutputFormat"))}
                          />
                          <Controller
                            name="searchSettings.outputFormat"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                id="searchSettings-outputFormat"
                                select
                                fullWidth
                                value={(field.value as string) ?? ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                inputRef={field.ref}
                              >
                                {searchOutputFormat.map((format) => (
                                  <MenuItem key={format} value={format}>
                                    {format}
                                  </MenuItem>
                                ))}
                              </TextField>
                            )}
                          />
                        </Box>
                      </FormFieldRow>
                    </SettingsSearchField>
                    <SettingsSearchField
                      labelKeys={["layers.searchSettings.geometryField"]}
                      fields={["searchSettings.geometryField"]}
                      searchTerm={settingsSearchTerm}
                      allValues={showSettingsSearchUi ? getValues() : undefined}
                    >
                      <FormFieldRow>
                        <TextFieldWithHelp
                          labelKey="layers.searchSettings.geometryField"
                          helpKey="layers.help.geometryField"
                          fullWidth
                          {...register("searchSettings.geometryField")}
                        />
                      </FormFieldRow>
                    </SettingsSearchField>
                  </FormFieldGrid>
                </FormPanel>
              </SearchablePanel>
            )}
          </Box>

          <Box sx={{ display: showEditingTab ? "block" : "none" }}>
            <SearchablePanel
              panelTitleKeywords={settingsSearchLabels("layers.editing.tab")}
              keywords={[
                ...settingsSearchLabels(
                  "layers.editing.tab",
                  "layers.editing.geometrySection",
                  "layers.editing.geometryTypes",
                  "layers.editing.editableFields",
                  "layers.searchSettings.geometryField",
                  "layers.editing.geometry.point",
                  "layers.editing.geometry.multipoint",
                  "layers.editing.geometry.line",
                  "layers.editing.geometry.multiline",
                  "layers.editing.geometry.polygon",
                  "layers.editing.geometry.multipolygon",
                  "layers.editing.allowMultiGeometries",
                ),
                "redigering",
                "editing",
                "geometri",
                "geometry",
                "fält",
                "fields",
                "punkt",
                "linje",
                "polygon",
              ]}
              fields={[
                "searchSettings.geometryField",
                "options.editPoint",
                "options.editMultiPoint",
                "options.editLine",
                "options.editMultiLine",
                "options.editPolygon",
                "options.editMultiPolygon",
                "options.allowMultiGeometries",
              ]}
              allValues={showSettingsSearchUi ? getValues() : undefined}
              searchTerm={settingsSearchTerm}
            >
              {settingsVisibility.showEditingSettingsPanel &&
                service &&
                layer && (
                  <SettingsSearchField
                    labelKeys={[
                      "layers.editing.tab",
                      "layers.editing.geometrySection",
                      "layers.editing.geometryTypes",
                      "layers.searchSettings.geometryField",
                      "layers.editing.editableFields",
                      "layers.editing.geometry.point",
                      "layers.editing.geometry.multipoint",
                      "layers.editing.geometry.line",
                      "layers.editing.geometry.multiline",
                      "layers.editing.geometry.polygon",
                      "layers.editing.geometry.multipolygon",
                      "layers.editing.allowMultiGeometries",
                    ]}
                    fields={[
                      "searchSettings.geometryField",
                      "options.editPoint",
                      "options.editMultiPoint",
                      "options.editLine",
                      "options.editMultiLine",
                      "options.editPolygon",
                      "options.editMultiPolygon",
                      "options.allowMultiGeometries",
                    ]}
                    synonyms={[
                      "redigering",
                      "editing",
                      "geometri",
                      "geometry",
                      "fält",
                      "fields",
                      "punkt",
                      "linje",
                      "polygon",
                    ]}
                    searchTerm={settingsSearchTerm}
                    allValues={showSettingsSearchUi ? getValues() : undefined}
                  >
                    <EditingLayerSettings
                      serviceUrl={service.url}
                      typeName={layer.selectedLayers?.[0] ?? ""}
                      geometryField={watchGeometryField ?? ""}
                      onGeometryFieldChange={(value) =>
                        setValue("searchSettings.geometryField", value, {
                          shouldDirty: true,
                        })
                      }
                      geometryTypes={editingGeometryTypes}
                      onGeometryTypesChange={(types) => {
                        setEditingGeometryTypes(types);
                        (
                          [
                            "editPoint",
                            "editMultiPoint",
                            "editLine",
                            "editMultiLine",
                            "editPolygon",
                            "editMultiPolygon",
                            "allowMultiGeometries",
                          ] as const satisfies readonly (keyof EditingGeometryTypes)[]
                        ).forEach((key) => {
                          setValue(`options.${key}`, types[key], {
                            shouldDirty: true,
                          });
                        });
                      }}
                      savedEditableFields={editingEditableFields}
                      savedNonEditableFields={editingNonEditableFields}
                      onFieldsChange={(editable, nonEditable) => {
                        setEditingEditableFields(editable);
                        setEditingNonEditableFields(nonEditable);
                        setValue("options.editableFields", editable, {
                          shouldDirty: true,
                        });
                        setValue("options.nonEditableFields", nonEditable, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  </SettingsSearchField>
                )}
            </SearchablePanel>
          </Box>

          {activeTab === "layers" && layer && (
            <Box>
              <AvailableLayersGrid
                isLoading={serviceLoading || capabilitiesLoading}
                isError={capabilitiesError}
                onRetry={() => void refetchCapabilities()}
                getCapLayers={getCapLayers}
                selectedLayers={layer?.selectedLayers ?? []}
                filteredLayers={filteredLayers}
                setSearchTerm={setSearchTerm}
                setSelectGridId={setSelectGridId}
                searchTerm={searchTerm}
                selectGridId={selectGridId}
                selectedRowObjects={selectedRowObjects}
                onLayerClick={handleLayerClick}
              />
            </Box>
          )}

        </FormContainer>
      </FormActionPanel>
      <LayerInfoClickModal
        open={openInfoClickModal}
        layerName={selectedInfoClickLayer}
        onClose={handleCloseModal}
        onSave={(data) => {
          void handleSaveLayerInfoClick(data);
        }}
        initialValues={(() => {
          // Get per-layer-instance settings from options.layersInfo, fallback to main layer settings
          const layersInfo =
            (layer?.options?.layersInfo as Record<
              string,
              {
                caption?: string;
                legendUrl?: string;
                legendIcon?: string;
                style?: string;
                queryable?: boolean;
                infoclickIcon?: string;
                searchDisplayName?: string;
                secondaryLabelFields?: string;
                searchShortDisplayName?: string;
                searchUrl?: string;
                searchPropertyName?: string;
                searchOutputFormat?: string;
                searchGeometryField?: string;
                definition?: string;
                format?: string;
                sortProperty?: string;
                sortMethod?: string;
                sortDescending?: boolean;
              }
            >) ?? {};
          const layerInstanceSettings =
            selectedInfoClickLayer && layersInfo[selectedInfoClickLayer]
              ? layersInfo[selectedInfoClickLayer]
              : {};

          return {
            caption: layerInstanceSettings.caption ?? "",
            legendUrl:
              layerInstanceSettings.legendUrl ?? layer?.legendUrl ?? "",
            legendIcon:
              layerInstanceSettings.legendIcon ?? layer?.legendIconUrl ?? "",
            style: layerInstanceSettings.style ?? layer?.style ?? "",
            queryable:
              layerInstanceSettings.queryable ??
              layer?.infoClickActive ??
              false,
            infoclickIcon:
              layerInstanceSettings.infoclickIcon ??
              layer?.infoClickSettings?.icon ??
              "",
            searchDisplayName:
              layerInstanceSettings.searchDisplayName ??
              layer?.searchSettings?.primaryDisplayFields?.join(", ") ??
              "",
            secondaryLabelFields:
              layerInstanceSettings.secondaryLabelFields ??
              layer?.searchSettings?.secondaryDisplayFields?.join(", ") ??
              "",
            searchShortDisplayName:
              layerInstanceSettings.searchShortDisplayName ??
              layer?.searchSettings?.shortDisplayFields?.join(", ") ??
              "",
            searchUrl:
              layerInstanceSettings.searchUrl ??
              layer?.searchSettings?.url ??
              "",
            searchPropertyName:
              layerInstanceSettings.searchPropertyName ??
              layer?.searchSettings?.searchFields?.join(", ") ??
              "",
            searchOutputFormat:
              layerInstanceSettings.searchOutputFormat ??
              layer?.searchSettings?.outputFormat ??
              "",
            searchGeometryField:
              layerInstanceSettings.searchGeometryField ??
              getLayerGeometryField(layer) ??
              "",
            definition:
              layerInstanceSettings.definition ??
              layer?.infoClickSettings?.definition ??
              "",
            format:
              layerInstanceSettings.format ??
              layer?.infoClickSettings?.format ??
              "application/json",
            sortProperty:
              layerInstanceSettings.sortProperty ??
              layer?.infoClickSettings?.sortProperty ??
              "",
            sortMethod:
              layerInstanceSettings.sortMethod ??
              layer?.infoClickSettings?.sortMethod ??
              "text",
            sortDescending:
              layerInstanceSettings.sortDescending ??
              layer?.infoClickSettings?.sortDescending ??
              false,
          };
        })()}
        availableStyles={
          selectedInfoClickLayer && getCapStyles[selectedInfoClickLayer]
            ? getCapStyles[selectedInfoClickLayer]
            : []
        }
      />
      <DialogWrapper
        fullWidth
        open={isDeleteDialogOpen}
        title={t("layers.deleteLayerConfirmTitle")}
        onClose={handleCloseDeleteDialog}
        actions={
          <>
            <Button
              variant="text"
              onClick={handleCloseDeleteDialog}
              color="primary"
              disabled={isDeletingLayer}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={isDeletingLayer || !isDeleteConfirmNameMatching}
              onClick={() => {
                void handleConfirmDelete();
              }}
              startIcon={
                isDeletingLayer ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <Typography>
          {t("layers.deleteLayerConfirmMessage", {
            name: layer?.name ?? "",
          })}
        </Typography>
        <TextField
          fullWidth
          autoComplete="off"
          margin="normal"
          label={t("layers.deleteLayerTypeNameLabel")}
          helperText={t("layers.deleteLayerTypeNameHelper", {
            name: layer?.name ?? "",
          })}
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          disabled={isDeletingLayer}
        />
      </DialogWrapper>
      <UnsavedChangesGuard when={isDirty || selectedLayersDirty} />
    </Page>
  );
}
