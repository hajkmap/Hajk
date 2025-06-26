import { useState, useRef, useMemo } from "react";
import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Button, Stack, TextField, useTheme, Link } from "@mui/material";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { RenderProps } from "../../components/form-factory/types/render";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
import { useServices, useServiceCapabilities } from "../../api/services";
import AvailableLayersGrid from "./available-layers-grid";
import { useRoles } from "../../api/users";
import { HttpError } from "../../lib/http-error";

export default function LayerSettings() {
  const { t } = useTranslation();
  const { layerId } = useParams<{ layerId: string }>();
  const { data: layer, isLoading, isError } = useLayerById(layerId ?? "");
  const { mutateAsync: updateLayer, status: updateStatus } = useUpdateLayer();
  const { mutateAsync: createRoleOnLayer } = useCreateAndUpdateRoleOnLayer();
  const { palette } = useTheme();
  const { data: services } = useServices();
  const { data: roles } = useRoles();
  const { data: roleOnLayer } = useGetRoleOnLayerByLayerId(layerId ?? "");

  const formRef = useRef<HTMLFormElement | null>(null);
  const { data: service, isLoading: serviceLoading } = useServiceByLayerId(
    layer?.id ?? "",
    !!layer?.id
  );
  const { mutateAsync: deleteLayer, status: deleteStatus } = useDeleteLayer(
    service?.id ?? ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectGridId, setSelectGridId] = useState<GridRowSelectionModel>();
  const [accordionExpanded, setAccordionExpanded] = useState<boolean>(false);
  const { layers: getCapLayers, styles: getCapStyles } = useServiceCapabilities(
    {
      baseUrl: service?.url ?? "",
      type: service?.type ?? "",
    }
  );

  const styles = layer?.selectedLayers.flatMap(
    (key) => getCapStyles[key] || []
  );
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const updateLayerContainer = new DynamicFormContainer<FieldValues>();
  const defaultValues = updateLayerContainer.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const watchSingleTileInput = watch("singleTile");
  const watchRoleIdInput = watch("roleId");

  const layerInformationSettings = new DynamicFormContainer<FieldValues>(
    t("common.information"),
    CONTAINER_TYPE.PANEL
  );
  const requestSettings = new DynamicFormContainer<FieldValues>(
    t("services.settings.request"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );

  const layerSettings = new DynamicFormContainer<FieldValues>(
    t("layers.settings"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );
  const displayFieldsSearchSettings = new DynamicFormContainer<FieldValues>(
    t("layers.settings.displayFields"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );
  const infoClickSettings = new DynamicFormContainer<FieldValues>(
    t("common.infoclick"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );
  const searchSettings = new DynamicFormContainer<FieldValues>(
    t("layers.settings.searchSettings"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );
  const infoButtonSettings = new DynamicFormContainer<FieldValues>(
    t("common.infobutton"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );
  const permissionSettings = new DynamicFormContainer<FieldValues>(
    t("layers.permissions"),
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: accordionExpanded }
  );

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 11,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: layer?.name,
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "serviceId",
    title: `${t("layers.common.service")}`,
    defaultValue: layer?.serviceId,
    optionList: services?.map((service) => ({
      title: service.name + `(${service.type})`,
      value: service.id,
    })),
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "internalName",
    title: `${t("layers.internalName")}`,
    defaultValue: layer?.internalName,
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "metadata.attribution",
    title: `${t("layers.copyRight")}`,
    defaultValue: layer?.metadata?.attribution,
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "description",
    title: `${t("map.description")}`,
    defaultValue: layer?.description,
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "options.keyword",
    title: `${t("layers.keyword")}`,
    defaultValue: layer?.options?.keyword,
  });

  layerInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "options.category",
    title: `${t("layers.category")}`,
    defaultValue: layer?.options?.category,
  });

  requestSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "hidpi",
    title: `${t("layers.hidpi")}`,
    defaultValue: layer?.hidpi,
  });

  requestSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "singleTile",
    title: "Single tile",
    defaultValue: layer?.singleTile,
  });

  requestSettings.addInput({
    type: INPUT_TYPE.NUMBER,
    gridColumns: 3,
    name: "customRatio",
    title: `${t("layers.customRatio")}`,
    defaultValue: layer?.customRatio,
    disabled: watchSingleTileInput === false,
  });

  requestSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "options.geoWebCache",
    title: "GeoWebCache",
    defaultValue: layer?.options?.geoWebCache,
  });

  layerSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "style",
    title: `${t("layers.style")}`,
    defaultValue: layer?.style ?? "",
    optionList: [
      { title: "<default>", value: "" },
      ...(styles?.map((style) => ({
        title: style.name,
        value: style.name,
      })) ?? []),
    ],
  });

  layerSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "opacity",
    title: `${t("layers.opacity")}`,
    defaultValue: layer?.opacity,
  });

  layerSettings.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "legendUrl",
    title: `${t("layers.legend")}`,
    gridColumns: 12,
    defaultValue: "",

    renderer: (props: RenderProps<FieldValues>) => {
      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          props.field?.onChange(file.name);
        }
      };

      return (
        <Stack spacing={1} direction="row" alignItems="center">
          <TextField
            fullWidth
            variant="filled"
            label={props.title}
            value={(props.field?.value as string) || ""}
            {...props.field}
            error={!!props.errorMessage}
            helperText={props.errorMessage}
          />

          <input
            accept="*"
            type="file"
            id="teckenForklaring-file-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <label htmlFor="teckenForklaring-file-upload">
            <Button
              sx={{ minWidth: "140px" }}
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              {t("layers.uploadFile")}
            </Button>
          </label>
        </Stack>
      );
    },
  });
  layerSettings.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "legendIconUrl",
    title: `${t("layers.legendIcon")}`,
    gridColumns: 12,
    defaultValue: "",

    renderer: (props: RenderProps<FieldValues>) => {
      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          props.field?.onChange(file.name);
        }
      };

      return (
        <Stack spacing={1} direction="row" alignItems="center">
          <TextField
            fullWidth
            variant="filled"
            label={props.title}
            value={(props.field?.value as string) || ""}
            {...props.field}
            error={!!props.errorMessage}
            helperText={props.errorMessage}
          />

          <input
            accept="*"
            type="file"
            id="teckenForklaringIkon-file-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <label htmlFor="teckenForklaringIkon-file-upload">
            <Button
              sx={{ minWidth: "140px" }}
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              {t("layers.uploadFile")}
            </Button>
          </label>
        </Stack>
      );
    },
  });

  layerSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "legendOptions",
    title: `${t("layers.legendOptions")}`,
    defaultValue: layer?.legendOptions,
  });

  layerSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "options.showAttributeTableButton",
    title: `${t("layers.showAttributeTableButton")}`,
    defaultValue: layer?.options?.showAttributeTableButton,
  });

  layerSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 8,
    name: "minMaxZoomAlertOnToggleOnly",
    title: `${t("layers.minMaxZoomAlertOnToggleOnly")}`,
    defaultValue: layer?.minMaxZoomAlertOnToggleOnly,
  });

  layerSettings.addInput({
    type: INPUT_TYPE.NUMBER,
    gridColumns: 6,
    name: "minZoom",
    title: `${t("layers.minZoom")}`,
    defaultValue: layer?.minZoom,
  });

  layerSettings.addInput({
    type: INPUT_TYPE.NUMBER,
    gridColumns: 6,
    name: "maxZoom",
    title: `${t("layers.maxZoom")}`,
    defaultValue: layer?.maxZoom,
  });

  displayFieldsSearchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD_ARRAY,
    gridColumns: 12,
    name: "searchSettings.primaryDisplayFields",
    title: `${t("layers.primaryDisplayFields")}`,
    defaultValue: layer?.searchSettings?.primaryDisplayFields,
  });

  displayFieldsSearchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD_ARRAY,
    gridColumns: 6,
    name: "searchSettings.secondaryDisplayFields",
    title: `${t("layers.secondaryDisplayFields")}`,
    defaultValue: layer?.searchSettings?.secondaryDisplayFields,
  });

  displayFieldsSearchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD_ARRAY,
    gridColumns: 6,
    name: "searchSettings.shortDisplayFields",
    title: `${t("layers.shortDisplayFields")}`,
    defaultValue: layer?.searchSettings?.shortDisplayFields,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 6,
    name: "infoClickActive",
    title: `${t("common.infoclick")}`,
    defaultValue: layer?.infoClickActive,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 12,
    name: "infoClickSettings.sortDescending",
    title: `${t("layers.infoClickDesc")}`,
    defaultValue: layer?.infoClickSettings?.sortDescending,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "infoClickSettings.definition",
    title: `${t("layers.infobox")}`,
    defaultValue: layer?.infoClickSettings?.definition,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "infoClickSettings.icon",
    title: `${t("layers.infoClickIcon")}`,
    slotProps: {
      input: {
        endAdornment: (
          <Link
            sx={{ ml: 1 }}
            href="https://fonts.google.com/icons"
            target="_blank"
          >
            {t("layers.listLink")}
          </Link>
        ),
      },
    },
    defaultValue: layer?.infoClickSettings?.icon,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "infoClickSettings.sortProperty",
    title: `${t("layers.sortByAttribute")}`,
    defaultValue: layer?.infoClickSettings?.sortProperty,
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "infoClickSettings.format",
    title: `${t("layers.infoClickFormat")}`,
    defaultValue: layer?.infoClickSettings?.format,
    optionList: infoClickFormat.map((format) => ({
      title: format.title,
      value: format.value,
    })),
  });

  infoClickSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "infoClickSettings.sortMethod",
    title: `${t("layers.infoClickSortMethod")}`,
    defaultValue: layer?.infoClickSettings?.sortMethod,
    optionList: sortType.map((type) => ({
      title: type.title,
      value: type.value,
    })),
  });

  infoClickSettings.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "infoClickPreview",
    title: "Förhandsvisa infoklick",
    gridColumns: 12,
    defaultValue: "",

    renderer: () => {
      return (
        <Button
          sx={{ minWidth: "120px", width: "100%" }}
          variant="contained"
          component="span"
        >
          Förhandsvisa infoklick
        </Button>
      );
    },
  });

  searchSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "searchSettings.active",
    title: `${t("layers.searchSettings.active")}`,
    defaultValue: layer?.searchSettings?.active,
  });
  searchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "searchSettings.url",
    title: `Url`,
    defaultValue: layer?.searchSettings?.url,
  });
  searchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD_ARRAY,
    gridColumns: 12,
    name: "searchSettings.searchFields",
    title: `${t("layers.searchSettings.searchFields")}`,
    defaultValue: layer?.searchSettings?.searchFields,
  });
  searchSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "searchSettings.outputFormat",
    title: `${t("layers.searchSettings.outputFormat")}`,
    defaultValue: layer?.searchSettings?.outputFormat,
    optionList: searchOutputFormat.map((format) => ({
      title: format,
      value: format,
    })),
  });
  searchSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "searchSettings.geometryField",
    title: `${t("layers.searchSettings.geometryField")}`,
    defaultValue: layer?.searchSettings?.geometryField,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "showMetadata",
    title: `${t("layers.showMetadata")}`,
    defaultValue: layer?.showMetadata,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "metadata.title",
    title: `${t("layers.metadata.title")}`,
    defaultValue: layer?.metadata?.title,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "metadata.urlTitle",
    title: `${t("layers.metadata.urlTitle")}`,
    defaultValue: layer?.metadata?.urlTitle,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "metadata.url",
    title: "Url",
    defaultValue: layer?.metadata?.url,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "options.layerDisplayDescription",
    title: `${t("layers.layerDisplayDescription")}`,
    defaultValue: layer?.options?.layerDisplayDescription,
  });
  permissionSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "roleId",
    title: `${t("layers.permission")}`,
    defaultValue: roleOnLayer?.roleId,
    optionList: roles?.map((role) => ({
      title: role.title,
      value: role.id,
    })),
  });

  updateLayerContainer.addContainer([
    layerInformationSettings,
    requestSettings,
    layerSettings,
    displayFieldsSearchSettings,
    infoClickSettings,
    searchSettings,
    infoButtonSettings,
    permissionSettings,
  ]);

  const filteredLayers = useMemo(() => {
    if (!getCapLayers) return [];

    const searchAndSelectedFilteredLayers = getCapLayers
      .map((layer, index) => {
        const isSelected = selectGridId?.includes(index);
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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          layer?.selected || // Disable lint here since ?? is messing with the data-grid search logic
          layer.layer.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [getCapLayers, searchTerm]);

  const selectedRowsData = useMemo(
    () =>
      selectGridId?.map((id) => filteredLayers.find((row) => row.id === id)),
    [selectGridId, filteredLayers]
  );

  const selectedRowObjects = useMemo(
    () => selectedRowsData?.map((row) => row?.layer ?? ""),
    [selectedRowsData]
  );

  const handleUpdateLayer = async (layerData: LayerUpdateInput) => {
    try {
      const payload = {
        name: layerData.name,
        serviceId: layerData.serviceId,
        selectedLayers: layerData.selectedLayers,
        internalName: layerData.internalName,
        description: layerData.description,
        hidpi: layerData.hidpi,
        singleTile: layerData.singleTile,
        customRatio: layerData.customRatio,
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
        options: {
          keyword: layerData?.options?.keyword,
          category: layerData?.options?.category,
          geoWebCache: layerData?.options?.geoWebCache,
          showAttributeTableButton:
            layerData?.options?.showAttributeTableButton,
          layerDisplayDescription: layerData?.options?.layerDisplayDescription,
        },
        metadata: {
          title: layerData?.metadata?.title,
          url: layerData?.metadata?.url,
          urlTitle: layerData?.metadata?.urlTitle,
          attribution: layerData?.metadata?.attribution,
          updated: layerData?.metadata?.updated,
          userId: layerData?.metadata?.userId,
        },
        searchSettings: {
          active: layerData?.searchSettings?.active,
          url: layerData?.searchSettings?.url,
          searchFields: layerData?.searchSettings?.searchFields,
          outputFormat: layerData?.searchSettings?.outputFormat,
          geometryField: layerData?.searchSettings?.geometryField,
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
      };

      await updateLayer({
        layerId: layer?.id ?? "",
        data: payload,
      });
      toast.success(t("layers.updateLayerSuccess", { name: layerData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });

      await createRoleOnLayer({
        layerId: layer?.id ?? "",
        roleId: watchRoleIdInput as string,
      });
    } catch (error) {
      console.error("Failed to update layer:", error);
      toast.error(t("layers.updateLayerFailed", { name: layer?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleDeleteLayer = async () => {
    if (!isLoading && layer?.id) {
      try {
        await deleteLayer(layer.id ?? "");
        toast.success(t("layers.deleteLayerSuccess", { name: layer?.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      } catch (error) {
        console.log(error);
        toast.error(t("layers.deleteLayerFailed", { name: layer?.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.log("Layer data is still loading or unavailable.");
    }
  };
  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const layerData = data as LayerUpdateInput;
      void handleUpdateLayer({
        ...layerData,
        selectedLayers: selectedRowObjects,
      });
    },
  });

  const updatedByUser =
    typeof layer?.metadata?.updatedBy === "object" &&
    layer.metadata.updatedBy &&
    "fullName" in (layer.metadata.updatedBy as { fullName?: string })
      ? (layer.metadata.updatedBy as { fullName: string }).fullName
      : "";

  const formatedLastSavedDate =
    typeof layer?.metadata?.updated === "string"
      ? new Date(layer.metadata.updated).toLocaleString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!layer) {
    throw new HttpError(404, "Layer not found");
  }
  if (isError) return <div>Error fetching layer details.</div>;

  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        name={layer?.name}
        updateStatus={updateStatus}
        deleteStatus={deleteStatus}
        onUpdate={handleExternalSubmit}
        onDelete={handleDeleteLayer}
        lastSavedBy={updatedByUser}
        lastSavedDate={formatedLastSavedDate}
        dirtyFields={dirtyFields}
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={
                accordionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              onClick={() => setAccordionExpanded(!accordionExpanded)}
              size="small"
            >
              {accordionExpanded
                ? t("common.collapseAll")
                : t("common.expandAll")}
            </Button>
          </Stack>
          <FormRenderer
            formControls={updateLayerContainer}
            formGetValues={getValues}
            register={register}
            control={control}
            errors={errors}
            showSearch={true}
            preserveSearchState={true}
          />
          {layer && (
            <AvailableLayersGrid
              isLoading={serviceLoading}
              getCapLayers={getCapLayers}
              selectedLayers={layer?.selectedLayers ?? []}
              filteredLayers={filteredLayers}
              setSearchTerm={setSearchTerm}
              setSelectGridId={setSelectGridId}
              searchTerm={searchTerm}
              selectGridId={selectGridId}
              selectedRowObjects={selectedRowObjects}
            />
          )}
          <UsedInMapsGrid />
        </form>
      </FormActionPanel>
    </Page>
  );
}
