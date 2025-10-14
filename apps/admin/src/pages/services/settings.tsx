import { useParams } from "react-router";
import { useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { FieldValues } from "react-hook-form";
import {
  useTheme,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  useServiceById,
  useUpdateService,
  useDeleteService,
  useLayersByServiceId,
  SERVICE_TYPE,
  ServiceUpdateInput,
  serverTypes,
  versions,
  imageFormats,
  useProjections,
  useServiceCapabilities,
} from "../../api/services";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import DialogWrapper from "../../components/flexible-dialog";
import LayersGrid from "./layers-grid";
import { toast } from "react-toastify";

import FormActionPanel from "../../components/form-action-panel";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import useAppStateStore from "../../store/use-app-state-store";
import { HttpError } from "../../lib/http-error";

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const [dialogServiceType, setDialogServiceType] = useState(
    service?.type ?? ""
  );

  const { data: projections } = useProjections();
  const epsgProjections =
    projections?.filter((projection) => projection.code.startsWith("EPSG:")) ??
    [];
  const epsgProjectionsMap = epsgProjections?.map((projection) => ({
    title: projection.code,
    value: projection.code,
  }));
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: deleteService, status: deleteStatus } =
    useDeleteService();
  const { data: layersByServiceId } = useLayersByServiceId(serviceId ?? "");
  const count = layersByServiceId?.count ?? 0;
  const { defaultCoordinates } = useAppStateStore.getState();
  const {
    layers: getCapLayers,
    workspaces: getCapWorkspaces,
    isError: layersError,
    isLoading: layersLoading,
  } = useServiceCapabilities({
    baseUrl: service?.url ?? "",
    type: service?.type ?? "",
  });
  const [updateServiceDefaultData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setDialogUrl(getValues("url") as string);
    setDialogServiceType(getValues("type") as string);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSaveUrl = () => {
    setValue("url", dialogUrl);
    setValue("type", dialogServiceType);
    handleDialogClose();
  };

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleUpdateService = async (serviceData: ServiceUpdateInput) => {
    try {
      const payload = {
        name: serviceData.name,
        url: serviceData.url,
        type: serviceData.type,
        serverType: serviceData.serverType,
        version: serviceData.version,
        imageFormat: serviceData.imageFormat,
        workspace: serviceData.workspace,
        getMapUrl: serviceData.getMapUrl,
        comment: serviceData.comment,
        projection: {
          code: serviceData.projection?.code,
        },
        metadata: {
          description: serviceData.metadata?.description,
          owner: serviceData.metadata?.owner,
        },
      };
      await updateService({
        serviceId: service?.id ?? "",
        data: payload,
      });
      toast.success(
        t("services.updateServiceSuccess", { name: serviceData.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(t("services.updateServiceFailed", { name: service?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // TODO?: Add delete service
  const handleDeleteService = async () => {
    if (!isLoading && service?.id) {
      try {
        await deleteService(service.id);
        toast.success(
          t("services.deleteServiceSuccess", { name: service.name }),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          }
        );
      } catch (error) {
        console.error("Deletion failed:", error);
        toast.error(t("services.deleteServiceFailed", { name: service.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.error("Service data is still loading or unavailable.");
    }
  };

  const updateServiceContainer = new DynamicFormContainer<FieldValues>();

  const serviceInformationSettings = new DynamicFormContainer<FieldValues>(
    t("common.information"),
    CONTAINER_TYPE.PANEL
  );
  const connectionSettings = new DynamicFormContainer<FieldValues>(
    t("common.connection"),
    CONTAINER_TYPE.ACCORDION
  );
  const requestSettings = new DynamicFormContainer<FieldValues>(
    t("services.settings.request"),
    CONTAINER_TYPE.ACCORDION
  );
  const infoButtonSettings = new DynamicFormContainer<FieldValues>(
    t("common.infobutton"),
    CONTAINER_TYPE.ACCORDION
  );

  serviceInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: service?.name,
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  serviceInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "type",
    title: `${t("common.serviceType")}`,
    defaultValue: service?.type,
    disabled: true,
    gridColumns: 10,
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });
  serviceInformationSettings.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 10,
    name: "comment",
    title: `${t("services.description")}`,
    defaultValue: service?.comment,
  });

  connectionSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "serverType",
    title: `${t("common.serverType")}`,
    defaultValue: service?.serverType,
    registerOptions: { required: `${t("common.required")}` },
    optionList: serverTypes.map((serverType) => ({
      title: serverType.title,
      value: serverType.value,
    })),
  });
  connectionSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "url",
    disabled: true,
    title: "Url",
    defaultValue: service?.url,
    slotProps: {
      inputLabel: {
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "calc(100% - 120px)",
        },
      },
      input: {
        endAdornment: (
          <>
            <Button
              sx={{
                color: palette.primary.main,
                width: "100%",
                maxWidth: "120px",
                fontWeight: "600",
              }}
              size="small"
              onClick={handleDialogOpen}
            >
              {t("services.url.btnLabel")}
            </Button>
          </>
        ),
      },
    },
  });
  connectionSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "workspace",
    title: `${t("services.workspace")}`,
    defaultValue: service?.workspace ?? "All",
    optionList: [
      { title: `${t("common.all")}`, value: "All" },
      ...(getCapWorkspaces?.map((workspace) => ({
        title: workspace,
        value: workspace,
      })) ?? []),
    ],
  });

  requestSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "getMapUrl",
    title: `GetMap-url`,
    defaultValue: service?.getMapUrl,
  });
  requestSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "version",
    title: "Version",
    defaultValue: service?.version,
    optionList: versions.map((version) => ({
      title: version.title,
      value: version.value,
    })),
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  requestSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "imageFormat",
    title: `${t("services.imageFormats")}`,
    defaultValue: service?.imageFormat,
    optionList: imageFormats.map((formats) => ({
      title: formats.title,
      value: formats.value,
    })),
  });

  requestSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "projection.code",
    title: `${t("services.coordinateSystem")}`,
    defaultValue: service?.projection.code,
    optionList: defaultCoordinates.map(
      (value) =>
        epsgProjectionsMap?.find((item) => item.value === value) ?? {
          title: "",
          value: "",
        }
    ),
  });

  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "metadata.owner",
    title: `${t("services.owner")}`,
    defaultValue: service?.metadata?.owner,
  });
  infoButtonSettings.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "metadata.description",
    title: `${t("services.layerDescription")}`,
    defaultValue: service?.metadata?.description,
  });

  updateServiceContainer.addContainer([
    serviceInformationSettings,
    connectionSettings,
    requestSettings,
    infoButtonSettings,
  ]);

  const defaultValues = updateServiceDefaultData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceUpdateInput;
      void handleUpdateService(serviceData);
    },
  });

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!service) {
    throw new HttpError(404, "Service not found");
  }

  if (isError) return <div>Error fetching service details.</div>;

  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        lastSavedBy="Anonym"
        lastSavedDate="2023-04-11 13:37"
        saveButtonText="Spara"
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <FormRenderer
            formControls={updateServiceContainer}
            formGetValues={getValues}
            register={register}
            control={control}
            errors={errors}
          />
          <LayersGrid
            layers={getCapLayers}
            serviceId={service.id}
            isError={layersError}
            isLoading={layersLoading}
          />
        </form>
      </FormActionPanel>
      <DialogWrapper
        fullWidth
        open={isDialogOpen}
        title={t("services.settings.dialog.title")}
        onClose={handleDialogClose}
        actions={
          <>
            <Button variant="text" onClick={handleDialogClose} color="primary">
              {t("common.dialog.closeBtn")}
            </Button>
            <Button onClick={handleSaveUrl} color="primary" variant="contained">
              {t("common.dialog.saveBtn")}
            </Button>
          </>
        }
      >
        {count >= 1 && (
          <Trans
            i18nKey="services.affectedLayers"
            values={{ count: layersByServiceId?.count }}
            components={{ strong: <strong /> }}
          />
        )}
        <TextField
          label="Url"
          value={dialogUrl}
          fullWidth
          variant="outlined"
          onChange={(e) => setDialogUrl(e.target.value)}
          error={!!errors.url}
          margin="normal"
        />
        <FormControl
          sx={{ mt: 2, width: "100%", maxWidth: "150px" }}
          fullWidth
          error={!!errors.type}
        >
          <InputLabel id="type">{t("common.serviceType")}</InputLabel>
          <Select
            label={t("common.serviceType")}
            value={dialogServiceType}
            variant="outlined"
            onChange={(e) => setDialogServiceType(e.target.value)}
          >
            {Object.keys(SERVICE_TYPE).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogWrapper>
    </Page>
  );
}
