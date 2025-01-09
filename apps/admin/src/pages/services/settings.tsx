import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
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
  useServices,
  useLayersByServiceId,
  serviceTypes,
  ServiceUpdateFormData,
  serverTypes,
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

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { isError, isLoading } = useServiceById(serviceId ?? "");
  const { data: services } = useServices();
  const service = services?.find((s) => s.id === serviceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const [dialogServiceType, setDialogServiceType] = useState(
    service?.type ?? ""
  );
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: deleteService, status: deleteStatus } =
    useDeleteService();
  const { data: layersByServiceId } = useLayersByServiceId(serviceId ?? "");
  const count = layersByServiceId?.count ?? 0;

  const [formServiceData, setFormServiceData] = useState<
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

  const handleUpdateService = async (serviceData: ServiceUpdateFormData) => {
    try {
      const payload = {
        name: serviceData.name,
        url: serviceData.url,
        type: serviceData.type,
        serverType: serviceData.serverType,
        version: serviceData.version,
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
      setIsDialogOpen(false);
      void navigate("/services");
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(t("services.updateServiceFailed", { name: service?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

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

  const serviceSettingsFormContainer = new DynamicFormContainer<FieldValues>();
  const panelNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL
  );
  const accordionNestedContainer = new DynamicFormContainer<FieldValues>(
    t("common.connection"),
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer2 = new DynamicFormContainer<FieldValues>(
    t("services.settings.accordionTitle1"),
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer3 = new DynamicFormContainer<FieldValues>(
    t("common.infobutton"),
    CONTAINER_TYPE.ACCORDION
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: service?.name,
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  panelNestedContainer.addInput({
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
  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 10,
    name: "description",
    title: `${t("services.description")}`,
  });

  accordionNestedContainer.addInput({
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
  accordionNestedContainer.addInput({
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
  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "workSpace",
    title: `${t("services.workspace")}`,
    defaultValue: "WORKSPACE_1",
    optionList: [
      { title: "Workspace 1", value: "WORKSPACE_1" },
      { title: "Workspace 2", value: "WORKSPACE_2" },
    ],
  });
  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "getMapUrl",
    title: `GetMap-url`,
  });
  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "version",
    title: "Version",
    defaultValue: service?.version,
    optionList: [
      { title: "1.1.1", value: "1.1.1" },
      { title: "1.3.0", value: "1.3.0" },
    ],
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "coordinateSystem",
    title: `${t("services.coordinateSystem")}`,
    defaultValue: "EPSG:3006",
    optionList: [
      { title: "EPSG:3006", value: "EPSG:3006" },
      { title: "EPSG:3007", value: "EPSG:3007" },
      { title: "EPSG:4326", value: "EPSG:4326" },
    ],
  });

  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "owner",
    title: `${t("services.owner")}`,
  });
  accordionNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "layerDescription",
    title: `${t("services.layerDescription")}`,
  });

  serviceSettingsFormContainer.addContainer([
    panelNestedContainer,
    accordionNestedContainer,
    accordionNestedContainer2,
    accordionNestedContainer3,
  ]);

  const defaultValues = formServiceData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceUpdateFormData;
      void handleUpdateService(serviceData);
    },
  });

  const currentValues = watch();

  const hasChanges = Object.keys(currentValues).some(
    (key) =>
      currentValues[key as keyof ServiceUpdateFormData] !==
      defaultValues[key as keyof ServiceUpdateFormData]
  );

  const isChanged = hasChanges && Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    if (!service) return;
    setFormServiceData(serviceSettingsFormContainer);
    setDialogUrl(service.url);
  }, [service]);

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (isError) return <div>Error fetching service details.</div>;
  if (!service) return <div>Service not found.</div>;

  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        deleteStatus={deleteStatus}
        onUpdate={handleExternalSubmit}
        onDelete={handleDeleteService}
        lastSavedBy="Anonym"
        lastSavedDate="2023-04-11 13:37"
        saveButtonText="Spara"
        deleteButtonText="Ta bort"
        navigateTo="/services"
        isChangedFields={isChanged}
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <FormRenderer
            data={formServiceData}
            register={register}
            control={control}
            errors={errors}
          />
          <LayersGrid baseUrl={service?.url ?? ""} type={service?.type ?? ""} />
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
            {serviceTypes.map((type) => (
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
