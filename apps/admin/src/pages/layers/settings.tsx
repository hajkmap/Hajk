import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Button, Stack, TextField, useTheme } from "@mui/material";
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
} from "../../api/layers";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import { useServices } from "../../api/services";

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

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const [formLayerData, setFormLayerData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

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
    gridColumns: 8,
    name: "serviceId",
    title: "Tjänst",
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
    gridColumns: 8,
    name: "layerService",
    title: `Lagernamn i tjänsten`,
    defaultValue: "",
    optionList: [{ title: "Testlayer", value: "Testlayer" }],
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "adminName",
    title: `Internt adminnamn`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "copyRight",
    title: `Upphovsrätt`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "descriptionLayer",
    title: `Beskrivning av lagret`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "keyWord",
    title: `Nyckelord`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "category",
    title: `Kategori`,
    defaultValue: "",
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "imageFormat",
    title: `Bildformat`,
    defaultValue: "",
    optionList: [{ title: "Testlayer", value: "Testlayer" }],
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "coordinateSystem",
    title: `Koordinatsystem`,
    defaultValue: "",
    optionList: [{ title: "Testlayer", value: "Testlayer" }],
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "dpi",
    title: "Efterfråga hög DPI",
    defaultValue: false,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "singleTile",
    title: "Single tile",
    defaultValue: false,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "customRatio",
    title: `Custom ratio`,
    defaultValue: "",
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "gwc",
    title: "GeoWebCache",
    defaultValue: false,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "style",
    title: `Stil`,
    defaultValue: "",
    optionList: [{ title: "<default>", value: "default" }],
  });

  accordionNestedContainer2.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "teckenForklaring",
    title: "Teckenförklaring",
    gridColumns: 8,
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
              sx={{ minWidth: "120px" }}
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Välj fil
            </Button>
          </label>
        </Stack>
      );
    },
  });
  accordionNestedContainer2.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "teckenForklaringIkon",
    title: "Teckenförklaringsikon",
    gridColumns: 8,
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
              sx={{ minWidth: "120px" }}
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Välj fil
            </Button>
          </label>
        </Stack>
      );
    },
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "attributes",
    title: "Visa kanpp för attributtabell",
    defaultValue: false,
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "opacity",
    title: `Opacitet`,
    defaultValue: "",
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "minZoom",
    title: `Minsta zoom`,
    defaultValue: "",
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "maxZoom",
    title: `Maximal zoom`,
    defaultValue: "",
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 8,
    name: "warningZoom",
    title: `Visa endast varningruta för min/max vid klick`,
    defaultValue: false,
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "displayField",
    title: `Visningsfält`,
    defaultValue: "",
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "secondaryDisplayField",
    title: `Sekundära visnigsfält`,
    defaultValue: "",
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "shortDisplayField",
    title: `Kort visningsfält`,
    defaultValue: "",
  });

  accordionNestedContainer4.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "infoClickPreview",
    title: "Förhandsvisa infoklick",
    gridColumns: 4,
    defaultValue: "",

    renderer: () => {
      return (
        <Button sx={{ minWidth: "120px" }} variant="contained" component="span">
          Förhandsvisa infoklick
        </Button>
      );
    },
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "infoClick",
    title: `Infoklick`,
    defaultValue: false,
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "infoBox",
    title: `Inforuta`,
    defaultValue: "",
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "infoClickIcon",
    title: `Infoklick ikon (lista)`,
    defaultValue: "",
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "infoClickFormat",
    title: `Infoclick-format`,
    defaultValue: "",
    optionList: [{ title: "Testformat", value: "Testformat" }],
  });
  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "infoClickSortByAttribute",
    title: `Infoklick sortera på attribut`,
    defaultValue: "",
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "infoClickSortByDesc",
    title: `Infoklick sortera fallande`,
    defaultValue: false,
  });
  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "infoClickSortType",
    title: `Infoklick soteringstyp`,
    defaultValue: "",
    optionList: [{ title: "String", value: "String" }],
  });

  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "activateSearch",
    title: `Aktivera sökning`,
    defaultValue: false,
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "url",
    title: `Url`,
    defaultValue: "",
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "searchField",
    title: `Sökfält`,
    defaultValue: "",
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "outDataFormat",
    title: `Utdataformat`,
    defaultValue: "",
  });
  accordionNestedContainer5.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "geometryField",
    title: `Geometrifält`,
    defaultValue: "",
  });
  accordionNestedContainer6.addInput({
    type: INPUT_TYPE.CHECKBOX,
    gridColumns: 10,
    name: "infoButtonActiveLayer",
    title: `Infoknapp synlig för lager`,
    defaultValue: false,
  });
  accordionNestedContainer6.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "layerDescription",
    title: `Visningsbeskrivning av lager`,
    defaultValue: "",
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

  const defaultValues = formLayerData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const formFields = watch();

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
        isChangedFields={true}
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <FormRenderer
            formControls={layerSettingsFormContainer}
            formFields={formFields}
            register={register}
            control={control}
            errors={errors}
          />
          <UsedInMapsGrid />
        </form>
      </FormActionPanel>
    </Page>
  );
}
