import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Button, Stack, TextField, useTheme, Link } from "@mui/material";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { RenderProps } from "../../components/form-factory/types/render";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UsedInMapsGrid from "./used-in-maps-grid";
import {
  useLayers,
  useLayerById,
  useDeleteLayer,
  LayerUpdateInput,
  useUpdateLayer,
  infoClickFormat,
  sortType,
  searchOutputFormat,
} from "../../api/layers";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import { useServices } from "../../api/services";
import AvailableLayersGrid from "./available-layers-grid";
import { useServiceCapabilities } from "../../api/services";
import { useServiceByLayerId } from "../../api/layers";

export default function LayerSettings() {
  const { t } = useTranslation();
  const { layerId } = useParams<{ layerId: string }>();
  const { isLoading, isError } = useLayerById(layerId ?? "");
  const { data: layers } = useLayers();
  const layer = layers?.find((l) => l.id === layerId);
  const { mutateAsync: updateLayer, status: updateStatus } = useUpdateLayer();
  const { mutateAsync: deleteLayer, status: deleteStatus } = useDeleteLayer();
  const { palette } = useTheme();
  const { data: services } = useServices();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { data: service, isLoading: serviceLoading } = useServiceByLayerId(
    layer?.id ?? ""
  );

  console.log("layer", layer);

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

  const [formLayerData, setFormLayerData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());
  const defaultValues = formLayerData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const watchSingleTile = watch("singleTile");

  const layerSettingsFormContainer = new DynamicFormContainer<FieldValues>();
  const panelNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL
  );
  const accordionNestedContainer = new DynamicFormContainer<FieldValues>(
    t("Inställningar för request"),
    CONTAINER_TYPE.ACCORDION
  );

  const accordionNestedContainer2 = new DynamicFormContainer<FieldValues>(
    "Inställningar för lager",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer3 = new DynamicFormContainer<FieldValues>(
    "Presentation vid resultat",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer4 = new DynamicFormContainer<FieldValues>(
    "Infoklick",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer5 = new DynamicFormContainer<FieldValues>(
    "Sökinställningar",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer6 = new DynamicFormContainer<FieldValues>(
    "Infoknapp",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer7 = new DynamicFormContainer<FieldValues>(
    "Behörighet",
    CONTAINER_TYPE.ACCORDION
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: layer?.name,
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
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

  panelNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "layerService",
    title: `${t("layers.common.layerNameInService")}`,
    defaultValue: "",
    optionList: [{ title: "Testlayer", value: "Testlayer" }],
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "internalName",
    title: `${t("layers.internalName")}`,
    defaultValue: layer?.internalName,
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "attribution",
    title: `${t("layers.copyRight")}`,
    defaultValue: layer?.metadata?.attribution,
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "description",
    title: `${t("map.description")}`,
    defaultValue: layer?.description,
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "options.keyword",
    title: `${t("layers.keyword")}`,
    defaultValue: layer?.options?.keyword,
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "options.category",
    title: `${t("layers.category")}`,
    defaultValue: layer?.options?.category,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "hidpi",
    title: `${t("layers.hidpi")}`,
    defaultValue: layer?.hidpi,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "singleTile",
    title: "Single tile",
    defaultValue: layer?.singleTile,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    gridColumns: 3,
    name: "customRatio",
    title: `${t("layers.customRatio")}`,
    defaultValue: layer?.customRatio,
    disabled: watchSingleTile === false,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "options.geoWebCache",
    title: "GeoWebCache",
    defaultValue: layer?.options?.geoWebCache,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "style",
    title: `${t("layers.style")}`,
    defaultValue: "",
    optionList: [
      { title: "<default>", value: "<default>" },
      ...(styles?.map((style) => ({
        title: style,
        value: style,
      })) ?? []),
    ],
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "opacity",
    title: `${t("layers.opacity")}`,
    defaultValue: layer?.opacity,
  });

  accordionNestedContainer2.addCustomInput({
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
  accordionNestedContainer2.addCustomInput({
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

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "options.showAttributeTableButton",
    title: `${t("layers.showAttributeTableButton")}`,
    defaultValue: layer?.options?.showAttributeTableButton,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 8,
    name: "minMaxZoomAlertOnToggleOnly",
    title: `${t("layers.minMaxZoomAlertOnToggleOnly")}`,
    defaultValue: layer?.minMaxZoomAlertOnToggleOnly,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "minZoom",
    title: `${t("layers.minZoom")}`,
    defaultValue: layer?.minZoom,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "maxZoom",
    title: `${t("layers.maxZoom")}`,
    defaultValue: layer?.maxZoom,
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "searchSettings.primaryDisplayFields",
    title: `${t("layers.primaryDisplayFields")}`,
    defaultValue: layer?.searchSettings?.primaryDisplayFields,
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "searchSettings.secondaryDisplayFields",
    title: `${t("layers.secondaryDisplayFields")}`,
    defaultValue: layer?.searchSettings?.secondaryDisplayFields,
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "searchSettings.shortDisplayFields",
    title: `${t("layers.shortDisplayFields")}`,
    defaultValue: layer?.searchSettings?.shortDisplayFields,
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 6,
    name: "infoClickActive",
    title: `${t("common.infoclick")}`,
    defaultValue: layer?.infoClickActive,
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 12,
    name: "infoClickSettings.sortDescending",
    title: `${t("layers.infoClickDesc")}`,
    defaultValue: layer?.infoClickSettings?.sortDescending,
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "infoClickSettings.definition",
    title: `${t("layers.infobox")}`,
    defaultValue: layer?.infoClickSettings?.definition,
  });

  accordionNestedContainer4.addInput({
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

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "infoClickSettings.sortProperty",
    title: `${t("layers.sortByAttribute")}`,
    defaultValue: layer?.infoClickSettings?.sortProperty,
  });

  accordionNestedContainer4.addInput({
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

  accordionNestedContainer4.addInput({
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

  accordionNestedContainer4.addCustomInput({
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

  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "searchSettings.active",
    title: `${t("layers.searchSettings.active")}`,
    defaultValue: layer?.searchSettings?.active,
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "searchSettings.url",
    title: `Url`,
    defaultValue: layer?.searchSettings?.url,
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "searchSettings.searchFields",
    title: `${t("layers.searchSettings.searchFields")}`,
    defaultValue: layer?.searchSettings?.searchFields,
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "searchSettings.outputFormat",
    title: `${t("layers.searchSettings.searchFields")}`,
    defaultValue: layer?.searchSettings?.outputFormat,
    optionList: searchOutputFormat.map((format) => ({
      title: format,
      value: format,
    })),
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "searchSettings.geometryField",
    title: `${t("layers.searchSettings.geometryField")}`,
    defaultValue: layer?.searchSettings?.geometryField,
  });
  accordionNestedContainer6.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "showMetadata",
    title: `${t("layers.showMetadata")}`,
    defaultValue: layer?.showMetadata,
  });
  accordionNestedContainer6.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "options.layerDisplayDescription",
    title: `${t("layers.layerDisplayDescription")}`,
    defaultValue: layer?.options?.layerDisplayDescription,
  });
  accordionNestedContainer7.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "competence",
    title: `Behörighet`,
    defaultValue: "",
    optionList: [
      { title: "BYGGLOV_PERSONAL_ADM", value: "BYGGLOV_PERSONAL_ADM" },
      { title: "IT_PERSONAL_ADM", value: "IT_PERSONAL_ADM" },
      { title: "String", value: "String" },
    ],
  });

  layerSettingsFormContainer.addContainer([
    panelNestedContainer,
    accordionNestedContainer,
    accordionNestedContainer2,
    accordionNestedContainer3,
    accordionNestedContainer4,
    accordionNestedContainer5,
    accordionNestedContainer6,
    accordionNestedContainer7,
  ]);

  const handleUpdateLayer = async (layerData: LayerUpdateInput) => {
    try {
      const payload = {
        name: layerData.name,
        serviceId: layerData.serviceId,
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
        options: {
          keyword: layerData?.options?.keyword,
          category: layerData?.options?.category,
          geoWebCache: layerData?.options?.geoWebCache,
          showAttributeTableButton:
            layerData?.options?.showAttributeTableButton,
          layerDisplayDescription: layerData?.options?.layerDisplayDescription,
        },
        metadata: {
          attribution: layerData?.metadata?.attribution,
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
      void navigate("/layers");
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
        await deleteLayer(layer.id);
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
      void handleUpdateLayer(layerData);
    },
  });

  useEffect(() => {
    setFormLayerData(layerSettingsFormContainer);
  }, [layer]);

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (isError) return <div>Error fetching layer details.</div>;
  if (!layers) return <div>Layers not found.</div>;
  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        deleteStatus={deleteStatus}
        onUpdate={handleExternalSubmit}
        onDelete={handleDeleteLayer}
        lastSavedBy="Anonym"
        lastSavedDate="2023-04-11 13:37"
        saveButtonText="Spara"
        deleteButtonText="Ta bort"
        navigateTo="/layers"
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <FormRenderer
            formControls={layerSettingsFormContainer}
            formGetValues={getValues}
            register={register}
            control={control}
            errors={errors}
          />
          {layer && (
            <AvailableLayersGrid
              isLoading={serviceLoading}
              getCapLayers={getCapLayers}
              selectedLayers={layer?.selectedLayers ?? []}
            />
          )}
          <UsedInMapsGrid />
        </form>
      </FormActionPanel>
    </Page>
  );
}
